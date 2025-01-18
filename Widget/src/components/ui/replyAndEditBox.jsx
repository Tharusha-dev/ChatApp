import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const ReplyAndEditBox = ({
  replyToMessage,
  handleEditMessage,
  onCancel,
  type,
  replayTo = false,
  isSender,
}) => {
  return (
    <div
      className={`border-l-4 flex  justify-between ${
        replayTo
          ? `border-[#D5D7DA]  ${
              !isSender ? "bg-[#F5F5F5]" : "bg-[#528BFF]"
            } mb-2`
          : "border-[#2970FF]"
      } bg-gray-100 p-2 rounded`}
    >
      <div className="flex flex-col">
        <div
          className={`text-sm ${
            replayTo ? `${!isSender ? "" : "text-white"}` : "font-bold"
          }`}
        >
          {/* {type === "edit" ? "You" : replyToMessage.user} */}
          You
        </div>
        <div
          className={`text-xs ${
            replayTo ? `${!isSender ? "" : "text-white"}` : ""
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
