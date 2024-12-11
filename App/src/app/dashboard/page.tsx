"use client";

import { getCookie, hasCookie } from "cookies-next/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RequestsPopup from "@/components/ui/requestsPopup";
import { io, Socket } from "socket.io-client";
import ChatModal from "@/components/ui/chat-modal";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  Sidebar,
  Search,
  ConversationList,
  Conversation,
  Avatar,
  ConversationHeader,
  MessageSeparator,
} from "@chatscope/chat-ui-kit-react";

import SettingsDropdown from "@/components/ui/settings";

export default function Dashboard() {
  const [bufferUsers, setBufferUsers] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [workerChats, setWorkerChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatDisconnected, setChatDisconnected] = useState<boolean>(false);
  const [conversationSearch, setConversationSearch] = useState<string>("");

  const workerToken = getCookie("userToken") as string;

  const [newChats, setNewChats] = useState<any[]>([]);
  const [refreshActiveChat, setRefreshActiveChat] = useState<boolean>(false);
  // useEffect(() => {
  //   console.log("worker chats:", workerChats);
  // }, [workerChats]);

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
      // const bufferRes = await fetch(`http://localhost:8000/worker/get-buffer`, {
      //   headers: {
      //     "auth": getCookie("userToken") as string
      //   }
      // });

      const chatsRes = await fetch(`http://localhost:8000/worker/get-chats`, {
        headers: {
          auth: getCookie("userToken") as string,
        },
      });

      // const bufferData = await bufferRes.json();
      // setBufferUsers(bufferData);

      const chatsData = await chatsRes.json();
      setWorkerChats(
        chatsData.map((chat: any) => ({ ...chat, chatId: chat._id.toString() }))
      );
    }

    getData();

    const socket = io("http://localhost:8000", {
      query: { type: "worker-connect-request", token: getCookie("userToken") },
    });
    if (socket) {
      console.log("Socket state changed");
      setSocket(socket);

      socket.on("connect", () => {
        console.log("Socket connected in useEffect");
      });

      socket.on("buffer-request", (data) => {
        // debug(data);
        console.log(data);
        updateBuffer(data);
      });

      socket.on("party-disconnected", (data) => {
        console.log("party disconnected:", data);
        setChatDisconnected(true);
        
        setRefreshActiveChat(true);
      });

      socket.on("chat-msg", (data) => {
        console.log("chat msg:", data);
        if(data?.msg?.sender == "web"){
          handleChat(data);
        }
      });
    }
  }, []);



  const router = useRouter();
  useEffect(() => {
    if (!hasCookie("userToken")) {
      router.push("/login");
    }
  }, []);




  async function disconnect() {
    await fetch("http://localhost:8000/disconnect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({chatId: activeChat, userToken: workerToken, party: "worker"}),
    });
 
  }



  const filteredChats = workerChats.filter(chat => 
    chat.webName.toLowerCase().includes(conversationSearch.toLowerCase())
  );

  return (
    <div className="w-screen h-screen flex flex-col p-[1%]">
      <div className="top-bar w-full h-10  flex items-center justify-between mb-[1%]">
        {socket && (
          <RequestsPopup
            bufferUsers={bufferUsers}
            socket={socket}
            setWorkerChats={setWorkerChats}
            setBufferUsers={setBufferUsers}
          />
        )}

        <SettingsDropdown />
        {/* <Button className="ml-auto">Requests</Button> */}
      </div>
      <MainContainer
        responsive
        style={{
          height: "10000px",
        }}
      >
        <Sidebar position="left">
          <Search placeholder="Search..." onChange={(e) => setConversationSearch(e)} onClearClick={() => setConversationSearch("")} />
          <ConversationList>
            {filteredChats.map((chat) => {
              return (
                <Conversation
                  info={chat?.initialMessage?.msg}
                  lastSenderName={chat?.webName}
                  name={chat?.webName}
                  onClick={() => {
                    setActiveChat(chat.chatId);
                    console.log("active chat:", chat.chatId);
                  }}
                >
                  <Avatar
                    name="Lilly"
                    src="/profile-default.svg"
                  />
                </Conversation>
              );
            })}
          </ConversationList>
        </Sidebar>

        <ChatContainer>
          <ConversationHeader>
            <ConversationHeader.Back />
            <Avatar
              name={workerChats.find(chat => chat.chatId === activeChat)?.webName}
              src="/profile-default.svg"
            />
            <ConversationHeader.Content
    
              userName={workerChats.find(chat => chat.chatId === activeChat)?.webName}
            />
            {/* <ConversationHeader.Actions>
              <Button onClick={() => {
                disconnect()
              }}>Disconnect</Button>
            </ConversationHeader.Actions> */}
          </ConversationHeader>
          <MessageList>
            
            {activeChat && (
          <ChatModal
            key={activeChat}
            chatId={activeChat}
            newChat={newChats}
            workerToken={getCookie("userToken") as string}
            refresh={refreshActiveChat}
          />
        )}
          </MessageList>
       
        </ChatContainer>
      </MainContainer>

      <div className="grid grid-cols-[30%,70%] h-full">
      </div>
    </div>
  );
}
