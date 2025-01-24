import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { getCookie, hasCookie } from "cookies-next/client";
import { BufferCard } from "@/components/ui/buffer-card";

import { ScrollArea } from "@/components/ui/scroll-area"

export default function RequestsPopup({
  bufferUsers,
  socket,
  workerChats,
  setWorkerChats,
  setBufferUsers,
}: {
  bufferUsers: any[];
  socket: Socket;
  workerChats: any[];
  setWorkerChats: any;
  setBufferUsers: any;
}) {
  const workerToken = getCookie("userToken");

  // Helper function to ensure unique users by chatId
  const addUniqueUser = (prevUsers: any[], newUser: any) => {
    const isExisting = prevUsers.some((user) => user.chatId === newUser.chatId);
    if (!isExisting) {
      return [newUser,...prevUsers];
    }
    return prevUsers;
  };

  // Update the setBufferUsers usage to ensure uniqueness
  const handleAccept = (user: any) => {

    const newchats = addUniqueUser(workerChats,  {
      workerToken: workerToken,
      webToken: user.userToken,
      chatId: user.chatId,
      webName: user.webName,
      websiteDomain: user.websiteDomain,
      initialMessage: user.initialMessage,
      chat : [
        {
          msg : user.initialMessage,
          timestamp : Date.now(),
          sender : "web"
        }
      ],
      metadata: user.metadata,
      type: user.type,
      webEmail: user.webEmail,
    })
    setWorkerChats(newchats);
    setBufferUsers((prevUsers: any[]) =>
      prevUsers.filter((bufferUser) => bufferUser.chatId !== user.chatId)
    );
    socket.emit(
      "worker-buffer-accept",
      JSON.stringify({
        workerToken: workerToken,
        webToken: user.userToken,
        chatId: user.chatId,
         webEmail: user.webEmail,
      })
    );
  };

  // console.log(bufferUsers);

  // useEffect(() => {
  //   console.log("bufferUsers changed");
  //   console.log(bufferUsers);
  // }, [bufferUsers]);

  return (
    <Dialog>
      <DialogTrigger>
        <div className="relative">
          {bufferUsers?.length > 0 && (
            <div className="num absolute text-black left-[90%] -top-[15%] bg-white h-5 w-5 border border-black flex items-center justify-center rounded-full">
              {bufferUsers?.length}
            </div>
          )}

          <Button>
            <img src="/request-logo.svg" alt="Requests" className="size-4" />
            Requests
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent>
        <ScrollArea className="h-[500px]">
        <DialogHeader>
          <DialogTitle className="mb-[4%]">Requests</DialogTitle>
        </DialogHeader>

        {bufferUsers.map((user) => (
          <div className="mb-5">
          <BufferCard user={user} onAccept={handleAccept} key={user.chatId} />

          </div>
        ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
