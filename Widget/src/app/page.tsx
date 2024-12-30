"use client";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/chat/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Button } from "@/components/ui/button";
import { io, Socket } from "socket.io-client";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Suspense } from "react";
import { CornerDownLeft } from "lucide-react";
import { Pencil, Paperclip } from "lucide-react";

import { useSearchParams } from "next/navigation";
import Uppy from '@uppy/core';
import { Dashboard , DashboardModal} from '@uppy/react';
import { useUppyEvent } from '@uppy/react';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import Tus from '@uppy/tus'

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const queryParams = useSearchParams();
  const websiteId = queryParams.get("websiteId");
  const currentUrl = queryParams.get("currentUrl");

  const API_URL = "http://localhost:8000";

  const [token, setToken] = useState<string | null>(null);
  // const [socket, setSocket] = useState<Socket | null>(null);
  const [chatMsg, setChatMsg] = useState<string>("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [intialized, setIntialized] = useState<boolean>(false);
  const [chats, setChats] = useState<any[]>([]);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [chatDisconnected, setChatDisconnected] = useState<boolean>(false);
  const initalChatSequence = useRef<
    "welcome" | "name" | "email" | "issue" | "join" | "chat"
  >("welcome");
  // let socket = useRef<Socket | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [waitingForWorker, setWaitingForWorker] = useState<boolean>(false);

  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Add new state for tracking typing timeout
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);

  const [currentChatMethod,setCurrentChatMethod] = useState<null | "select" |"chat" | "telegram" | "whatsapp">(null);
  // const [chatId, setChatId] = useState<string | null>(null);
  // Add function to handle typing timeout
  const handleTypingTimeout = useCallback(() => {
    disconnect();
    setStatusMsg("You have been disconnected due to inactivity");
  }, []);

  // Add effect to manage typing timeout
  useEffect(() => {
    // Clear existing timeout when typing occurs
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout (20 minutes = 1200000 ms)
    typingTimeoutRef.current = setTimeout(handleTypingTimeout, 1200000);

    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatMsg, handleTypingTimeout]);
  const [uppy] = useState(() => new Uppy().use(Tus, { endpoint: 'http://localhost:1080/files' }));
  
  //@ts-ignore
  useUppyEvent(uppy, 'upload-success', (file, response) => {
    console.log('File uploaded successfully:', file);
    console.log('Upload response:', response);

    const fileUrl = response.uploadURL;
    const fileName = file?.name || "file";
    const fileType = file?.type || "file";

    sendChat(`[file][link="${fileUrl}"][name="${fileName}"][type="${fileType}"][/file]`);

  });

  // Add a ref for the message list
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Add effect to scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chats, scrollToBottom]);

  const [editingMessage, setEditingMessage] = useState<{ timestamp: number; msg: string } | null>(null);

  // Add this function to handle message editing
  const handleEditMessage = async (timestamp: number, newMessage: string) => {
    // Update the message in the chats array
 const payload = {
  userToken: token,
      msg: {
        msg: newMessage,
        timestamp: timestamp,
      },
      chatId,
 }
  console.log("Sending payload:", payload);

  // socket.current.emit("chat-msg", payload);
  // socket.current.emit("worker-buffer-accept", payload);
  fetch(`${API_URL}/chat-msg`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });


    setChats(prevChats => 
      prevChats.map(chat => 
        chat.timestamp === timestamp 
          ? { ...chat, msg: newMessage }
          : chat
      )
    );
    setEditingMessage(null);
  };


  async function telegramJoin() {
    const res = await fetch(`${API_URL}/telegram/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ websiteId, currentUrl }),
    });

    const data = await res.json();
    setChatId(data.chatId);
    return data;
  }

  async function join(initialMessage: string) {
    console.log("login");
    const res = await fetch(`${API_URL}/web/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        initialMessage: {
          timestamp: Date.now(),
          msg: initialMessage,
        },
        name: name,
        email: email,
        websiteId: websiteId,
        currentUrl: currentUrl,
      }),
    });
    const data = await res.json();
    setToken(data.userToken);
    setChatId(data.chatId);
    const newSocket = io(`${API_URL}`, {
      path: "/socket.io",
      query: {
        type: "web-chat-request",
        name: name,
        userToken: data.userToken,
        chatId: data.chatId,
        websiteId: websiteId,
        intialMessage: JSON.stringify({
          timestamp: Date.now(),
          msg: initialMessage,
        }),
      },
      transports: ["websocket"],
      reconnection: true,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    // socket.current = newSocket;
    setSocket(newSocket);
    setIntialized(true);

    let resAvailabe = await fetch(`${API_URL}/web/check-availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ websiteId }),
    });

    let dataAvailable = await resAvailabe.json();
    if (dataAvailable?.available) {
      setWaitingForWorker(true);
      // setStatusMsg("An agent will be in touch shortly");
      setChats((prevChats) => [
        ...prevChats,
        {
          msg: "An agent will be in touch shortly",
          timestamp: Date.now(),
          sender: "worker",
        },
      ]);
    } else {
      setChats((prevChats) => [
        ...prevChats,
        {
          msg: "All agents are currently busy, we will responde to you by email within the next 1-6 hours",
          timestamp: Date.now(),
          sender: "worker",
        },
      ]);
    }

  }

  function sendChat(fileUploadString: string = "") {
    if (!socket?.connected) {
      console.log("Socket not connected");

      console.log("initalChatSequence", initalChatSequence, chatMsg);

      if (initalChatSequence.current === "welcome") {
        setChats((prevChats) => [
          ...prevChats,
          {
            msg: chatMsg,
            timestamp: Date.now(),
            sender: "web",
          },
        ]);
        setCurrentChatMethod("select");
        // initalChatSequence.current = "name";
      } else if (initalChatSequence.current === "name") {
        setName(chatMsg);

        setChats((prevChats) => [
          ...prevChats,
          {
            msg: chatMsg,
            timestamp: Date.now(),
            sender: "web",
          },
        ]);
        initalChatSequence.current = "email";
      } else if (initalChatSequence.current === "email") {
        setEmail(chatMsg);

        setInitialMessage(chatMsg);
        setChats((prevChats) => [
          ...prevChats,
          {
            msg: chatMsg,
            timestamp: Date.now(),
            sender: "web",
          },
        ]);
        initalChatSequence.current = "issue";
      } else if (initalChatSequence.current === "issue") {
        setInitialMessage(chatMsg);
        setChats((prevChats) => [
          ...prevChats,
          {
            msg: chatMsg,
            timestamp: Date.now(),
            sender: "web",
          },
        ]);
        initalChatSequence.current = "join";
      }

      initialChatSequence(chatMsg, metadata?.msg_1);

      return;
    }

    console.log("attempting to send chat");
    const payload = {
      userToken: token,
      msg: {
        msg: fileUploadString ? fileUploadString : chatMsg ,
        timestamp: Date.now(),
      },
      chatId,
    };
    console.log("Sending payload:", payload);

    // socket.current.emit("chat-msg", payload);
    // socket.current.emit("worker-buffer-accept", payload);
    fetch(`${API_URL}/chat-msg`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  function handleChat(data: any) {
    console.log("handling chat:", data);

      setWaitingForWorker(false);

    setChats((prevChats) => {
      const messageIndex = prevChats.findIndex(
        (chat) => chat?.timestamp === data?.msg?.timestamp
      );
      
      if (messageIndex !== -1) {
        // Replace existing message
        const newChats = [...prevChats];
        newChats[messageIndex] = {
          ...data?.msg,
          timestamp: data?.msg?.timestamp
        };
        return newChats;
      } else {
        // Append new message
        return [...prevChats, {
          ...data?.msg,
          timestamp: data?.msg?.timestamp
        }];
      }
    });
  }
  async function handleBeforeUnload() {
    const data = {
      chatId,
      userToken: token,
      party: "web",
    };

    await fetch(`${API_URL}/disconnect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chatId, userToken: token }),
    });
    socket?.disconnect();
  }

  async function initialChatSequence(
    intialMsg: string = "",
    msg_1: string = ""
  ) {
    if (initalChatSequence.current === "chat") {
      return;
    } else if (initalChatSequence.current === "join") {
      // setInitalChatSequence("name");
      join(intialMsg);
    } else if (initalChatSequence.current === "welcome" && intialMsg === "") {
      setChats((prevChats) => [
        ...prevChats,
        {
          msg: msg_1 || "Welcome to the chat?",
          timestamp: Date.now(),
          sender: "worker",
        },
      ]);


      
    } 
    else if (initalChatSequence.current === "name") {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setChats((prevChats) => [
        ...prevChats,
        {
          msg: metadata?.msg_2,
          timestamp: Date.now(),
          sender: "worker",
        },
      ]);
    }
    
    
    
    else if (initalChatSequence.current === "email") {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setChats((prevChats) => [
        ...prevChats,
        {
          msg: metadata?.msg_3,
          timestamp: Date.now(),
          sender: "worker",
        },
      ]);
    } else if (initalChatSequence.current === "issue") {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setChats((prevChats) => [
        ...prevChats,
        {
          msg: metadata?.msg_4,
          timestamp: Date.now(),
          sender: "worker",
        },
      ]);
    }

  }

  useEffect(() => {
    async function getMetadata() {
      const res = await fetch(`${API_URL}/web/get-metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteId }),
      });
      const data = await res.json();
      setMetadata(data);
      initialChatSequence("", data?.msg_1);
    }

    getMetadata();
  }, []);

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [chatId, token, socket]);

  async function disconnect() {
    if (socket?.connected) {
      console.log("disconnecting");
      console.log(socket);
      console.log(token);
      // Emit a custom disconnect event before closing

      await fetch(`${API_URL}/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId, userToken: token, party: "web" }),
      });

      console.log("disconnected");
      // Only disconnect after confirmation the event was received
      socket?.disconnect();
      setIntialized(false);
      setChatDisconnected(true);
      // setChats([]);
      // console.log(socket);
    }
  }
  const handleChatMethodSelect = async (method: "chat" | "telegram" | "whatsapp") => {
    if (method === "chat") {
      initalChatSequence.current = "name";
      initialChatSequence("", metadata?.msg_2);
    } else {
      if(method === "telegram"){
      let res = await telegramJoin();
      console.log(res);
      }
      setChats((prevChats) => [
        ...prevChats,
        {
          msg: "We will contact you later",
          timestamp: Date.now(),
          sender: "worker",
        },
      ]);
    }
    setCurrentChatMethod(method);
  };
  useEffect(() => {
    if (socket) {
      console.log("Socket state changed");

      socket.on("connect", () => {
        console.log("Socket connected in useEffect");
      });

      socket.on("chat-msg", (data) => {
        console.log("Received chat message:", data);
        handleChat(data);
      });

      socket.on("worker-buffer-accept", (data) => {
        console.log("worker-buffer-accept:", data);
        // setName(data?.workerName || "Agent");
        setStatusMsg(null);
      });

      socket.on("worker-connected", (data) => {
        console.log("worker-connected:", data);
        setStatusMsg(null);
      });

      socket.onAny((eventName, ...args) => {
        console.log("Event received:", eventName, args);
      });

      socket.on("party-disconnected", (data) => {
        console.log("party disconnected:", data);
        setChatDisconnected(true);
        // if(data.party === "web"){
        //   setActiveChat(null);
        // }
      });
    }
  }, [socket]);

  return (
    <div className="">
      {/* @ts-ignore */}
      <ExpandableChat size="lg" position="middle">
        <ExpandableChatHeader className="flex-col text-center justify-center">
          <h1 className="text-xl font-semibold">
            {metadata?.title || "Chat with us"}
          </h1>
          <p>{metadata?.description || "Ask any question"}</p>
          <div className="flex gap-2 items-center pt-2"></div>
        </ExpandableChatHeader>
        <ExpandableChatBody>
 


          <ChatMessageList>
        {chats?.length > 0 &&
          chats.map(
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

{currentChatMethod === "select" && (
              <div className="flex flex-col gap-2 p-4">
                <Button 
                  onClick={() => handleChatMethodSelect("chat")}
                  className="w-full"
                >
                  Chat Now
                </Button>
                <Button 
                  onClick={() => handleChatMethodSelect("telegram")}
                  className="w-full"
                >
                  Contact via Telegram
                </Button>
                <Button 
                  onClick={() => handleChatMethodSelect("whatsapp")}
                  className="w-full"
                >
                  Contact via WhatsApp
                </Button>
              </div>
            )}
            <div ref={messagesEndRef} />

      </ChatMessageList>

          
        </ExpandableChatBody>
        <ExpandableChatFooter className="flex flex-col gap-[5px] items-start">
          {chatDisconnected && (
            <div className="flex flex-col items-center justify-center">
              <p>The worker has disconnected</p>
            </div>
          )}

          {statusMsg && (
            <div className="flex flex-col items-center justify-center">
              <p>{statusMsg}</p>
            </div>
          )}
          {editingMessage && (
            <div className="w-full p-2 bg-gray-50 border-t">
              <p className="text-sm text-gray-500 mb-2">Edit message:</p>
              <div className="flex gap-2">
                <Input
                  value={editingMessage.msg}
                  onChange={(e) => setEditingMessage(prev => prev ? {...prev, msg: e.target.value} : null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEditMessage(editingMessage.timestamp, editingMessage.msg);
                    }
                  }}
                />
                <Button onClick={() => handleEditMessage(editingMessage.timestamp, editingMessage.msg)}>
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditingMessage(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}


          <ChatInput
            value={chatMsg}
            onChange={(e) => {
              setChatMsg(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (chatMsg.trim()) {
                  sendChat();
                  setChatMsg("");
                }
              }
            }}
          />

<div className="flex items-center p-3 pt-0">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1.5"
            >
              <Paperclip className="size-4" />  
              <span className="sr-only">Attach files</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full w-full">
            <Dashboard width={"100%"} height={"300px"} uppy={uppy} />
          </DialogContent>
        </Dialog>

{/* <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1.5"
              onClick={() => setUploadModalOpen(true)}
            >
              <Paperclip className="size-4" />  
              <span className="sr-only">Attach files</span>
            </Button>
            <DashboardModal open={uploadModalOpen} uppy={uppy} /> */}

      </div>

          <div className="flex gap-2 items-center justify-between w-full">
            <Button
              type="button"
              size="icon"
              className="w-1/5"
              onClick={() => {
                sendChat();
                setChatMsg("");
              }}
              disabled={chatDisconnected || waitingForWorker}
            >
              {waitingForWorker ? "Waiting for worker" : "Send"}
            </Button>

            <Button
              onClick={async () => {
                disconnect();
              }}
            >
              End chat
            </Button>
          </div>


        </ExpandableChatFooter>
      </ExpandableChat>
    </div>
  );
}
