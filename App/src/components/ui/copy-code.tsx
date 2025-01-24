'use client'

import { useState } from 'react'
import { Code, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Website } from '@/types/types';

export function CodeDialog({website}: {website: Website}) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    // const code = `<script src="https://chat.chatzu.ai/loader.js?v2" website-id="${website._id}" icon-url="${website.chat_icon}"></script>`
    
    const code = `
      <script> 
var scr = document.createElement("script");
scr.src = "https://chat.chatzu.ai/loader.js?v2" + "?ts=" + new Date().getTime();
scr.setAttribute("website-id", "${website._id}");
scr.setAttribute("icon-url", "${website.chat_icon}");
document.getElementsByTagName("head")[0].appendChild(scr);
</script>
    `
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center justify-center">
          <Code className="mr-2 h-4 w-4" />
          <span>Code</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] w-full">
        <DialogHeader className="flex flex-row items-center justify-between space-x-2">
          <DialogTitle className="text-center flex-grow">Copy code and paste it into your websites head</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={copyToClipboard}
            className="flex-shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Code className="h-4 w-4" />
            )}
          </Button>
        </DialogHeader>
        <div className="mt-4">
          <pre className="rounded-lg bg-muted p-4 overflow-x-auto whitespace-pre-wrap break-all">
            <code className="text-sm">
              {`<script> 
var scr = document.createElement("script");
scr.src = "https://chat.chatzu.ai/loader.js?v2" + "?ts=" + new Date().getTime();
scr.setAttribute("website-id", "${website._id}");
scr.setAttribute("icon-url", "${website.chat_icon}");
document.getElementsByTagName("head")[0].appendChild(scr);
</script>`}
            </code>
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}

