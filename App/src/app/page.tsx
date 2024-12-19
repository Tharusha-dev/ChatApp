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
  const [bufferUsers, setBufferUsers] = useState<any[]>([]);
  const router = useRouter();

  const initializeStore = useStore((state) => state.initializeStore);

  useEffect(() => {
    const token = getCookie('userToken');
    console.log("check this")
    console.log(token);
    if(!token || token === '' || token === 'undefined') router.push('/login');
 
  }, []);
  const [activeTab, setActiveTab] = useState('chat')

  useEffect(() => {
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
          {activeTab === 'chat' && <ChatDashboard />}
          {activeTab === 'workers' && <Workers />}
          {activeTab === 'websites' && <Websites />}
        </main>
      </div>
  );
}
