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
import { Input } from "@/components/ui/input";

import { useSearchParams } from 'next/navigation'

export default function Home() {
  // const API_URL = "https://app.chatzu.ai/api";
  const queryParams = useSearchParams()
  const websiteId = queryParams.get("websiteId")
  const currentUrl = queryParams.get("currentUrl")

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
  const initalChatSequence = useRef<"name" | "email" | "issue" | "join" |"chat">("name");
  // let socket = useRef<Socket | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Add new state for tracking typing timeout
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      body: JSON.stringify({websiteId}),
    
    });

   let dataAvailable = await resAvailabe.json();
   if(dataAvailable?.available){
    setStatusMsg("An agent will be in touch shortly");
   } else {
    setStatusMsg(metadata?.msg_4 || "No agents available");
   }
    // setChats([
    //   {
    //     msg: initialMessage,
    //     timestamp: Date.now(),
    //     sender: "web",
    //   },
    // ]);
  }

  function sendChat() {
    if (!socket?.connected) {
      console.log("Socket not connected");

      console.log("initalChatSequence", initalChatSequence, chatMsg);


      if(initalChatSequence.current === "name"){
        setName(chatMsg);
        setChats(prevChats => [...prevChats, {
          msg: chatMsg,
          timestamp: Date.now(),
          sender: "web",
        }])
        initalChatSequence.current = "email";
      }

      else if(initalChatSequence.current === "email"){
        setEmail(chatMsg);
        setChats(prevChats => [...prevChats, {
          msg: chatMsg,
          timestamp: Date.now(),
          sender: "web",
        }])
        initalChatSequence.current = "issue";
      } 

      else if(initalChatSequence.current === "issue"){
        setInitialMessage(chatMsg);
        setChats(prevChats => [...prevChats, {
          msg: chatMsg,
          timestamp: Date.now(),
          sender: "web",
        }])
        initalChatSequence.current = "join";
      }

      initialChatSequence(chatMsg, metadata?.msg_1);

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
    setChats((prevChats) => [...prevChats, data?.msg]);
    // setWorkerChats(prevChats => [...prevChats, data]);
  }
 async function handleBeforeUnload() {
    const data = {
      chatId,
      userToken: token,
      party: "web"
    };
    
    await fetch(`${API_URL}/disconnect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({chatId, userToken: token}),
    });
    socket?.disconnect();
  }


  async function initialChatSequence(intialMsg: string = "", msg_1:string = ""){

    if(initalChatSequence.current === "chat"){
      return;
    }

      else if(initalChatSequence.current === "join"){
      // setInitalChatSequence("name");
      join(intialMsg);
    }

    else if(initalChatSequence.current === "name"){
      setChats(prevChats => [...prevChats, {
        msg: msg_1 || "what is your name?",
        timestamp: Date.now(),
        sender: "worker",
      }])
    }

    else if(initalChatSequence.current === "email"){
      setChats(prevChats => [...prevChats, {
        msg: metadata?.msg_2,
        timestamp: Date.now(),
        sender: "worker",
      }])
    }

    else if(initalChatSequence.current === "issue"){
      setChats(prevChats => [...prevChats, {
        msg: metadata?.msg_3,
        timestamp: Date.now(),
        sender: "worker",
      }])
    }
    // message: {
    //   timestamp: number;
    //   msg: string;
    //   sender: "web" | "worker";
    // }


  }

  useEffect(() => {
    async function getMetadata(){
      const res = await fetch(`${API_URL}/web/get-metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({websiteId}),
      });
      const data = await res.json();
      setMetadata(data);
    initialChatSequence("", data?.msg_1);

    }

    getMetadata();
  }, []);


  useEffect(() => {


    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [chatId, token, socket]);

  async function disconnect(){
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
  }


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
          <h1 className="text-xl font-semibold">{metadata?.title || "Chat with us"}</h1>
          <p>{metadata?.description || "Ask any question"}</p>
          <div className="flex gap-2 items-center pt-2">
            
     
            {/* <Button onClick={async () => {
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
            </Button> */}
          </div>
        </ExpandableChatHeader>
        <ExpandableChatBody>

          

  
     
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
                        fallback={message?.sender === "web" ? "You" : "Agent"}
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
          <ChatInput
            value={chatMsg}
            onChange={(e) => {
              setChatMsg(e.target.value);
              // Timeout will automatically reset due to the useEffect above
            }}
          />

          <div className="flex gap-2 items-center justify-between w-full" >
            
          <Button type="button" size="icon" className="w-1/5" onClick={() => {sendChat(); setChatMsg("");}} disabled={chatDisconnected}>
            send
          </Button>

          <Button onClick={async () => {
              disconnect();
            }}>
              End chat
            </Button>
            </div>
   


        </ExpandableChatFooter>
      </ExpandableChat>
    </div>
  );
}
