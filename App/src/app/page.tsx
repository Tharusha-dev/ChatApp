"use client";

import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { useCallback, useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";

//temp token  : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ0eXBlIjoiYWRtaW4iLCJpYXQiOjE3MzMyMjIzMzh9.H2pQ5565nYv8EP06dqy2xmGuyWeypgXmS8jHIj_4LRs

function debug(buffer: any) {
  console.log("debug");
  console.log(buffer);
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [bufferUsers, setBufferUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = getCookie('userToken');
    console.log("check this")
    console.log(token);
    if(!token || token === '' || token === 'undefined') router.push('/login');
    if(token) {
      // router.push('/dashboard');
    }
  }, []);


  // async function login() {
  //   console.log("login");
  //   const res = await fetch("http://localhost:8000/login", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ id: "1" }),
  //   });
  //   const data = await res.json();
  //   setToken(data.token);
  //   const newSocket = io("http://localhost:8000", {
  //     query: { type: "worker-connect-request", token: data.token },
  //   });
  //   setSocket(newSocket);


  // }
  // useEffect(() => {
  //   if (socket) {
  //     console.log("Socket state changed");
  
  //     socket.on("connect", () => {
  //       console.log("Socket connected in useEffect");
  //     });
  
  //     socket.onAny((eventName, ...args) => {
  //       console.log("Event received:", eventName, args);
  //     });
  
  //     socket.on("buffer-request", (data) => {
  //       // debug(data);
  //       console.log(bufferUsers);
  //       setBufferUsers([...bufferUsers, data]);
  //     });
  
  //     return () => {
  //       socket.off("connect");
  //       socket.offAny();
  //       socket.off("buffer-request", debug);
  //     };
  //   }
  // }, [socket]);
  

  //@ts-ignore
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
{/*     
        <button
          onClick={() =>
            (socket as any).emit("chat-msg", {
              userToken: "token",
              adminToken: token,
              msg: "msg",
            })
          }
        >
          Send
        </button>
        <button onClick={() => login()}>Login</button>
        <div className="debug">
          <button onClick={() => (socket as any).emit("web-chat-request", {userToken: "token"})}>
            Send chat request
          </button>
          <button onClick={() => (socket as any).emit("admin-buffer-accept", {userToken: token, adminToken: token})}>
            Send buffer accept
          </button>
        </div>
       

       <div className="buffer">
          {bufferUsers.map((item) => (
            <div key={item.userToken}>{item.userToken}
            
            <button onClick={() => (socket as any).emit("admin-buffer-accept", {userToken: item.userToken, adminToken: token})}>Accept</button>
            </div>
          ))}
       </div> */}
    </div>
  );
}
