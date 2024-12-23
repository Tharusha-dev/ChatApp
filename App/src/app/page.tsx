"use client";

import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { useCallback, useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import Websites from "@/components/ui/websites";
import Workers from "@/components/ui/workers";
import ChatDashboard from "@/components/ui/chat";
import { useStore } from "@/stores/store";
import { API_URL } from "@/lib/config";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [workerChats, setWorkerChats] = useState<any[]>([]);
  const [bufferUsers, setBufferUsers] = useState<any[]>([]);
  const [newChats, setNewChats] = useState<any[]>([]);
  const [refreshActiveChat, setRefreshActiveChat] = useState<boolean>(false);
  const router = useRouter();

  const initializeStore = useStore((state) => state.initializeStore);

  useEffect(() => {
    const token = getCookie('userToken');
    console.log("check this")
    console.log(token);
    if(!token || token === '' || token === 'undefined') router.push('/login');




 
  }, []);
  const [activeTab, setActiveTab] = useState('chat')


  function updateBuffer(data: any) {
    console.log("updating buffer, current state:", bufferUsers);
    setBufferUsers((prevUsers) => {
      const newState = [...prevUsers, data];
      return newState;
    });
  }

  function handleChat(data: any) {
    console.log("handling chat:", data);
    setNewChats((prevChats) => [...prevChats, data]);
    // setWorkerChats(prevChats => [...prevChats, data]);
  }
  useEffect(() => {


    async function getData() {

      const chatsRes = await fetch(`${API_URL}/worker/get-chats`, {
        headers: {
          auth: getCookie("userToken") as string,
        },
      });

     
      const chatsData = await chatsRes.json();
      // console.log(chatsData);
      setWorkerChats(
        chatsData.map((chat: any) => ({ ...chat, chatId: chat._id.toString() }))
      );


    const buffer = await fetch(`${API_URL}/worker/get-buffer`, {
      headers: {
        auth: getCookie("userToken") as string,
      },
    });

    const bufferData = await buffer.json();
    console.log("bufferData:", bufferData);

    setBufferUsers(bufferData);

    }

    getData();

    const socket = io(`${API_URL}`, {
      transports: ['websocket'],
      path: "/socket.io",
      query: { type: "worker-connect-request", token: getCookie("userToken") },
    });

    setSocket(socket);

    socket.on("buffer-request", (data) => {
      // debug(data);
      console.log(data);
      updateBuffer(data);
    });

    socket.on("party-disconnected", (data) => {
      console.log("party disconnected:", data);
      
      setRefreshActiveChat(true);
    });

    socket.on("chat-msg", (data) => {
      console.log("chat msg:", data);
      if(data?.msg?.sender == "web"){
        handleChat(data);
      }
    });


    // Fetch initial data from the database
    const fetchData = async () => {
      try {
        const responseWorkers = await fetch(`${API_URL}/admin/get-workers`); // Replace with your API route
        const responseWebsites = await fetch(`${API_URL}/admin/get-websites`); // Replace with your API route
        const workers = await responseWorkers.json();
        const websites = await responseWebsites.json();

        console.log({workers, websites});


        initializeStore(workers, websites);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };

    fetchData();
  }, [initializeStore]);


  return (

    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'chat' && <ChatDashboard socketIn={socket} workerChatsIn={workerChats} bufferUsersIn={bufferUsers} refreshActiveChat={refreshActiveChat} newChatsIn={newChats} />}
          {activeTab === 'workers' && <Workers />}
          {activeTab === 'websites' && <Websites />}
        </main>
      </div>
  );
}
