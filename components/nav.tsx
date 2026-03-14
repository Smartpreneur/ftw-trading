'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BookOpen, LayoutDashboard, TrendingUp, Menu } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const allLinks = [
  { href: '/performance', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trades', label: 'Trades', icon: BookOpen },
  { href: '/setups', label: 'Trade-Setups', icon: TrendingUp, adminOnly: true },
]

export function Nav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const links = allLinks.filter((l) => !l.adminOnly || isAdmin)

  // Preserve embed token and performance tab across navigation
  const token = searchParams.get('token')
  function buildHref(href: string) {
    let url = href
    // Restore saved performance tab from localStorage
    if (href === '/performance' && typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('ftw-perf-tab')
      if (savedTab) {
        url = `/performance?tab=${savedTab}`
      }
    }
    return token ? `${url}${url.includes('?') ? '&' : '?'}token=${token}` : url
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-2 sm:gap-4">
          {/* Logo */}
          <Link href={buildHref('/performance')} className="flex items-center shrink-0">
            <Image
              src="/fmw-logo.svg"
              alt="FMW Logo"
              width={160}
              height={38}
              priority
              className="h-8 w-auto"
            />
          </Link>

          {/* Icon-only Nav (always visible, space permitting) */}
          <nav className="flex items-center gap-1 flex-1">
            {links.map(({ href, icon: Icon }) => (
              <Link
                key={href}
                href={buildHref(href)}
                className={cn(
                  'flex items-center justify-center rounded-md p-2 transition-colors',
                  pathname === href
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{links.find(l => l.href === href)?.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menü öffnen</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menü</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 mt-6">
                {/* Navigation Links */}
                <nav className="flex flex-col gap-2">
                  {links.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={buildHref(href)}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium transition-colors',
                        pathname === href
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
