import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const ReplyAndEditBox = ({
  replyToMessage,
  onCancel,
  type,
  replayTo = false,
  isSender,
  brandColor,
}) => {
  console.log("replyToMessage test", replyToMessage);
  return (
    <div
      className={`border-l-4 flex  justify-between ${
        replayTo
          ? `border-[#D5D7DA]  ${
              !isSender ? "bg-[#F5F5F5]" : `bg-[${brandColor}]`
            } mb-2`
          : `border-[${brandColor}]`
      } p-2 rounded`}
      style={{backgroundColor: brandColor}}
    >
      <div className="flex flex-col">
        <div
          className={`text-sm ${
            replayTo ? `${!isSender ? "text-black" : "text-white"}` : "font-bold"
          }`}
        >
          {replyToMessage.user}
        </div>
        <div
          className={`text-xs ${
            replayTo ? `${!isSender ? "text-black" : "text-white"}` : ""
          }
           truncate w-[160px]`}
        >
          {replyToMessage.msg}
        </div>
      </div>
      {(type === "edit" || type === "reply") && replayTo === false && (
        <Button
          onClick={onCancel}
          size="icon"
          variant="bgWhite"
          className="text-xs"
        >
          <X size={16} />
        </Button>
      )}
    </div>
  );
};