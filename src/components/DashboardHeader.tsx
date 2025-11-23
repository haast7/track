import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User } from 'lucide-react'

interface DashboardHeaderProps {
  title: string
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const { user } = useAuth()
  const userInitials = user?.email
    ?.split('@')[0]
    .substring(0, 2)
    .toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <h1 className="text-xl md:text-2xl font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <Avatar className="h-8 w-8 md:h-10 md:w-10">
            <AvatarFallback>
              <User className="h-3 w-3 md:h-4 md:w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {user?.email?.split('@')[0]}
            </span>
            <span className="text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

