import { ChatInput } from "@/components/ui/chat/chat-input";
import { Paperclip } from "lucide-react";
import { Button } from "./button";
import { Mic } from "lucide-react";
import { CornerDownLeft } from "lucide-react";
import { useState } from "react";

export default function ChatInputComponent({
  sendMessage,
  disabled
}: {
  sendMessage: (msg: string) => void;
  disabled: boolean;
}) {
  const [message, setMessage] = useState("");

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
