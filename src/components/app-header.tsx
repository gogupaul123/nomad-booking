import { FavouriteIcon, Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { NavLink, useLocation } from "react-router-dom"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { cn } from "@/lib/utils"

type AppNavItem = {
  href: string
  label: string
  matchPrefix: string
  icon: typeof Search01Icon
}

const appNavItems: AppNavItem[] = [
  {
    href: "/feed",
    label: "Feed",
    matchPrefix: "/feed",
    icon: Search01Icon,
  },
  {
    href: "/favourites",
    label: "Favourites",
    matchPrefix: "/favourites",
    icon: FavouriteIcon,
  },
]

function isNavItemActive(pathname: string, matchPrefix: string) {
  return pathname === matchPrefix || pathname.startsWith(`${matchPrefix}/`)
}

export function AppHeader() {
  const location = useLocation()

  return (
    <header className="shrink-0">
      <nav className="hidden border-b border-border/70 bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:block">
        <div className="mx-auto w-full max-w-[88rem] px-4 py-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between gap-6">
            <NavLink
              aria-label="Go to feed"
              className="inline-flex items-center gap-3"
              to="/feed"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_14px_30px_-22px_color-mix(in_oklch,var(--color-primary)_70%,transparent)]">
                NB
              </span>
              <span className="grid gap-0.5">
                <span className="text-sm font-black tracking-[0.28em] text-primary uppercase">
                  Nomad Booking
                </span>
                <span className="text-xs text-muted-foreground">
                  Remote-ready stays
                </span>
              </span>
            </NavLink>

            <div className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center">
              <ul className="pointer-events-auto flex items-center gap-2">
                {appNavItems.map((item) => {
                  const active = isNavItemActive(location.pathname, item.matchPrefix)

                  return (
                    <li key={item.href}>
                      <NavLink
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-150",
                          active
                            ? "bg-primary/10 text-primary"
                            : "bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                        to={item.href}
                      >
                        <HugeiconsIcon
                          icon={item.icon}
                          size={18}
                          strokeWidth={1.9}
                        />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="flex items-center justify-end">
              <AnimatedThemeToggler />
            </div>
          </div>
        </div>
      </nav>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/96 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/88 md:hidden">
        <ul className="grid grid-cols-2">
          {appNavItems.map((item) => {
            const active = isNavItemActive(location.pathname, item.matchPrefix)

            return (
              <li key={item.href}>
                <NavLink
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-[11px] font-semibold transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                  to={item.href}
                >
                  <HugeiconsIcon icon={item.icon} size={22} strokeWidth={1.9} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>
    </header>
  )
}
