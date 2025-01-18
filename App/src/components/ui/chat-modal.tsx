"use client";

import { ChatMessageList } from "@/components/ui/chat/chat-message-list";

import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { useEffect, useState } from "react";

import ChatInputComponent from "./chat-input";

import { ChatInput } from "@/components/ui/chat/chat-input";
import { Button } from "@chatscope/chat-ui-kit-react";
import { API_URL } from "@/lib/config";
import { Input } from "@/components/ui/input";

import { Pencil } from "lucide-react";
import { Socket } from "socket.io-client";



export default function ChatModal({
  chatId,
  newChat,
  workerToken,
  refresh,
  socket,
  setWorkerChats,
}: {
  chatId: string;
  newChat: any;
  workerToken: string;
  refresh: boolean;
  socket: Socket | null;
  setWorkerChats: (chats: any) => void;
}) {
  const [chat, setChat] = useState<any[]>([]);
  const [userToken, setUserToken] = useState<string>("");
  const [chatData, setChatData] = useState<any>({});

  const [editingMessage, setEditingMessage] = useState<{
    timestamp: number;
    msg: string;
  } | null>(null);

  async function getChat() {
    const res = await fetch(`${API_URL}/worker/get-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        auth: workerToken,
      },
      body: JSON.stringify({ chatId }),
    });
    const data = await res.json();
    setChatData(data);
    setChat(data?.chat);
    setUserToken(data?.userToken);
    console.log("chat:", data);
  }


  useEffect(() => {
    if (refresh) {
      getChat();
    }
  }, [refresh]);

  async function disconnect() {
    await fetch(`${API_URL}/disconnect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        auth: workerToken,
      },
      body: JSON.stringify({ chatId, userToken: userToken, party: "web" }),
    });
    setWorkerChats((prevChats: any) =>
      prevChats.map((chat: any) =>
        chat.chatId === chatId
          ? { ...chat, disconnect: { time: Date.now() } }
          : chat
      )
    );
  }

  useEffect(() => {
    if (newChat) {
      const newChats = newChat
        ?.map((chat: any) => (chat.chatId === chatId ? chat.msg : null))
        .filter(Boolean);

      if (newChats.length > 0) {
        const latestMsg = newChats[newChats.length - 1];

        setChat((prevChat) => {
          // Check if message with same timestamp exists
          const existingMsgIndex = prevChat.findIndex(
            (msg) => msg.timestamp === latestMsg.timestamp
          );

          if (existingMsgIndex !== -1) {
            // Replace existing message
                     const updatedChat = [...prevChat];
            updatedChat[existingMsgIndex] = latestMsg;
            return updatedChat;
          } else {
            // Append new message
            return [...prevChat, latestMsg];
          }
        });
      }
    }
  }, [newChat]);

  useEffect(() => {
    console.log("chat:", chat);

    getChat();
  }, []);

  async function sendMessage(msg: string) {
    const timestamp = Date.now();
    console.log("sendMessage:", msg, timestamp);
    

    const res = await fetch(`${API_URL}/worker/chat-msg`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msg: { msg, timestamp },
        chatId,
        workerToken,
        userToken,
      }),
    });

    const data = await res.json();

    console.log(data, socket, chatData)
    
    if(data.reconnect && socket && chatData.type != "web") {

      console.log("reconnecting")
      // return;

      socket.emit("worker-reconnect", {
        workerToken: workerToken,
        webToken: userToken,
        chatId: chatId,
        msg: { msg, timestamp },
      });

      const res2 = await fetch(`${API_URL}/worker/chat-msg`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          msg: { msg, timestamp },
          chatId,
          workerToken,
          userToken,
        }),
      });
    
    }

    setChat((prevChat) => [
      ...prevChat,
      { msg, sender: "worker", timestamp },
    ]);
  }

  const handleEditMessage = async (timestamp: number, newMessage: string) => {
    // Update the message in the chats array
    const payload = {
      chatId,
      workerToken,
      userToken,
      msg: {
        msg: newMessage,
        timestamp: timestamp,
      },
    };
    console.log("Sending payload:", payload);

    // socket.current.emit("chat-msg", payload);
    // socket.current.emit("worker-buffer-accept", payload);
    fetch(`${API_URL}/worker/chat-msg`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setChat((prevChat) =>
      prevChat.map((chat) =>
        chat.timestamp === timestamp ? { ...chat, msg: newMessage } : chat
      )
    );
    setEditingMessage(null);
  };

  return (
    <div className="flex flex-col h-full">
      {chatData?.disconnect?.time == 0 && (
        <Button
          onClick={() => {
            disconnect();
          }}
        >
          Disconnect
        </Button>
      )}
      <ChatMessageList>
        {chat?.length > 0 &&
          chat.map(
            (message: {
              timestamp: number;
              msg: string;
              sender: "web" | "worker";
            }) => {
              // Check if message is a file
              const fileRegex = /^\[file\]\[link="(.+?)"\]\[name="(.+?)"\]\[type="(.+?)"\]\[\/file\]$/;
              const fileMatch = message.msg.match(fileRegex);

              if (fileMatch) {
                // File message
                const [_, link, name, type] = fileMatch;
                return (
                  <ChatBubble
                    key={message.timestamp}
                    variant={message.sender === "web" ? "received" : "sent"}
                  >
                    <ChatBubbleAvatar
                      fallback={message.sender === "web" ? "Web" : "You"}
                    />
                    <div className="relative group">
                      <ChatBubbleMessage
                        variant={message.sender === "web" ? "received" : "sent"}
                      >
                        <div 
                          onClick={() => window.open(link, '_blank')}
                          className="cursor-pointer hover:bg-gray-100 p-2 rounded-lg flex items-center gap-2"
                        >
                          <div className="bg-blue-100 p-2 rounded">
                            📎
                          </div>
                          <div>
                            <p className="font-medium">{name}</p>
                            <p className="text-sm text-gray-500">{type}</p>
                          </div>
                        </div>
                      </ChatBubbleMessage>
                    </div>
                  </ChatBubble>
                );
              }

              // Regular message (existing code)
              return (
                <ChatBubble
                  key={message.timestamp}
                  variant={message.sender === "web" ? "received" : "sent"}
                >
                  <ChatBubbleAvatar
                    fallback={message.sender === "web" ? "Web" : "You"}
                  />
                  <div className="relative group">
                    <ChatBubbleMessage
                      variant={message.sender === "web" ? "received" : "sent"}
                    >
                      {message?.msg}
                      {message?.sender !== "web" && (
                        <button
                          onClick={() => {
                            setEditingMessage(message);
                            console.log("editingMessage:", message);
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute -left-6 top-1/2 -translate-y-1/2 p-1 hover:bg-black rounded"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </ChatBubbleMessage>
                  </div>
                </ChatBubble>
              );
            }
          )}
      </ChatMessageList>

      {chatData?.disconnect?.time > 0 && chatData.type == "web" && (
        <div className="flex justify-center items-center h-full">
          <p className="text-center text-gray-500">
            Chat disconnected at{" "}
            {new Date(chatData?.disconnect?.time).toLocaleString()}
          </p>
        </div>
      )}
      {editingMessage && (
        <div className="w-full p-2 bg-gray-50 border-t">
          <p className="text-sm text-gray-500 mb-2">Edit message:</p>
          <div className="flex gap-2">
            <Input
              value={editingMessage.msg}
              onChange={(e) =>
                setEditingMessage((prev) =>
                  prev ? { ...prev, msg: e.target.value } : null
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleEditMessage(
                    editingMessage.timestamp,
                    editingMessage.msg
                  );
                }
              }}
            />
            <Button
              onClick={() =>
                handleEditMessage(editingMessage.timestamp, editingMessage.msg)
              }
            >
              Save
            </Button>
            <Button onClick={() => setEditingMessage(null)}>Cancel</Button>
          </div>
        </div>
      )}
      <ChatInputComponent
        sendMessage={sendMessage}
        disabled={chatData?.disconnect?.time > 0 && chatData.type == "web"}
      />

    </div>
  );
}
