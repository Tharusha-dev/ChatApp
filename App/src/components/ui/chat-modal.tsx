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

export default function ChatModal({
  chatId,
  newChat,
  workerToken,
  refresh,
  setWorkerChats
}: {
  chatId: string;
  newChat: any;
  workerToken: string;
  refresh: boolean;
  setWorkerChats: (chats: any) => void;
}) {
  const [chat, setChat] = useState<any[]>([]);
  const [userToken, setUserToken] = useState<string>("");
  const [chatData, setChatData] = useState<any>({});
  async function getChat() {
    const res = await fetch(`${API_URL}/worker/get-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth": workerToken
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
        "auth": workerToken
      },
      body: JSON.stringify({chatId, userToken: userToken, party: "web"}),
    });
    setWorkerChats((prevChats: any) => prevChats.map((chat: any) => 
      chat.chatId === chatId 
        ? {...chat, disconnect: {time: Date.now()}}
        : chat
    ));
  }


  useEffect(() => {
    if (newChat) {
      // setChat(prevChat => [...prevChat, newChat]);
      console.log("newChat:", newChat);
      console.log("chat test:", chat);

      const newChats = newChat
        ?.map((chat: any) => (chat.chatId === chatId ? chat.msg : null))
        .filter(Boolean);
      console.log("newChats:", newChats);

      setChat((prevChat) => [...prevChat, newChats[newChats.length - 1]]); //TODO :  need to check if all these msg are prestn by checnig msg and timesta,mp and only append thiose that are not
    }
  }, [newChat]);

  useEffect(() => {
    console.log("chat:", chat);


    getChat();
  }, []);

  async function sendMessage(msg: string) {
    console.log("sendMessage:", msg);
    const res = await fetch(`${API_URL}/worker/chat-msg`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msg: { msg, timestamp: Date.now() },
        chatId,
        workerToken,
        userToken,
      }),
    });

    setChat((prevChat) => [
      ...prevChat,
      { msg, sender: "worker", timestamp: Date.now() },
    ]);
  }

  return (
    <div className="flex flex-col h-full">
      {chatData?.disconnect?.time == 0 &&    <Button onClick={() => {
                disconnect()
              }}>Disconnect</Button>}
      <ChatMessageList>
        {chat?.length > 0 &&
          chat.map(
            (message: {
              timestamp: number;
              msg: string;
              sender: "web" | "worker";
             
            }) => (
              <ChatBubble
                key={message?.timestamp}
                variant={message?.sender === "web" ? "received" : "sent"}
              >
                <ChatBubbleAvatar
                  fallback={message?.sender === "web" ? "User" : "You"}

                />
                <ChatBubbleMessage
                  variant={message?.sender === "web" ? "received" : "sent"}
                >
                  {message?.msg}
                </ChatBubbleMessage>
              </ChatBubble>
            )
          )}
      </ChatMessageList>

      {chatData?.disconnect?.time > 0 && (
        <div className="flex justify-center items-center h-full">
          <p className="text-center text-gray-500">Chat disconnected at {new Date(chatData?.disconnect?.time).toLocaleString()}</p>
        </div>
      )}

      <ChatInputComponent sendMessage={sendMessage} disabled={chatData?.disconnect?.time > 0} />
    </div>
  );
}
