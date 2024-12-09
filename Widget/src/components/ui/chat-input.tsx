import { ChatInput } from "@/components/ui/chat/chat-input";
import { Paperclip } from "lucide-react";
import { Button } from "./button";
import { Mic } from "lucide-react";
import { CornerDownLeft } from "lucide-react";
import { useState } from "react";

export default function ChatInputComponent({
  sendMessage,
}: {
  sendMessage: (msg: string) => void;
}) {
  const [message, setMessage] = useState("");

  return (
    <div className="rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1">
      <ChatInput
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here..."
        className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center p-3 pt-0">
        <Button
          type="button"
          size="sm"
          className="ml-auto gap-1.5"
          onClick={() => sendMessage(message)}
        >
          Send Message
          <CornerDownLeft className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
