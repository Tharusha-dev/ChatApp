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

export default function ChatDashboard({
  socketIn,
  workerChatsIn,
  bufferUsersIn,
  refreshActiveChat,
  newChatsIn,
}: {
  socketIn: Socket | null;
  workerChatsIn: any[];
  bufferUsersIn: any[];
  refreshActiveChat: boolean;
  newChatsIn: any[];
}) {
  const [bufferUsers, setBufferUsers] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [workerChats, setWorkerChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatDisconnected, setChatDisconnected] = useState<boolean>(false);
  const [conversationSearch, setConversationSearch] = useState<string>("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const workerToken = getCookie("userToken") as string;

  const [newChats, setNewChats] = useState<any[]>([]);

  // Create a sorting function to avoid code duplication
  // const sortChats = (chats: any[]) => {
  //   return [...chats].sort(
  //     (a, b) => getLatestTimestamp(b) - getLatestTimestamp(a)
  //   );
  // };

  // Update setWorkerChats to always sort the chats
  const setWorkerChatsWithSort = (chats: any[]) => {
    console.log(chats);
    // const sortedChats = sortChats(chats);
    setWorkerChats(chats);
  };

  useEffect(() => {
    console.log("worker chats:", workerChatsIn);
    setWorkerChatsWithSort(workerChatsIn);
  }, [workerChatsIn]);

  useEffect(() => {
    setNewChats(newChatsIn);
  }, [newChatsIn]);

  useEffect(() => {
    setBufferUsers(bufferUsersIn);
  }, [bufferUsersIn]);

  useEffect(() => {
    if (socketIn) {
      console.log("Socket state changed");
      setSocket(socketIn);
    }
  }, [socketIn]);

  const router = useRouter();
  useEffect(() => {
    if (!hasCookie("userToken")) {
      router.push("/login");
    }
  }, []);

  const getUniqueDomains = (chats: any[]) => {
    return Array.from(new Set(chats.map((chat) => chat.websiteDomain))).filter(
      Boolean
    );
  };

  const filteredChats = workerChats.filter(
    (chat) =>
      chat.webName.toLowerCase().includes(conversationSearch.toLowerCase()) &&
      (selectedDomains.length === 0 ||
        selectedDomains.includes(chat.websiteDomain))
  );

  const getLatestTimestamp = (chat: any): number => {
    if (!chat.chat || chat.chat.length === 0) return 0;

    const lastMessage = chat.chat[chat.chat.length - 1];
    const timestamp = lastMessage.timestamp;

    // Handle both ISO string and numeric timestamp formats
    return typeof timestamp === "string"
      ? new Date(timestamp).getTime()
      : Number(timestamp);
  };

  const groupChatsByEmail = (chats: any[]) => {
    console.log("grouping chats by email", chats);

    // First, sort all chats by timestamp
    const sortedChats = [...chats].sort(
      (a, b) => getLatestTimestamp(b) - getLatestTimestamp(a)
    );

    // Group chats by email
    const groups = sortedChats.reduce(
      (groups: { [key: string]: any[] }, chat) => {
        const email = chat.webEmail || "No Email";
        if (!groups[email]) {
          groups[email] = [];
        }
        groups[email].push(chat);
        return groups;
      },
      {}
    );

    // Convert to array of [email, chats] pairs and sort by most recent chat in each group
    const sortedGroups = Object.entries(groups).sort(
      ([, chatsA], [, chatsB]) => {
        const latestA = Math.max(...chatsA.map(getLatestTimestamp));
        const latestB = Math.max(...chatsB.map(getLatestTimestamp));
        return latestB - latestA;
      }
    );

    // Convert back to object
    return Object.fromEntries(sortedGroups);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="top-bar w-full h-10  flex items-center justify-between mb-[1%]">
        {socket && (
          <RequestsPopup
            bufferUsers={bufferUsers}
            socket={socket}
            workerChats={workerChats}
            setWorkerChats={setWorkerChatsWithSort}
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
        <Sidebar position="left" style={{ width: "27%", maxWidth: "27%" }}>
          <Search
            placeholder="Search..."
            onChange={(e) => setConversationSearch(e)}
            onClearClick={() => setConversationSearch("")}
          />

          <div className="p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full flex justify-between items-center"
                >
                  {selectedDomains.length === 0
                    ? "Filter by Website"
                    : `${selectedDomains.length} website${
                        selectedDomains.length > 1 ? "s" : ""
                      } selected`}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto">
                {getUniqueDomains(workerChats).map((domain) => (
                  <DropdownMenuCheckboxItem
                    key={domain}
                    checked={selectedDomains.includes(domain)}
                    onCheckedChange={(checked) => {
                      setSelectedDomains((prev) =>
                        checked
                          ? [...prev, domain]
                          : prev.filter((d) => d !== domain)
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
            {Object.entries(groupChatsByEmail(filteredChats)).map(
              ([email, chats]) => (
                <div key={email}>
                  <MessageSeparator
                    content={email}
                    style={{
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      margin: "8px 0",
                      borderRadius: "4px",
                      fontSize: "0.9em",
                      color: "#666",
                    }}
                  />
                  {chats.map((chat) => (
                    <ChatInfoCard
                      key={chat.chatId}
                      type={chat?.type}
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
              )
            )}
          </ConversationList>
        </Sidebar>

        <ChatContainer>
          <ConversationHeader>
            <ConversationHeader.Back />
            <Avatar
              name={
                workerChats.find((chat) => chat.chatId === activeChat)?.webName
              }
              src="/profile-default.svg"
            />
            <ConversationHeader.Content
              userName={
                workerChats.find((chat) => chat.chatId === activeChat)?.webName
              }
            />
            {/* <ConversationHeader.Actions>
              <Button onClick={() => {
                disconnect()
              }}>Disconnect</Button>
            </ConversationHeader.Actions> */}
          </ConversationHeader>
          <MessageList>
            {activeChat && socket && (
              <ChatModal
                key={activeChat}
                chatId={activeChat}
                newChat={newChats}
                workerToken={getCookie("userToken") as string}
                refresh={refreshActiveChat} 
                socket={socket}
                setWorkerChats={setWorkerChatsWithSort}
              />
            )}
          </MessageList>
        </ChatContainer>
      </MainContainer>
    </div>
  );
}
