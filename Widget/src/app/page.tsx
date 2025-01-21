"use client";
import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChatInput } from "@/components/ui/chat/chat-input";
import Image from "next/image";
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

import { Input } from "@/components/ui/input";
import { Suspense } from "react";
import { Check, Copy, CornerDownLeft, Edit, Icon, RotateCcw, Trash } from "lucide-react";
//@ts-ignore
import { FileIcon, defaultStyles } from "react-file-icon";

import { Pencil, Paperclip } from "lucide-react";

import { useSearchParams } from "next/navigation";
import Uppy from "@uppy/core";
import { Dashboard, DashboardModal } from "@uppy/react";
import { useUppyEvent } from "@uppy/react";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import Tus from "@uppy/tus";

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

  // const API_URL = "http://localhost:8000";
  const API_URL =  "https://app.chatzu.ai/api";

  // const WHATSAPP_NUMBER = "+94718550509"
  const WHATSAPP_NUMBER = "+447383545694";

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

  // const [waitingForWorker, setWaitingForWorker] = useState<boolean>(false);

  const waitingForWorker = useRef<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Add new state for tracking typing timeout
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [workerConnected, setWorkerConnected] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const [currentChatMethod, setCurrentChatMethod] = useState<
    null | "select" | "chat" | "telegram" | "whatsapp"
  >(null);

  const [availableContacts, setAvailableContacts] = useState([
    { id: "chat", label: "Live Chat", icon: "/livechatColor.svg" },
  ]);

  // Update availableContacts when metadata changes
  useEffect(() => {
    const contacts = [
      { id: "chat", label: "Live Chat", icon: "/livechatColor.svg" },
    ];

    if (metadata?.allow_telegram) {
      contacts.push({
        id: "telegram",
        label: "Telegram",
        icon: "/telegram.svg",
      });
    }

    if (metadata?.allow_whatsapp) {
      contacts.push({
        id: "whatsapp",
        label: "WhatsApp",
        icon: "/whatsapp.svg",
      });
    }

    setAvailableContacts(contacts);
  }, [metadata]);

  const styledIcons = Object.keys(defaultStyles);
  const actionAgentIcons = [

    {
      icon: Copy,
      type: "copy",
    },
  ];
  // const [chatId, setChatId] = useState<string | null>(null);
  // Add function to handle typing timeout
  const handleTypingTimeout = useCallback(() => {
    disconnect();
    setStatusMsg("You have been disconnected due to inactivity");
  }, []);
  const handleCopyMessage = async (message: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(message);
      console.log("messageId", message);
      //@ts-ignore
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

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
  const [uppy] = useState(() =>
    new Uppy().use(Tus, { endpoint: "https://app.chatzu.ai/files/" })
  );

  //@ts-ignore
  useUppyEvent(uppy, "upload-success", (file, response) => {
    console.log("File uploaded successfully:", file);
    console.log("Upload response:", response);

    const fileUrl = response.uploadURL;
    const fileName = file?.name || "file";
    const fileType = file?.type || "file";

    sendChat(
      `[file][link="${fileUrl}"][name="${fileName}"][type="${fileType}"][/file]`
    );
  });

  // Add a ref for the message list
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Add scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Add effect to scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chats, scrollToBottom]);

  const [editingMessage, setEditingMessage] = useState<{
    timestamp: number;
    msg: string;
  } | null>(null);
  // dialog state
  const [open, setOpen] = useState(false);

  // dialog action state
  const [action, setAction] = useState<"restart" | "end" | null>(null);
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

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.timestamp === timestamp ? { ...chat, msg: newMessage } : chat
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
    console.log("data", data);
    setChatId(data.chatId);
    return data;
  }

  async function whatsappJoin() {
    const res = await fetch(`${API_URL}/whatsapp/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ websiteId, currentUrl }),
    });

    const data = await res.json();
    console.log("data", data);
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

    // const newSocket = io(`${API_URL}`, {
    //   path: "/socket.io",
    //   query: {
            const newSocket = io("https://app.chatzu.ai", {
              path: "/api/socket.io",
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
      // setWaitingForWorker(true);
      waitingForWorker.current = true;
      console.log("worker is available");
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
          msg: "All agents are currently busy, we will respond by email within the next 1 - 6 hours. Alternatively you can message us on WhatApp or Telegram and we will respond there.",
          timestamp: Date.now(),
          sender: "worker",
        },
      ]);

      disconnect();
      // Reset chat method to show buttons again
      setCurrentChatMethod("select");
    }

    // Add timer to check for worker acceptance
    const workerAcceptTimeout = setTimeout(() => {
      console.log("worker did not accept up");
      if (waitingForWorker.current) {
        console.log("worker did not accept");
        setChats((prevChats) => [
          ...prevChats,
          {
            msg: "All agents are currently busy, we will respond by email within the next 1 - 6 hours. Alternatively you can message us on WhatsApp or Telegram and we will respond there.",
            timestamp: Date.now(),
            sender: "worker",
          },
        ]);
        disconnect();
        // Reset chat method to show buttons again
        setCurrentChatMethod("select");
      }
    }, 20 * 60 * 1000); // 20 minutes in milliseconds

    // Clear timeout when component unmounts or when worker accepts
  }

  function sendChat(fileUploadString: string = "") {
    if (!socket?.connected) {
      console.log("Socket not connected");

      console.log("initalChatSequence", initalChatSequence, chatMsg);

      if (initalChatSequence.current === "welcome") {
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
        msg: fileUploadString ? fileUploadString : chatMsg,
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

    // setWaitingForWorker(false);
    waitingForWorker.current = false;
    console.log("worker is available");

    setChats((prevChats) => {
      const messageIndex = prevChats.findIndex(
        (chat) => chat?.timestamp === data?.msg?.timestamp
      );

      if (messageIndex !== -1) {
        // Replace existing message
        const newChats = [...prevChats];
        newChats[messageIndex] = {
          ...data?.msg,
          timestamp: data?.msg?.timestamp,
        };
        return newChats;
      } else {
        // Append new message
        return [
          ...prevChats,
          {
            ...data?.msg,
            timestamp: data?.msg?.timestamp,
          },
        ];
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

      // Immediately set the chat method to "select" to show the buttons
      setCurrentChatMethod("select");
    } else if (initalChatSequence.current === "name") {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setChats((prevChats) => [
        ...prevChats,
        {
          msg: metadata?.msg_2,
          timestamp: Date.now(),
          sender: "worker",
        },
      ]);
    } else if (initalChatSequence.current === "email") {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setChats((prevChats) => [
        ...prevChats,
        {
          msg: metadata?.msg_3,
          timestamp: Date.now(),
          sender: "worker",
        },
      ]);
    } else if (initalChatSequence.current === "issue") {
      await new Promise((resolve) => setTimeout(resolve, 2000));

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
    setIntialized(false);
    setChatDisconnected(true);
    setWorkerConnected(false);
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

      // setChats([]);
      // console.log(socket);
    }
  }
  const handleChatMethodSelect = async (
    method: "chat" | "telegram" | "whatsapp"
  ) => {
    console.log("handleChatMethodSelect", method);
    let chatId_: any;
    if (method === "chat") {
      initalChatSequence.current = "name";
      initialChatSequence("", metadata?.msg_2);
    } else {
      if (method === "telegram") {
        let res = await telegramJoin();
        console.log(res);
        chatId_ = res.chatId;
        setChats((prevChats) => [
          ...prevChats,
          {
            msg: `[telegram][link=https://t.me/CustomerSupport222_Bot?start=${chatId_}][/telegram]`,
            timestamp: Date.now(),
            sender: "worker",
          },
        ]);
      } else if (method === "whatsapp") {
        let res = await whatsappJoin();
        console.log(res);
        chatId_ = res.chatId;
        setChats((prevChats) => [
          ...prevChats,
          {
            //https://wa.me/whatsappphonenumber/?text=urlencodedtext

            msg: `[whatsapp][link=https://wa.me/${WHATSAPP_NUMBER}/?text=%2Fstart%20${chatId_}][/whatsapp]`,
            timestamp: Date.now(),
            sender: "worker",
          },
        ]);
      }
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
        setStatusMsg(null);
        setWorkerConnected(true);
        // setWaitingForWorker(false);
        waitingForWorker.current = false;
        console.log("worker is available");
        // This will prevent the timeout message
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
    
      <ExpandableChat size="sm" position="bottom-right" style={{border:"none"}}>
        <ExpandableChatHeader className="flex justify-start gap-2">
          <>
            <Image
              aria-hidden
              src="/livechatColor.svg"
              alt="File icon"
              width={20}
              height={20}
            />
            <div className="flex flex-col">
              <h1 className="text-lg">{metadata?.title || "Chat with us"}</h1>
              {/* <p>{metadata?.description || "Ask any question"}</p> */}
            </div>
          </>
        </ExpandableChatHeader>
        {workerConnected && (
          <div className="flex bg-white w-full py-2 px-4 justify-center items-center gap-2">
            <Button
              size="sm"
              className="w-full bg-[#2970FF] text-white hover:bg-[#2C7DFF]"
              onClick={async () => {
                // First reset all states except socket-related ones
                setAction("restart");
                setOpen(true);
              }}
            >
              <RotateCcw className="size-3" />
              Restart Chat
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                setAction("end");
                setOpen(true);
              }}
            >
              <Trash className="size-3" />
              End Chat
            </Button>
          </div>
        )}

        <ExpandableChatBody className="border-b-0">
          <ChatMessageList className="border-b-0">
            {chats?.length > 0 &&
              chats.map(
                (message: {
                  timestamp: number;
                  msg: string;
                  sender: "web" | "worker";
                }) => {
                  // Check if message is a file
                  const fileRegex =
                    /^\[file\]\[link="(.+?)"\]\[name="(.+?)"\]\[type="(.+?)"\]\[\/file\]$/;
                  const telegramRegex =
                    /^\[telegram\]\[link=(.+?)\]\[\/telegram\]$/;
                  const whatsappRegex =
                    /^\[whatsapp\]\[link=(.+?)\]\[\/whatsapp\]$/;

                  const fileMatch = message.msg.match(fileRegex);
                  const telegramMatch = message.msg.match(telegramRegex);
                  const whatsappMatch = message.msg.match(whatsappRegex);

                  console.log(message);
                  return (
                    <ChatBubble
                      key={message.timestamp}
                      variant={message.sender === "web" ? "sent" : "received"}
                      className="text-xs"
                    >
                      {message.sender != "web" && (
                        <ChatBubbleAvatar fallback="A" />
                      )}
                      <div className="relative group">
                        {(() => {
                          if (fileMatch) {
                            // File message
                            const [_, link, name, type] = fileMatch;
                            return (
                              <ChatBubbleMessage
                                variant={
                                  message.sender === "web" ? "sent" : "received"
                                }
                                isSender={message.sender === "web"}
                                user={"Agent"}
                                time={formatDate(message.timestamp)}
                              >
                                <div
                                  onClick={() => {
                                    window.open(link, "_blank");
                                  }}
                                  className="flex items-center gap-2 border bg-white rounded p-2 cursor-pointer"
                                >
                                  <div className="w-[32px] h-[32px]">
                                    <FileIcon
                                      extension={type}
                                      {...styledIcons}
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-700 font-medium truncate w-[160px]">
                                      {name}
                                    </p>
                                    {/* <p className="text-xs text-gray-500">
                            5 KB
                          </p> */}
                                  </div>
                                </div>
                              </ChatBubbleMessage>
                            );
                          } else if (telegramMatch) {
                            // Telegram message rendering...
                            const [_, link] = telegramMatch;
                            return (
                              <div className="flex flex-col gap-2">
                                <ChatBubbleMessage
                                  variant={
                                    message.sender === "web"
                                      ? "sent"
                                      : "received"
                                  }
                                  isSender={message.sender === "web"}
                                  user={"Agent"}
                                  time={formatDate(message.timestamp)}
                                >
                                  Click here to start Telegram
                                </ChatBubbleMessage>

                                <ChatBubbleMessage
                                  variant={
                                    message.sender === "web"
                                      ? "sent"
                                      : "received"
                                  }
                                  isSender={message.sender === "web"}
                                  user={"Agent"}
                                  time={new Date(
                                    message.timestamp
                                  ).toLocaleTimeString()}
                                >
                                  <div className="flex flex-col gap-2">
                                    <Button
                                      key={link}
                                      variant="bgWhite"
                                      size="sm"
                                      className="flex items-center justify-start gap-2"
                                      // open link whatsapp or telegram
                                      onClick={() =>
                                        window.open(link, "_blank")
                                      }
                                    >
                                      <Image
                                        aria-hidden
                                        src="/telegram.svg"
                                        alt="File icon"
                                        width={20}
                                        height={20}
                                      />
                                      Telegram
                                    </Button>
                                  </div>
                                </ChatBubbleMessage>
                              </div>
                            );
                          } else if (whatsappMatch) {
                            const [_, link] = whatsappMatch;
                            return (
                              <div className="flex flex-col gap-2">
                                <ChatBubbleMessage
                                  variant={
                                    message.sender === "web"
                                      ? "sent"
                                      : "received"
                                  }
                                  isSender={message.sender === "web"}
                                  user={"Agent"}
                                  time={formatDate(message.timestamp)}
                                >
                                  Click here to start WhatsApp
                                </ChatBubbleMessage>
                                <ChatBubbleMessage
                                  variant={
                                    message.sender === "web"
                                      ? "sent"
                                      : "received"
                                  }
                                  isSender={message.sender === "web"}
                                  user={"Agent"}
                                  time={new Date(
                                    message.timestamp
                                  ).toLocaleTimeString()}
                                >
                                  <div className="flex flex-col gap-2">
                                    <Button
                                      key={link}
                                      variant="bgWhite"
                                      size="sm"
                                      className="flex items-center justify-start gap-2"
                                      // open link whatsapp or telegram
                                      onClick={() =>
                                        window.open(link, "_blank")
                                      }
                                    >
                                      <Image
                                        aria-hidden
                                        src="/whatsapp.svg"
                                        alt="File icon"
                                        width={20}
                                        height={20}
                                      />
                                      WhatsApp
                                    </Button>
                                  </div>
                                </ChatBubbleMessage>
                              </div>
                            );
                          } else {
                            return (
                              <ChatBubbleMessage
                                variant={
                                  message.sender === "web" ? "sent" : "received"
                                }
                                isSender={message.sender === "web"}
                                user={"Agent"}
                                time={formatDate(message.timestamp)}
                              >
                                {message?.msg}
                              </ChatBubbleMessage>
                            );
                          }
                        })()}

                        {currentChatMethod === "select" &&
                          message.msg === metadata?.msg_1 && (
                            <ChatBubbleMessage
                              variant="received2"
                              isSender={true}
                              user={"Agent"}
                            >
                              <div className="flex flex-col gap-2">
                                {availableContacts.map((contact) => (
                                  <Button
                                    key={contact.id}
                                    variant="bgWhite"
                                    size="sm"
                                    className="flex items-center justify-start gap-2"
                                    onClick={() =>
                                      // @ts-ignore

                                      handleChatMethodSelect(contact.id)
                                    }
                                  >
                                    <Image
                                      aria-hidden
                                      src={contact.icon}
                                      alt="File icon"
                                      width={20}
                                      height={20}
                                    />
                                    {contact.label}
                                  </Button>
                                ))}
                              </div>
                            </ChatBubbleMessage>
                          )}
                      </div>
                      <ChatBubbleActionWrapper>
                          {message?.sender == "worker" &&
                          !whatsappMatch &&
                          !telegramMatch &&
                          !fileMatch && (
                            actionAgentIcons.map(({ icon: Icon, type }) => (
                              <ChatBubbleAction
                                className="size-7"
                                key={type}
                                icon={
                                  type === "copy" && copiedMessageId === message.timestamp ? (
                                    <Check className="size-4" />
                                  ) : (
                                    Icon && <Icon className="size-4" />
                                  )
                                }
                                onClick={async () => {
                                  if (type === "copy") {
                                    await handleCopyMessage(message.msg, message.timestamp);
                                  }
                                }}
                              />
                            ))
                          )}


                        {message?.sender == "web" &&
                          !whatsappMatch &&
                          !telegramMatch &&
                          !fileMatch && (
                            <ChatBubbleAction
                              className={`size-7`}
                              key={"edit"}
                              icon={<Edit className="size-4" />}
                              onClick={() => {
                                setEditingMessage(message);
                                console.log("editingMessage:", message);
                              }}
                            />
                          )}
                      </ChatBubbleActionWrapper>
                    </ChatBubble>
                  );
                }
              )}
            {statusMsg && (
              <div className="flex justify-center items-center gap-2">
                <hr className="w-1/5 border-t-1 border-[#E9EAEB]" />
                <p className="text-xs text-gray-500">{statusMsg}</p>
                <hr className="w-1/5 border-t-1 border-[#E9EAEB]" />
              </div>
            )}

            {chatDisconnected && (
              <div className="flex justify-center items-center gap-2">
                <hr className="w-1/5 border-t-1 border-[#E9EAEB]" />
                <p className="text-xs text-gray-500">Chat disconnected</p>
                <hr className="w-1/5 border-t-1 border-[#E9EAEB]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </ChatMessageList>
        </ExpandableChatBody>
        <ExpandableChatFooter className="flex flex-col gap-[5px] items-start">
  

          <ChatInput
            value={chatMsg}
            uppy={uppy}
            sendChat={sendChat}
            setChatMsg={setChatMsg}
            chatMsg={chatMsg}
            editingMessage={editingMessage}
            handleEditMessage={handleEditMessage}
            setEditingMessage={setEditingMessage}
            sendDisabled={
              chatDisconnected ||
              waitingForWorker.current ||
              currentChatMethod !== "chat"
            }
          />
        </ExpandableChatFooter>

        {open && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <div className="bg-white space-y-4 rounded-lg p-4 w-[80%] max-w-md">
              <Dialog>
                <DialogHeader>
                  <DialogTitle className="text-left">
                    {action === "restart" ? (
                      <div className="flex items-center gap-2 bg-[#2970FF] rounded w-fit p-2 mb-3">
                        <RotateCcw className="p-1" color="#ffffff" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-red-500 rounded w-fit p-2 mb-3">
                        <Trash className="p-1" color="#ffffff" />
                      </div>
                    )}
                    {action === "restart" ? "Restart Chat" : "End Chat"}
                  </DialogTitle>
                  <DialogDescription className="mb-4 text-left">
                    {action === "restart"
                      ? "Are you sure you want to restart? Your current conversation will be lost."
                      : "Are you sure you want to end this conversation? You can't undo this action."}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 border-t border-gray-100">
                  <Button
                    className={`w-full ${
                      action === "restart"
                        ? "bg-[#2970FF] text-white hover:bg-[#2C7DFF]"
                        : "bg-destructive text-destructive-foreground hover:bg-destructive/95"
                    }`}
                    onClick={async () => {
                      if (action === "restart") {
                        setChats([]);
                        setStatusMsg(null);
                        setCurrentChatMethod("select");
                        setToken(null);
                        setChatId(null);
                        setInitialMessage(null);
                        setIntialized(false);
                        setName(null);
                        setEmail(null);
                        setWorkerConnected(false);
                        waitingForWorker.current = false;
                        initalChatSequence.current = "welcome";

                        // Then disconnect socket
                        await disconnect();

                        // Finally reset connection states
                        setChatDisconnected(false);

                        // Restart initial chat sequence with welcome message
                        initialChatSequence("", metadata?.msg_1);
                        setOpen(false);
                      } else {
                        disconnect();
                        setOpen(false);
                      }
                    }}
                  >
                    {action === "restart" ? "Restart Chat" : "End Chat"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Dialog>
            </div>
          </div>
        )}
      </ExpandableChat>
    
  );
}
