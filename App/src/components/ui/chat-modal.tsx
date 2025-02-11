"use client";

import { ChatMessageList } from "@/components/ui/chat/chat-message-list";

import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { useEffect, useState } from "react";

import ChatInputComponent from "./chat-input";

// import { ChatInput } from "@/components/ui/chat/chat-input";
import { Button } from "@chatscope/chat-ui-kit-react";
import { API_URL } from "@/lib/config";
import { Input } from "@/components/ui/input";

import { Check, Copy, Edit, Reply, Pencil, Trash, Icon } from "lucide-react";
import { Socket } from "socket.io-client";

import { ReplyAndEditBox } from "@/components/ui/replyAndEditBox";
import Uppy from "@uppy/core";
import { useUppyEvent } from "@uppy/react";
import Tus from "@uppy/tus";
import { ChatInput } from "./chat-input-2";
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
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const [editingMessage, setEditingMessage] = useState<{
    timestamp: number;
    msg: string;
  } | null>(null);

  const [replyingMessage, setReplyingMessage] = useState<{
    timestamp: number;
    msg: string;
  } | null>(null);
  const handleCopyMessage = async (message: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(message);
      console.log("messageId", message);
      //@ts-ignore
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  async function handleDeleteMessage(timestamp: number) {
    // setChats((prevChats) =>
    //   prevChats.filter((chat) => chat.timestamp !== timestamp)
    // );

    await handleEditMessage(timestamp, "[deleted]");
  }

  async function handleReplyMessage(newMessage: any, originalMessage: any) {
    console.log("newMessage", newMessage);
    console.log("originalMessage", originalMessage);

    const replyString = `[reply][originalMsg="${originalMessage}"][newMsg="${newMessage}"][/reply]`;
    await sendMessage(replyString);
    setReplyingMessage(null);
    // sendChat(newMessage, originalMessage);
    // setEditingMessage(newMessage);
  }
  const [message, setMessage] = useState("");

  const [uppy] = useState(() =>
    new Uppy().use(Tus, { endpoint: "https://app.chatzu.ai/files/" })
  );
  useUppyEvent(uppy, "upload-success", (file, response) => {
    console.log("File uploaded successfully:", file);
    console.log("Upload response:", response);

    const fileUrl = response.uploadURL;
    const fileName = file?.name || "file";
    const fileType = file?.type || "file";

    sendMessage(
      `[file][link="${fileUrl}"][name="${fileName}"][type="${fileType}"][/file]`
    );
  });

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
  const actionUserIcons = [
    {
      icon: Edit,
      type: "edit",
    },
    {
      icon: Trash,
      type: "delete",
    },
  ];

  const actionAgentIcons = [
    {
      icon: Reply,
      type: "reply",
    },
    {
      icon: Copy,
      type: "copy",
    },
  ];
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
    // console.log("chat:", chat);

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

    // console.log(data, socket, chatData);

    if (data.reconnect && socket) {
      console.log("reconnecting");
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

    setChat((prevChat) => [...prevChat, { msg, sender: "worker", timestamp }]);
  }

  function prepareNameForIcon(name: string) {
    if (!name) return ""; // Handle empty input
    
    const nameParts = name.trim().split(" ");
    const firstLetter = nameParts[0].charAt(0).toUpperCase(); // Get the first letter
    
    if (nameParts.length === 1) {
      // If there's only one word, return just the first letter
      return firstLetter;
    }
    
    const lastLetter = nameParts[nameParts.length - 1].charAt(0).toUpperCase(); // Get the last letter
    return `${firstLetter}${lastLetter}`;
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
  const formatDate = (date: any) => {
    const options = {
      weekday: "long",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    //@ts-ignore
    return new Date(date).toLocaleDateString("en-US", options);
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
              const fileRegex =
                /^\[file\]\[link="(.+?)"\]\[name="(.+?)"\]\[type="(.+?)"\]\[\/file\]$/;
              const fileMatch = message.msg.match(fileRegex);
              const replyRegex =
                /^\[reply\]\[originalMsg="(.+?)"\]\[newMsg="(.+?)"\]\[\/reply\]$/;

              const replyMatch = message.msg.match(replyRegex);
              const deleteRegex = /^\[deleted\]$/;
              const deleteMatch = message.msg.match(deleteRegex);
              return (
                <ChatBubble
                  key={message.timestamp}
                  variant={message.sender === "web" ? "received" : "sent"}
                >
                  <ChatBubbleAvatar
                    fallback={message.sender === "web" ? prepareNameForIcon(chatData.webName) : "You"}
                  />
                  <div className="relative group">
                    {(() => {
                      if (fileMatch) {
                        // File message
                        const [_, link, name, type] = fileMatch;
                        return (
                          // <ChatBubbleAvatar
                          //   fallback={message.sender === "web" ? "Web" : "You"}
                          // />
                          <div className="relative group">
                            <ChatBubbleMessage
                               variant={
                                message.sender === "web" ? "received" : "sent"
                              }
                              isSender={message.sender === "worker"}
                              user={message.sender === "web" ? chatData.webName : "Agent"}
                              time={formatDate(message.timestamp)}
                            >
                              <div
                                onClick={() => window.open(link, "_blank")}
                                className="cursor-pointer hover:bg-gray-100 p-2 rounded-lg flex items-center gap-2"
                              >
                                <div className="bg-blue-100 p-2 rounded">
                                  📎
                                </div>
                                <div>
                                  <p className="font-medium">{name}</p>
                                  <p className="text-sm text-gray-500">
                                    {type}
                                  </p>
                                </div>
                              </div>
                            </ChatBubbleMessage>
                          </div>
                        );
                      } else if (replyMatch) {
                        const [_, originalMsg, newMsg] = replyMatch;
                        return (
                          <ChatBubbleMessage
                          variant={
                            message.sender === "web" ? "received" : "sent"
                          }
                          isSender={message.sender === "worker"}
                          user={message.sender === "web" ? chatData.webName : "Agent"}
                          time={formatDate(message.timestamp)}
                          >
                            
                            <ReplyAndEditBox
                              replyToMessage={{
                                msg: originalMsg,
                                user: message.sender === "web" ? "You" : chatData.webName,
                              }}
                              onCancel={() => {
                                console.log("");
                              }}
                              type="reply"
                              replayTo
                              isSender={message.sender === "web"}
                            />

                            {newMsg}

                            {/* <button
                              onClick={() => {
                                setEditingMessage(message);
                                console.log("editingMessage:", message);
                              }}
                              className="opacity-0 group-hover:opacity-100 absolute -left-6 top-1/2 -translate-y-1/2 p-1 hover:bg-black rounded"
                            >
                              <Pencil size={14} />
                            </button> */}
                          </ChatBubbleMessage>
                        );
                      } else if (deleteMatch) {
                        return (
                          <ChatBubbleMessage
                          variant={
                            message.sender === "web" ? "received" : "sent"
                          }
                          isSender={message.sender === "worker"}
                          user={message.sender === "web" ? chatData.webName : "Agent"}
                          time={formatDate(message.timestamp)}
                          >
                            <span className="text-gray-500 italic">
                              {message?.msg}
                            </span>
                          </ChatBubbleMessage>
                        );
                      } else {
                        return (
                          //     <div className="relative group">
                          <ChatBubbleMessage
                          variant={
                            message.sender === "web" ? "received" : "sent"
                          }
                          isSender={message.sender === "worker"}
                          user={message.sender === "web" ? chatData.webName : "Agent"}
                          time={formatDate(message.timestamp)}
                          >
                            {message?.msg}
                            {/* {message?.sender !== "web" && (
                              <button
                                onClick={() => {
                                  setEditingMessage(message);
                                  console.log("editingMessage:", message);
                                }}
                                className="opacity-0 group-hover:opacity-100 absolute -left-6 top-1/2 -translate-y-1/2 p-1 hover:bg-black rounded"
                              >
                                <Pencil size={14} />
                              </button>
                            )} */}
                          </ChatBubbleMessage>
                        );
                      }

                      // // Regular message (existing code)
                    })()}

                    {/* {editingMessage && (
                      <div className="w-full p-2 bg-gray-50 border-t">
                        <p className="text-sm text-gray-500 mb-2">
                          Edit message:
                        </p>
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
                              handleEditMessage(
                                editingMessage.timestamp,
                                editingMessage.msg
                              )
                            }
                          >
                            Save
                          </Button>
                          <Button onClick={() => setEditingMessage(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )} */}
                  </div>
                  <ChatBubbleActionWrapper>
                    {message?.sender == "web" &&
                      !fileMatch &&
                      !deleteMatch &&
                      actionAgentIcons
                        .filter(({ type }) => !(type === "reply" && replyMatch))
                        .map(({ icon: Icon, type }) => (
                          <ChatBubbleAction
                            className="size-7"
                            key={type}
                            icon={
                              type === "copy" &&
                              copiedMessageId === message.timestamp ? (
                                <Check className="size-4" />
                              ) : (
                                Icon && <Icon className="size-4" />
                              )
                            }
                            onClick={async () => {
                              if (type === "copy") {
                                await handleCopyMessage(
                                  message.msg,
                                  message.timestamp
                                );
                              }

                              if (type === "reply" && !replyMatch) {
                                console.log("reply message", message);
                                setReplyingMessage(message);
                              }
                            }}
                          />
                        ))}

                    {message?.sender == "worker" &&
                      !fileMatch &&
                      !deleteMatch &&
                      // <ChatBubbleAction
                      //   className={`size-7`}
                      //   key={"edit"}
                      //   icon={<Edit className="size-4" />}
                      //   onClick={() => {
                      //     console.log("editingMessage:", message);
                      //     setEditingMessage(message);
                      //   }}
                      // />
                      actionUserIcons.map(({ icon: Icon, type }) => (
                        <ChatBubbleAction
                          className={`size-7`}
                          key={type}
                          icon={Icon && <Icon className="size-4" />}
                          onClick={() => {
                            if (type === "edit") setEditingMessage(message);
                            if (type === "delete")
                              handleDeleteMessage(message.timestamp);
                          }}
                        />
                      ))}
                  </ChatBubbleActionWrapper>
                </ChatBubble>
              );
            }
          )}
      </ChatMessageList>

      {/* <ChatInputComponent
        sendMessage={sendMessage}
        disabled={chatData?.disconnect?.time > 0 && chatData.type == "web"}
      /> */}
      {chatData?.disconnect?.time > 0 && chatData.type == "web" && (
        <div className="flex justify-center items-center">
          <p className="text-center text-gray-500">
            Chat disconnected at{" "}
            {new Date(chatData?.disconnect?.time).toLocaleString()}
          </p>
        </div>
      )}
      <ChatInput
        value={message}
        uppy={uppy}
        sendChat={sendMessage}
        setChatMsg={setMessage}
        chatMsg={message}
        editingMessage={editingMessage}
        replyingMessage={replyingMessage}
        setReplyingMessage={setReplyingMessage}
        handleEditMessage={handleEditMessage}
        handleReplyMessage={handleReplyMessage}
        setEditingMessage={setEditingMessage}
        sendDisabled={chatData?.disconnect?.time > 0 && chatData.type == "web"}
      />
    </div>
  );
}
