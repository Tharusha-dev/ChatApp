import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
  import { Button } from "@/components/ui/button"
  import { useEffect } from 'react'
  import { Socket } from "socket.io-client";
import { getCookie, hasCookie } from "cookies-next/client";

  
export default function RequestsPopup({bufferUsers, socket, setWorkerChats, setBufferUsers}: {bufferUsers: any[], socket: Socket, setWorkerChats: any, setBufferUsers: any}) {
    const workerToken = getCookie("userToken");
    console.log("re-rendering");
    console.log(bufferUsers);
    return <Dialog>
        <DialogTrigger>
            <Button>Requests</Button>
           
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
            </DialogHeader>

             {bufferUsers.map((user) => (
                <div key={user.userToken}>
                    <span>{user.userToken}</span>
                    <Button onClick={() => {
                        setWorkerChats((prevChats: any) => [...prevChats, {workerToken: workerToken, webToken: user.userToken, chatId: user.chatId}]);
                        setBufferUsers((prevUsers: any[]) => prevUsers.filter(bufferUser => bufferUser.chatId !== user.chatId));
                        socket.emit("worker-buffer-accept", JSON.stringify({workerToken: workerToken, webToken: user.userToken, chatId: user.chatId}));
                    }}>Accept</Button>
                </div>
            ))}
        </DialogContent>
    </Dialog>
}