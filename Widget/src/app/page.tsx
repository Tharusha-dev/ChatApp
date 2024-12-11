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
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  // const [socket, setSocket] = useState<Socket | null>(null);
  const [bufferUsers, setBufferUsers] = useState<any[]>([]);
  const [chatMsg, setChatMsg] = useState<string>("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [intialized, setIntialized] = useState<boolean>(false);
  const [chats, setChats] = useState<any[]>([]);
  const [name, setName] = useState<string | null>(null);
const [chatDisconnected, setChatDisconnected] = useState<boolean>(false);
  // let socket = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  async function join(initialMessage: string) {
    console.log("login");
    const res = await fetch("http://localhost:8000/web/join", {
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
      }),
    });
    const data = await res.json();
    setToken(data.userToken);
    setChatId(data.chatId);
    const newSocket = io("http://localhost:8000", {
      query: {
        type: "web-chat-request",
        name: name,
        userToken: data.userToken,
        chatId: data.chatId,
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
    setChats([
      {
        msg: initialMessage,
        timestamp: Date.now(),
        sender: "web",
      },
    ]);
  }

  function sendChat() {
    if (!socket?.connected) {
      console.log("Socket not connected");
      return;
    }

    console.log("attempting to send chat");
    const payload = {
      userToken: token,
      msg: {
        msg: chatMsg || "Default message",
        timestamp: Date.now(),
      },
      chatId,
    };
    console.log("Sending payload:", payload);

    // socket.current.emit("chat-msg", payload);
    // socket.current.emit("worker-buffer-accept", payload);
    fetch("http://localhost:8000/chat-msg", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }




  function handleChat(data: any) {
    // data.msg
    //   {
    //     "msg": "new 2",
    //     "timestamp": 1733714960052,
    //     "sender": "worker"
    // }

    console.log("handling chat:", data);
    setChats((prevChats) => [...prevChats, data?.msg]);
    // setWorkerChats(prevChats => [...prevChats, data]);
  }
 async function handleBeforeUnload() {
    const data = {
      chatId,
      userToken: token,
      party: "web"
    };
    
    await fetch("http://localhost:8000/disconnect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({chatId, userToken: token}),
    });
    socket?.disconnect();
  }
  useEffect(() => {


    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [chatId, token, socket]);


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
          <h1 className="text-xl font-semibold">Chat with our AI ✨</h1>
          <p>Ask any question for our AI to answer</p>
          <div className="flex gap-2 items-center pt-2">
            <Button
              variant="secondary"
              onClick={async () => {

                await fetch("http://localhost:8000/disconnect", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({chatId, userToken: token, party: "web"}),
                });
                setChats([]);
                socket?.close();
                setIntialized(false);
                setInitialMessage(null);
                setChatMsg("");
                setChatDisconnected(false);
              }}
            >
              New Chat
            </Button>
     
            <Button onClick={async () => {
              if (socket?.connected) {
                console.log("disconnecting");
                console.log(socket);
                console.log(token);
                // Emit a custom disconnect event before closing

                await fetch("http://localhost:8000/disconnect", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({chatId, userToken: token, party: "web"}),
                });
               
                  console.log("disconnected");
                  // Only disconnect after confirmation the event was received
                  socket?.disconnect();
                  setIntialized(false);
                  setChatDisconnected(false);
                  setChats([]);
                  console.log(socket);
               
              }
            }}>
              Disconnect
            </Button>
          </div>
        </ExpandableChatHeader>
        <ExpandableChatBody>
          {!intialized && (
            <Card className="m-[10%]">
              <CardHeader>
                <CardTitle>Start Chat</CardTitle>
              </CardHeader>
 
              <CardFooter className="flex flex-col gap-4 items-start">
                <div className="w-full">
                <span>Name</span>
                <Input
                  type="text"
                  placeholder="What should we call you?"
                  onChange={(e) => setName(e.target.value)}
                />
                </div>
               <div className="w-full">
                <span>Describe your issue</span>
               <Input
                  type="text"
                  placeholder="Describe your issue"
                  onChange={(e) => setInitialMessage(e.target.value)}
                />
               </div>
              
                <Button onClick={() => initialMessage && join(initialMessage)}>
                  Start Chat
                </Button>
              </CardFooter>
            </Card>
          )}

          {intialized && (
            <ChatMessageList>
              {chats?.length > 0 &&
                chats.map(
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
                        fallback={message?.sender === "web" ? "WB" : "AI"}
                      />
                      <ChatBubbleMessage
                        variant={
                          message?.sender === "web" ? "received" : "sent"
                        }
                      >
                        {message?.msg}
                      </ChatBubbleMessage>
                    </ChatBubble>
                  )
                )}
            </ChatMessageList>
          )}
        </ExpandableChatBody>
        <ExpandableChatFooter className="flex flex-col gap-[5px] items-start">
          {chatDisconnected && (
            <div className="flex flex-col items-center justify-center">
              <p>The worker has disconnected</p>
            </div>
          )}
          <ChatInput
            onChange={(e) => {
              // console.log(e.target.value)
              setChatMsg(e.target.value);
            }}
          />
          <Button type="button" size="icon" className="w-1/5" onClick={() => sendChat()} disabled={chatDisconnected}>
            send
            {/* <Send className="size-4" /> */}
          </Button>
        </ExpandableChatFooter>
      </ExpandableChat>
    </div>
  );
}
