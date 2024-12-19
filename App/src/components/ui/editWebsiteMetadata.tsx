import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/stores/store";
import { useState } from "react";
import { Website } from "@/types/types";

export function EditWebsiteMetadata({ website }: { website: Website }) {
  const [title, setTitle] = useState(website.metadata.title);
  const [description, setDescription] = useState(website.metadata.description);
  const [msg_1, setMsg_1] = useState(website.metadata.msg_1);
  const [msg_2, setMsg_2] = useState(website.metadata.msg_2);
  const [msg_3, setMsg_3] = useState(website.metadata.msg_3);
  const [msg_4, setMsg_4] = useState(website.metadata.msg_4);
  const [chat_icon, setChatIcon] = useState(website.chat_icon);

  const updateWebsite = useStore((state) => state.updateWebsite);

  function handleSave() {
    updateWebsite(website._id, "metadata", {
      title,
      description,
      msg_1,
      msg_2,
      msg_3,
      msg_4,
    });
    updateWebsite(website._id, "chat_icon", chat_icon);
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Metadata</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Website Metadata</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              className="col-span-3"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              className="col-span-3"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="msg_1" className="text-right">
              Message 1
            </Label>
            <Input
              id="msg_1"
              value={msg_1}
              className="col-span-3"
              onChange={(e) => setMsg_1(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="msg_2" className="text-right">
              Message 2
            </Label>
            <Input
              id="msg_2"
              
              value={msg_2}
              className="col-span-3"
              onChange={(e) => setMsg_2(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="msg_3" className="text-right">
              Message 3
            </Label>
            <Input
              id="msg_3"
              
              value={msg_3}
              className="col-span-3"
              onChange={(e) => setMsg_3(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="msg_4" className="text-right">
              Message 4
            </Label>
            <Input
              id="msg_4"
              
              value={msg_4}
              className="col-span-3"
              onChange={(e) => setMsg_4(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="chat_icon" className="text-right">
              Chat Icon
            </Label>
            <Input
              id="chat_icon"
              
              value={website.chat_icon}
              className="col-span-3"
              onChange={(e) => setChatIcon(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
