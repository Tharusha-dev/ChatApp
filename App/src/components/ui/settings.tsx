import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import { LogOut, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation";
import {deleteCookie} from 'cookies-next';


export default function SettingsDropdown() {
    const router = useRouter();
    return <DropdownMenu>
        <DropdownMenuTrigger>
            <Button>
              <Settings className="size-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => {
        deleteCookie('chatzu-userToken');
        router.push('/login');
      }}>
      
      <LogOut className="size-4" />
      Logout


      </DropdownMenuItem>
   
          
  
    
    </DropdownMenuContent>
  </DropdownMenu>
  
}