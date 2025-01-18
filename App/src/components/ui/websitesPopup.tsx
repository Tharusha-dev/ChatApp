import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Website } from "@/types/types";
import { Badge } from "@/components/ui/badge"


export default function WebsitesPopup({websites}: {websites: Website[]}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Badge variant="outline">{websites.length}</Badge>    
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Websites</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
         {websites.map((website) => (
          <div key={website._id}>
            <h3>{website.domain}</h3>
          </div>
         ))}
        </div>
        
      </DialogContent>
    </Dialog>
  )
}
