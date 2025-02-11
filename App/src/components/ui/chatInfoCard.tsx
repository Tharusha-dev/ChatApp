import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Globe, Mail, MapPin, Monitor, User, Shield } from 'lucide-react'

interface InfoDisplayProps {
  webName: string
  webEmail: string
  isDisconnected?: boolean
  metadata: {
    ip: string
    userAgent: string
    userCountry: string
    currentUrl: string
  }
  websiteDomain: string
  onClick: () => void
  key: string
  type: string
  isActive?: boolean
  userEmail: string
}

export default function ChatInfoCard({
  key,
  webName,
  webEmail,
  userEmail,
  metadata,
  isDisconnected = false,
  websiteDomain,
  onClick,
  type,
  isActive = false
}: InfoDisplayProps) {
  console.log("type:", type);
  return (
    <Card className={`w-[400px] mx-auto mb-[0.5rem] relative ${isActive ? "border-primary" : ""}`} onClick={onClick} key={key}>

      
   
      <div className="absolute top-0 right-0 w-4 h-4  rounded-full flex items-center justify-center" style={{backgroundColor: isDisconnected ? "red" : "green"}} />
      <CardContent className="grid grid-cols-2 p-2 text-sm">
        <div className="">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{webName}</span>
          </div>
          <div className="flex items-center gap-2 break-all">
            {userEmail ?<User className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> :   <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
            <span>{webEmail}</span>
          </div>
        </div>
        <div className="">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>{metadata.ip}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{metadata.userCountry}</span>
          </div>
        </div>
        <div className="col-span-2">
          <Separator className="my-2" />
        </div>
        <div className="col-span-2 space-y-2">
          <div className="flex items-center gap-2 break-all">
            <Monitor className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-xs">{metadata.userAgent}</span>
          </div>
        </div>
        <div className="col-span-2">
          <Separator className="my-2" />
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span>{websiteDomain}</span>
          </div>
          <div className="flex items-center gap-2 break-all">
            <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-xs">{metadata.currentUrl}</span>
          </div>
          <div className={`flex items-center gap-2 break-all ${
            type === "whatsapp" 
              ? "bg-[#25D366]" 
              : type === "telegram" 
                ? "bg-[#229ED9]" 
                : "bg-gray-500"
          } text-white px-2 py-1 rounded-md`}>
            <span className="text-xs">{type || "web"}</span>
          </div>

          {userEmail && 
          
          <div className="flex items-center gap-2 break-all">
          <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-xs">{userEmail}</span>
        </div>
          
          }

         
        </div>
      </CardContent>
    </Card>
  )
}

