import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Dashboard, DashboardModal } from "@uppy/react";
import { useUppyEvent } from "@uppy/react";
import { ReplyAndEditBox } from "@/components/ui/replyAndEditBox";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import Tus from "@uppy/tus";
import { Send } from "lucide-react";
interface ChatInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const ChatInput = React.forwardRef<HTMLTextAreaElement, any>(
  (
    {
      className,
      uppy,
      sendChat,
      setChatMsg,
      chatMsg,
      editingMessage,
      setEditingMessage,
      sendDisabled,
      handleEditMessage,
      ...props
    },
    ref
  ) => {
    const [edit, setEdit] = React.useState<any>(null)
    return (
    <div className="relative flex flex-col w-full gap-2 z-1">
      {editingMessage && (
        <ReplyAndEditBox
          isSender={false}
          type={"edit"}
          replyToMessage={editingMessage}
          handleEditMessage={handleEditMessage}
          onCancel={() => {
            setEditingMessage(null);
          }}
        />
      )}
      <form className="relative flex items-center w-full z-1">
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              disabled={sendDisabled}
              className="absolute left-4 text-muted-foreground hover:text-foreground"
              aria-label="Attach file"
            >
              📎
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-full w-full">
            <Dashboard width={"100%"} height={"300px"} uppy={uppy} />
          </DialogContent>
        </Dialog>

        <textarea
          // ref={ref}
          autoFocus={true}
          value={editingMessage ? editingMessage.msg : chatMsg}
          onChange={(e) => 
          {
            if(editingMessage){
              setEditingMessage((prev:any) =>
                prev ? { ...prev, msg: e.target.value } : null
              )
            } else {
              setChatMsg(e.target.value)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!sendDisabled) {
                if (editingMessage) {
                  handleEditMessage(editingMessage.timestamp, editingMessage.msg);
                } else {
                  sendChat();
                  setChatMsg("");
                }
              }
            }
          }}
          placeholder="Message"
          className={cn(
            "pl-10 pr-12 h-[52px] bg-[#F5F5F5] text-sm placeholder:text-muted-foreground focus-visible:outline-none  disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-lg resize-none border border-[#E9EAEB] flex items-center",
            className
          )}
          style={{
            paddingTop: "16px",
            paddingBottom: "16px",
            lineHeight: "1.2rem",
          }}
          // {...props}
        />
        <button
          type="button"
          disabled={sendDisabled}
          onClick={(e) => {
            e.preventDefault();

            if (editingMessage) {
              handleEditMessage(editingMessage.timestamp,editingMessage.msg);
            } else {
              sendChat();
              setChatMsg("");
            }
          }}
          className={cn(
            "absolute flex items-center justify-center bg-white border w-[36px] h-[36px] rounded-lg right-4",
            !sendDisabled 
              ? "border-[#D1E0FF] text-blue-500 hover:text-blue-600 hover:border-[#2970FF]"
              : "border-gray-200 text-gray-300 cursor-not-allowed"
          )}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )}
);
ChatInput.displayName = "ChatInput";

export { ChatInput };
