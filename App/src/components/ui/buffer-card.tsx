import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Clock } from "lucide-react"

interface User {
  webName: string
  initialMessage: {
    timestamp: number
    msg: string
  }
  userToken: string
  type: string | undefined
  isOldUser: boolean
}

interface UserCardProps {
  user: User
  onAccept: (user: User) => void
}



export function BufferCard({ user, onAccept }: UserCardProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return (
      date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      }) +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start space-x-4 flex-grow">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src="/profile-default.svg" />
            </Avatar>
            <div className="flex-grow min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold truncate">{user.webName}</h3>
                <p
                  className={`text-xs px-2 py-0.5 rounded-full ${user.isOldUser ? "bg-gray-200 text-gray-700" : "bg-blue-200 text-blue-700"}`}
                >
                  {user.isOldUser ? "Old User" : "New User"}
                </p>
                <p
                  className={`text-xs px-2 py-0.5 rounded-full ${user.type === "whatsapp" ? "bg-[#25D366] text-white" : user.type === "telegram" ? "bg-[#229ED9] text-white" : "bg-gray-500 text-white"}`}
                >
                  {user.type || "web"}
                </p>
              </div>
              <div className="flex items-center text-xs text-muted-foreground mb-1">
                <Clock className="mr-1 h-3 w-3" />
                {formatTime(user.initialMessage.timestamp)}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{user.initialMessage.msg}</p>
            </div>
          </div>
          <Button size="sm" onClick={() => onAccept(user)} className="ml-auto">
            Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Example usage

