'use client'

import * as React from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SimpleImageSelectorProps {
 
  onSelect: (url: string) => void
  selectedIcon: string
}

export function ChatIconDropdown({ onSelect,  selectedIcon }: SimpleImageSelectorProps) {
 
    const images = [
        "https://www.svgrepo.com/show/529481/chat-round-dots.svg",
        "https://www.svgrepo.com/show/530377/chat-chat.svg",
        "https://www.svgrepo.com/show/529484/chat-round-unread.svg",
        "https://www.svgrepo.com/show/529475/chat-square.svg",
        "https://www.svgrepo.com/show/526897/chat-round-dots.svg"
      ]
    
 
    return (
    <Select onValueChange={onSelect} defaultValue={selectedIcon}>
      <SelectTrigger className="w-full" style={{height: "80%"}}>
        <SelectValue placeholder="Select an image" />
      </SelectTrigger>
      <SelectContent>
        {images.map((image) => (
          <SelectItem key={image} value={image} className="p-0">
            <div className="flex items-center gap-2 p-2">
              <Image
                src={image}
                alt={`Image option ${image}`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-sm object-cover"
              />
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

