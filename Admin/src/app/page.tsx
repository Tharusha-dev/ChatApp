"use client";

import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { useCallback, useEffect, useRef, useState } from "react";
import Script from 'next/script'

//temp token  : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ0eXBlIjoiYWRtaW4iLCJpYXQiOjE3MzMyMjIzMzh9.H2pQ5565nYv8EP06dqy2xmGuyWeypgXmS8jHIj_4LRs

function debug(buffer: any) {
  console.log("debug");
  console.log(buffer);
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  // const [socket, setSocket] = useState<Socket | null>(null);
  const [bufferUsers, setBufferUsers] = useState<any[]>([]);
  const [chatMsg, setChatMsg] = useState<string>("");
  const [chatId, setChatId] = useState<string | null>(null);

// let socket = useRef<Socket | null>(null);
const [socket, setSocket] = useState<Socket | null>(null);


  async function join() {
    console.log("login");
    const res = await fetch("http://localhost:8000/web/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({initialMessage: {
        timestamp: Date.now(), 
        msg: "Initial Hello"
      }})
    });
    const data = await res.json();
    setToken(data.userToken);
    setChatId(data.chatId);
    const newSocket = io("http://localhost:8000", {
      query: { 
        type: "web-chat-request", 
        userToken: data.userToken, 
        chatId: data.chatId,
        intialMessage: JSON.stringify({
          timestamp: Date.now(), 
          msg: "Initial Hello"
        })
      },
      transports: ['websocket'],
      reconnection: true
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    // socket.current = newSocket;
    setSocket(newSocket)
  }

  // Add cleanup function for socket
  const cleanup = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
  }, [socket]);

  // Handle window close/refresh
  useEffect(() => {
    window.addEventListener('beforeunload', cleanup);
    
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [cleanup]);

  // Modify your existing socket useEffect to include cleanup
  useEffect(() => {
    if (socket) {
      console.log("Socket state changed");
  
      socket.on("connect", () => {
        console.log("Socket connected in useEffect");
      });

      socket.on("chat-msg", (data) => {
        console.log("Received chat message:", data);
      });
  
      socket.onAny((eventName, ...args) => {
        console.log("Event received:", eventName, args);
      });

      // Add cleanup return function
      return () => {
        socket.disconnect();
      };
    }
  }, [socket]);
  

  //@ts-ignore
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
   
   {/* http://localhost:3001/?websiteId=6767dc57db29917c2b71c8ce&currentUrl=test.com */}
    {/* <Script src="loader.js" website-id="6767dc57db29917c2b71c8ce" icon-url="https://www.svgrepo.com/show/529481/chat-round-dots.svg"/> */}
    <Script src="https://chat.chatzu.ai/loader.js" website-id="67696cf926037c6b8c72b52f" icon-url="https://www.svgrepo.com/show/529481/chat-round-dots.svg"/>
      
      <div>
        
        <button
          onClick={() => {
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
              chatId
            };
            console.log("Sending payload:", payload);
            
              // socket.current.emit("chat-msg", payload);
            // socket.current.emit("worker-buffer-accept", payload);
            fetch("http://localhost:8000/chat-msg", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload)
            });
          }}
        >
          Send chat
        </button>

        <input 
          type="text" 
          value={chatMsg} 
          onChange={(e) => setChatMsg(e.target.value)} 
        />
      </div>
       
        <button onClick={() => join()}>Join</button>
        <button onClick={() => {console.log(socket);socket?.disconnect(); console.log("disconnected"); console.log(socket)}}>Disconnect</button>
        <div className="debug">
     
   
        </div>
       

    </div>
  );
}
