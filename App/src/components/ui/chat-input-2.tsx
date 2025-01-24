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
import { Paperclip, Send } from "lucide-react";
import { useEffect } from "react";
interface ChatInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const ChatInput = React.forwardRef<HTMLTextAreaElement, any>(
  (
    {
      // className,
      uppy,
      sendChat,
      setChatMsg,
      chatMsg,
      editingMessage,
      setEditingMessage,
      replyingMessage,
      setReplyingMessage,
      handleReplyMessage,
      sendDisabled,
      handleEditMessage,
      ...props
    },
    ref
  ) => {

    const [replyNewMsg, setReplyNewMsg] = React.useState<any>(null);
    const [extractedMessages, setExtractedMessages] = React.useState<any>(null);
    console.log("editingMessage", editingMessage);
    console.log("replyingMessage", replyingMessage);

    useEffect(() => {
      if(editingMessage){
        setExtractedMessages(extractMessages(editingMessage.msg));
      }
    }, [editingMessage]);

    const extractNewMsg = (msg: string) => {
      const match = msg.match(/\[reply\]\[originalMsg=".*?"\]\[newMsg="(.*?)"\]\[\/reply\]/);
      return match ? match[1] : msg;
    };

    const extractMessages = (str:string) => {
      const originalMsgMatch = str.match(/\[originalMsg="([^"]*)"]/);
      const newMsgMatch = str.match(/\[newMsg="([^"]*)"]/);
    
      return {
        originalMsg: originalMsgMatch ? originalMsgMatch[1] : null,
        newMsg: newMsgMatch ? newMsgMatch[1] : null,
      };
    };

    const extractOriginalMsg = (msg: string) => {
      const match = msg.match(/\[reply\]\[originalMsg=".*?"\]\[newMsg="(.*?)"\]\[\/reply\]/);
      return match ? match[0] : msg;
    };

    const constructFullMsg = (originalMsg: string, newMsg: string) => {
      console.log("originalMsg", originalMsg);
      console.log("newMsg", newMsg);
      return `[reply][originalMsg="${originalMsg}"][newMsg="${newMsg}"][/reply]`;
    };



    return (
    <div className="relative flex flex-col w-full gap-2 z-1">
      {editingMessage && (
        <ReplyAndEditBox
          isSender={false}
          type={"edit"}
          replyToMessage={{...editingMessage, msg: extractedMessages?.newMsg ? extractedMessages?.newMsg : editingMessage.msg}}
     
          onCancel={() => {
            setEditingMessage(null);
            setReplyingMessage(null);
          }}
        />
      )}

{replyingMessage && (
        <ReplyAndEditBox
          isSender={false}
          type={"edit"}
          replyToMessage={replyingMessage}
     
          onCancel={() => {
            setEditingMessage(null);
            setReplyingMessage(null);
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
             <Paperclip size={18} />
            </button>
          </DialogTrigger>
          <DialogContent className="w-[50%]">
            <Dashboard width={"100%"} uppy={uppy} />
          </DialogContent>
        </Dialog>

        <textarea
          // ref={ref}
          autoFocus={true}
          value={editingMessage ? extractedMessages?.newMsg : replyingMessage ? replyNewMsg : chatMsg}
          onChange={(e) => 
          {
            if(editingMessage){
              const match = editingMessage.msg.match(/\[reply\]\[originalMsg=".*?"\]\[newMsg="(.*?)"\]\[\/reply\]/);
              
              if(match){
                console.log("match", match);
                setEditingMessage((prev:any) =>
                  prev ? { ...prev, msg: constructFullMsg(extractedMessages?.originalMsg, e.target.value) } : null
                )
              }else {
                setEditingMessage((prev:any) =>
                  prev ? { ...prev, msg: e.target.value } : null
                )
              }
              
             
            } else if(replyingMessage){
              setReplyNewMsg(e.target.value)
            }
            else {
              setChatMsg(e.target.value)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!sendDisabled) {
                if (editingMessage) {
                  handleEditMessage(editingMessage.timestamp, editingMessage.msg);
                } else if(replyingMessage){
                  // console.log("replyNewMsg", replyNewMsg);
                  handleReplyMessage(replyNewMsg,replyingMessage.msg);
                }
                else {
                  // console.log("chatMsg", chatMsg);
                  sendChat(chatMsg);
                  setChatMsg("");
                }
              }
            }
          }}
          placeholder="Message"
          className={cn(
            "pl-10 pr-12 h-[52px] bg-[#F5F5F5] text-sm placeholder:text-muted-foreground focus-visible:outline-none  disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-lg resize-none border border-[#E9EAEB] flex items-center",
           
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
            }else if(replyingMessage){
              // console.log("replyNewMsg", replyNewMsg);
              handleReplyMessage(replyNewMsg,replyingMessage.msg);
            }
            
            else {
              sendChat(chatMsg);
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
