import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Clock } from 'lucide-react'

interface User {
  webName: string
  initialMessage: {
    timestamp: number
    msg: string
  }
  userToken: string
}

interface UserCardProps {
  user: User
  onAccept: (user: User) => void
}

export function BufferCard({ user, onAccept }: UserCardProps) {

  console.log("user:", user);


  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar className="h-10 w-10" >
              <AvatarImage src='/profile-default.svg' />
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold">{user.webName}</h3>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatTime(user.initialMessage.timestamp)}
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {user.initialMessage.msg}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => onAccept(user)}>
            Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

