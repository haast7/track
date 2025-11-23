import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Square,
  MessageSquare,
  Globe,
  GitBranch,
  Users,
  Webhook,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Square, label: 'Pixels', path: '/pixels' },
  { icon: MessageSquare, label: 'Canais', path: '/canais' },
  { icon: Globe, label: 'Domínios', path: '/dominios' },
  { icon: GitBranch, label: 'Funis', path: '/funis' },
  { icon: Users, label: 'Leads', path: '/leads' },
  { icon: Webhook, label: 'Postbacks', path: '/postbacks' },
]

interface AppSidebarProps {
  onNavigate?: () => void
}

export default function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate()
    }
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-xl font-bold text-foreground">Telegram Tracking</h1>
      </div>

      {/* Menu de navegação */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Botão de logout */}
      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  )
}

