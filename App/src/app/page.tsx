"use client";

import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { useCallback, useEffect, useState } from "react";
import { deleteCookie, getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import Websites from "@/components/ui/websites";
import Workers from "@/components/ui/workers";
import ChatDashboard from "@/components/ui/chat";
import { useStore } from "@/stores/store";
import { API_URL } from "@/lib/config";
import WhatsappManager from "@/components/ui/whatsappManager";
import SettingsDropdown from "@/components/ui/settings";
import WebsiteData from "@/components/ui/websiteData";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [workerChats, setWorkerChats] = useState<any[]>([]);
  const [bufferUsers, setBufferUsers] = useState<any[]>([]);
  const [newChats, setNewChats] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [refreshActiveChat, setRefreshActiveChat] = useState<boolean>(false);
  const router = useRouter();

  const initializeStore = useStore((state) => state.initializeStore);

  useEffect(() => {
    const token = getCookie('chatzu-userToken');
    console.log("check this")
    console.log(token);
    if(!token || token === '' || token === 'undefined') router.push('/login');

    async function init(){
      const isAdminRes = await fetch(`${API_URL}/worker/isAdmin`, {
        headers: {
          auth: getCookie("chatzu-userToken") as string,
        },
      });
      const isAdminData = await isAdminRes.json();
      setIsAdmin(isAdminData?.isAdmin);
      if(isAdminData?.relogin){
        deleteCookie('chatzu-userToken');
        router.push('/login');
      }
    }

    init();




 
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
          auth: getCookie("chatzu-userToken") as string,
        },
      });


     
      const chatsData = await chatsRes.json();
      // console.log(chatsData);
      setWorkerChats(
        chatsData.map((chat: any) => ({ ...chat, chatId: chat._id.toString() }))
      );


    const buffer = await fetch(`${API_URL}/worker/get-buffer`, {
      headers: {
        auth: getCookie("chatzu-userToken") as string,
      },
    });

    const bufferData = await buffer.json();
    console.log("bufferData:", bufferData);

    setBufferUsers(bufferData);

    }

    getData();

    // const socket = io(`${API_URL}`, {
    //   transports: ['websocket'],
    //   path: "/socket.io",
    //   query: { type: "worker-connect-request", token: getCookie("chatzu-userToken") },
    // });
    const socket = io("https://app.chatzu.ai", {
      path: "/api/socket.io",
      query: { type: "worker-connect-request", token: getCookie("chatzu-userToken") },
    });
    
    setSocket(socket);

    socket.on("buffer-request", (data) => {
      // debug(data);
      console.log("buffer-request:", data);
      updateBuffer(data);
      showNotification();
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

    // socket.on("qr", (data) => {
    //   console.log("qr:", data);
    //   // handleChat(data);
    // });

    const showNotification = () => {
      if (!("Notification" in window)) {
        alert(`New request`);
        return;
      }
  
      if (Notification.permission === "granted") {
        new Notification(`New request`);
        playNotificationSound(); // Play sound
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
              new Notification(`New request`);
              playNotificationSound(); // Play sound
          }
        });
      }
    };
    const playNotificationSound = () => {
      const audio = new Audio("/bell.wav"); // Replace with the path to your sound file
      audio.play();
    };

    // Fetch initial data from the database
    const fetchData = async () => {
      try {
        const responseWorkers = await fetch(`${API_URL}/admin/get-workers`, {
          headers: {
            auth: getCookie("chatzu-userToken") as string,
          },
        }); // Replace with your API route
        const responseWebsites = await fetch(`${API_URL}/admin/get-websites`, {
          headers: {
            auth: getCookie("chatzu-userToken") as string,
          },
        }); // Replace with your API route
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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} socket={socket}/>
      <main className="flex-1 p-6 overflow-auto">
  
          {activeTab === 'chat' && <ChatDashboard socketIn={socket} workerChatsIn={workerChats} bufferUsersIn={bufferUsers} refreshActiveChat={refreshActiveChat} newChatsIn={newChats} setBufferUsers={setBufferUsers}/>}
      {isAdmin && (
        <>
          {activeTab === 'workers' && <Workers />}
          {activeTab === 'websites' && <Websites />}
          {activeTab === 'whatsapp' && <WhatsappManager socket={socket} />}
          {activeTab === 'metadata' && <WebsiteData />}
        </>
      )}
      
        </main>
      </div>
  );
}
