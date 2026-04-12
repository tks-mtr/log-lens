'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const activeTheme = mounted ? theme : undefined

  return (
    <div className="flex w-fit items-center rounded-md border overflow-hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme('light')}
        aria-label="Light mode"
        className={cn(
          'h-7 px-2 gap-1 text-xs transition-colors',
          activeTheme === 'light'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Sun className="h-3.5 w-3.5" />
        Light
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme('dark')}
        aria-label="Dark mode"
        className={cn(
          'h-7 px-2 gap-1 text-xs transition-colors',
          activeTheme === 'dark'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Moon className="h-3.5 w-3.5" />
        Dark
      </Button>
    </div>
  )
}
