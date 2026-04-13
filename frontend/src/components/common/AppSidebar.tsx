'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, List } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: BarChart2 },
  { href: '/logs', label: 'Log List', icon: List },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <span className="text-lg font-bold">LogLens</span>
        <ThemeToggle />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <SidebarMenuItem key={href}>
                <Link href={href} className="w-full">
                  <SidebarMenuButton
                    isActive={isActive}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
