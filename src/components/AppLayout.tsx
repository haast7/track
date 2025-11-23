import { useState } from 'react'
import AppSidebar from './AppSidebar'
import DashboardHeader from './DashboardHeader'
import { Menu, X } from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  title: string
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden md:block">
        <AppSidebar />
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-card">
            <AppSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
            <h1 className="ml-4 text-lg font-semibold text-foreground">
              {title}
            </h1>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <User className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <DashboardHeader title={title} />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

