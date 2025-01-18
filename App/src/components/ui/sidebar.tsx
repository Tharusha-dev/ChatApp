import { MessageSquare, Users, Globe, Phone, Braces } from 'lucide-react'
import { cn } from '@/lib/utils'

type SidebarProps = {
  activeTab: string
  setActiveTab: (tab: string) => void
  socket: any
}

export default function Sidebar({ activeTab, setActiveTab, socket }: SidebarProps) {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'workers', label: 'Users', icon: Users },
    { id: 'websites', label: 'Websites', icon: Globe },
    // { id: 'whatsapp', label: 'Whatsapp', icon: Globe },
  ]

  return (
    <aside className="w-64 bg-white shadow-md">
      <nav className="flex flex-col p-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-md text-left transition-colors',
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}

        {socket && <button
            key="whatsapp"
            onClick={() => setActiveTab('whatsapp')}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-md text-left transition-colors',
              activeTab === 'whatsapp'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Phone className="w-5 h-5" />
            <span>Whatsapp</span>
          </button>}
          <button
            key="metadata"
            onClick={() => setActiveTab('metadata')}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-md text-left transition-colors',
              activeTab === 'metadata'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Braces className="w-5 h-5" />
            <span>Website Metadata</span>
          </button>
      </nav>
    </aside>
  )
}

