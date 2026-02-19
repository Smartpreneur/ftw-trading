'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BookOpen, LayoutDashboard, TrendingUp, Menu } from 'lucide-react'
import Image from 'next/image'
import { ProfileFilter } from '@/components/profile-filter'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trades', label: 'Trades', icon: BookOpen },
  { href: '/setups', label: 'Trade-Setups', icon: TrendingUp },
]

export function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
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
                href={href}
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

          {/* Desktop Profile Filter */}
          <div className="hidden md:block">
            <Suspense fallback={<div className="h-9 w-24 bg-muted animate-pulse rounded-md" />}>
              <ProfileFilter />
            </Suspense>
          </div>

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
                      href={href}
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

                {/* Trader Filter */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3 px-3">Trader Filter</p>
                  <Suspense fallback={<div className="h-9 w-full bg-muted animate-pulse rounded-md" />}>
                    <ProfileFilter />
                  </Suspense>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
