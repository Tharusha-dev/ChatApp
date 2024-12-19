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
import ChatInfoCard from "@/components/ui/chatInfoCard";
import SettingsDropdown from "@/components/ui/settings";
import { API_URL } from "@/lib/config";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default function ChatDashboard() {
  const [bufferUsers, setBufferUsers] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [workerChats, setWorkerChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatDisconnected, setChatDisconnected] = useState<boolean>(false);
  const [conversationSearch, setConversationSearch] = useState<string>("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

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

      const chatsRes = await fetch(`${API_URL}/worker/get-chats`, {
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

    const socket = io(`${API_URL}`, {
      path: "/socket.io",
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







  const getUniqueDomains = (chats: any[]) => {
    return Array.from(new Set(chats.map(chat => chat.websiteDomain))).filter(Boolean);
  };

  const filteredChats = workerChats.filter(chat => 
    chat.webName.toLowerCase().includes(conversationSearch.toLowerCase()) &&
    (selectedDomains.length === 0 || selectedDomains.includes(chat.websiteDomain))
  );

  const groupChatsByEmail = (chats: any[]) => {
    return chats.reduce((groups: { [key: string]: any[] }, chat) => {
      const email = chat.webEmail || 'No Email';
      if (!groups[email]) {
        groups[email] = [];
      }
      groups[email].push(chat);
      return groups;
    }, {});
  };

  return (
    <div className="w-full h-full flex flex-col">
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
          height: "100%",
        }}
      >
        <Sidebar position="left" style={{width: "27%", maxWidth: "27%"}}>
          <Search placeholder="Search..." onChange={(e) => setConversationSearch(e)} onClearClick={() => setConversationSearch("")} />
          
          <div className="p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full flex justify-between items-center">
                  {selectedDomains.length === 0 
                    ? "Filter by Website" 
                    : `${selectedDomains.length} website${selectedDomains.length > 1 ? 's' : ''} selected`}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto">
                {getUniqueDomains(workerChats).map((domain) => (
                  <DropdownMenuCheckboxItem
                    key={domain}
                    checked={selectedDomains.includes(domain)}
                    onCheckedChange={(checked) => {
                      setSelectedDomains(prev => 
                        checked 
                          ? [...prev, domain]
                          : prev.filter(d => d !== domain)
                      );
                    }}
                  >
                    {domain}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ConversationList>
            {Object.entries(groupChatsByEmail(filteredChats)).map(([email, chats]) => (
              <div key={email}>
                <MessageSeparator content={email} style={{
                  backgroundColor: '#f5f5f5',
                  padding: '8px',
                  margin: '8px 0',
                  borderRadius: '4px',
                  fontSize: '0.9em',
                  color: '#666'
                }}/>
                {chats.map((chat) => (
                  <ChatInfoCard
                    key={chat.chatId}
                    webName={chat?.webName}
                    webEmail={chat?.webEmail}
                    metadata={chat?.metadata}
                    websiteDomain={chat?.websiteDomain}
                    isDisconnected={chat?.disconnect?.time > 0 || false}
                    onClick={() => {
                      setActiveChat(chat.chatId);
                      console.log("active chat:", chat.chatId);
                    }}
                  />
                ))}
              </div>
            ))}
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
            setWorkerChats={setWorkerChats}
          />
        )}
          </MessageList>
       
        </ChatContainer>
      </MainContainer>

    </div>
  );
}
