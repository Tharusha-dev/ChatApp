import { ChatInput } from "@/components/ui/chat/chat-input";
import { Paperclip } from "lucide-react";
import { Button } from "./button";
import { Mic } from "lucide-react";
import { CornerDownLeft } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";

import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import { useUppyEvent } from '@uppy/react';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import Tus from '@uppy/tus'


export default function ChatInputComponent({
  sendMessage,
  disabled
}: {
  sendMessage: (msg: string) => void;
  disabled: boolean;
}) {
  const [message, setMessage] = useState("");

  const [uppy] = useState(() => new Uppy().use(Tus, {  endpoint: 'https://app.chatzu.ai/files/' }));
  useUppyEvent(uppy, 'upload-success', (file, response) => {
    console.log('File uploaded successfully:', file);
    console.log('Upload response:', response);

    const fileUrl = response.uploadURL;
    const fileName = file?.name || "file";
    const fileType = file?.type || "file";

    sendMessage(`[file][link="${fileUrl}"][name="${fileName}"][type="${fileType}"][/file]`);

  });


  return (
    <div className="rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1">
      <ChatInput
        disabled={disabled}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevents adding a new line
            sendMessage(message);
          }
        }}
        placeholder="Type your message here..."
        className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center p-3 pt-0">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1.5"
            >
              <Paperclip className="size-4" />
              <span className="sr-only">Attach files</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[850px] w-[800px]">
            <Dashboard uppy={uppy} />
          </DialogContent>
        </Dialog>

        <Button
          type="button"
          size="sm"
          className="ml-auto gap-1.5"
          onClick={() => sendMessage(message)}
          disabled={disabled}
        >
          Send Message
          <CornerDownLeft className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
