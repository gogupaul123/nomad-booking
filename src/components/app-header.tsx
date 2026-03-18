import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft01Icon,
  Building06Icon,
  FavouriteIcon,
  Search01Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"

import {
  useStayDetailsHeaderState,
} from "@/components/stay-details-header-context"
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

function StayHeaderButton({
  ariaLabel,
  children,
  className,
  onClick,
  type = "button",
}: {
  ariaLabel: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  type?: "button" | "submit" | "reset"
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/55 bg-white/92 text-foreground shadow-[0_18px_42px_-28px_rgba(15,23,42,0.5)] backdrop-blur-sm transition-colors hover:text-primary dark:border-white/10 dark:bg-slate-950/85",
        className
      )}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  )
}

function StayHeaderSaveButton({
  isSaved,
  onToggle,
  className,
}: {
  isSaved: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <StayHeaderButton
      ariaLabel={isSaved ? "Remove from favourites" : "Add to favourites"}
      className={className}
      onClick={onToggle}
    >
      <span className="relative inline-flex items-center justify-center">
        <svg
          aria-hidden="true"
          className={cn(
            "absolute size-7 scale-[0.92] transition-all duration-150",
            isSaved ? "text-primary opacity-100" : "text-primary opacity-0"
          )}
          viewBox="0 0 24 24"
        >
          <path
            d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"
            fill="currentColor"
          />
        </svg>
        <HugeiconsIcon
          className={cn(isSaved ? "text-primary" : "text-foreground")}
          icon={FavouriteIcon}
          size={26}
          strokeWidth={1.9}
        />
      </span>
    </StayHeaderButton>
  )
}

function StayDetailsHeader({ pathname }: { pathname: string }) {
  const navigate = useNavigate()
  const { header } = useStayDetailsHeaderState()

  const showStayHeader =
    /^\/stays\/[^/]+$/.test(pathname) && header !== null

  if (!showStayHeader || !header) {
    return null
  }

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate("/feed")
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 z-40 w-full border-b border-border/45 bg-background/80 backdrop-blur-2xl transition-[background-color,border-color,box-shadow,opacity] duration-200 supports-[backdrop-filter]:bg-background/60",
        header.isMobileViewport &&
          "border-b-transparent bg-transparent shadow-none backdrop-blur-none supports-[backdrop-filter]:bg-transparent"
      )}
      style={
        header.isMobileViewport
          ? undefined
          : {
              opacity: header.mergeProgress,
              pointerEvents: header.mergeProgress > 0 ? "auto" : "none",
            }
      }
    >
      {header.isMobileViewport ? (
        <div
          className="pointer-events-none absolute inset-0 border-b border-border/45 bg-background/95 backdrop-blur-2xl transition-opacity duration-200"
          style={{ opacity: header.mergeProgress }}
        />
      ) : null}

      <div className="w-full px-4 pt-4 pb-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[88rem]">
          <div className="relative flex items-center justify-between">
            <div className="relative flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3 pr-3 lg:max-w-[40%]">
                <button
                  aria-label="Back"
                  className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center p-0 text-foreground hover:text-primary"
                  onClick={handleBack}
                  type="button"
                >
                  {header.isMobileViewport ? (
                    <span className="relative inline-flex size-full items-center justify-center">
                      <span
                        className="absolute inset-0 flex items-center justify-center transition-opacity duration-220 ease-out"
                        style={{ opacity: 1 - header.mergeProgress }}
                      >
                        <span className="inline-flex items-center justify-center rounded-md bg-white/92 p-1.5 text-foreground shadow-[0_18px_42px_-28px_rgba(15,23,42,0.5)] backdrop-blur-sm dark:bg-slate-950/85">
                          <HugeiconsIcon
                            icon={ArrowLeft01Icon}
                            size={24}
                            strokeWidth={1.9}
                          />
                        </span>
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center text-foreground">
                        <HugeiconsIcon
                          icon={ArrowLeft01Icon}
                          size={28}
                          strokeWidth={1.9}
                        />
                      </span>
                    </span>
                  ) : (
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      size={32}
                      strokeWidth={1.9}
                    />
                  )}
                </button>

                <div
                  className="min-w-0 transition-[opacity,transform] duration-220 ease-out"
                  style={{
                    opacity: header.mergeProgress,
                    transform: header.isMobileViewport
                      ? `translateY(${(1 - header.mergeProgress) * 10}px) translateX(${(1 - header.mergeProgress) * 20}px)`
                      : `translateY(${(1 - header.mergeProgress) * 8}px)`,
                  }}
                >
                  <p className="truncate text-xl font-semibold text-foreground lg:text-2xl">
                    {header.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                    <HugeiconsIcon
                      className="shrink-0"
                      icon={Building06Icon}
                      size={18}
                      strokeWidth={1.9}
                    />
                    <span className="truncate text-sm font-medium lg:text-base">
                      {header.subtitle}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="flex shrink-0 items-center gap-2 pl-3 transition-[opacity,transform] duration-220 ease-out"
                style={
                  header.isMobileViewport
                    ? {
                        opacity: 0.45 + header.mergeProgress * 0.55,
                        transform: `translateY(${(1 - header.mergeProgress) * 8}px)`,
                      }
                    : undefined
                }
              >
                <StayHeaderButton
                  ariaLabel="Share stay"
                  onClick={header.onShare}
                >
                  <HugeiconsIcon
                    icon={Share01Icon}
                    size={22}
                    strokeWidth={1.9}
                  />
                </StayHeaderButton>
                <StayHeaderSaveButton
                  isSaved={header.isSaved}
                  onToggle={header.onToggleSave}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export function AppHeader() {
  const location = useLocation()
  const isFeedRoute = isNavItemActive(location.pathname, "/feed")
  const isStayRoute = /^\/stays\/[^/]+$/.test(location.pathname)
  const [isMobileNavHidden, setIsMobileNavHidden] = useState(false)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    lastScrollYRef.current = window.scrollY

    if (!isFeedRoute) {
      return
    }

    let ticking = false
    const resetFrame = window.requestAnimationFrame(() => {
      setIsMobileNavHidden(false)
    })

    const updateVisibility = () => {
      const currentScrollY = window.scrollY
      const scrollDelta = currentScrollY - lastScrollYRef.current

      if (window.innerWidth >= 768 || currentScrollY <= 24 || scrollDelta < -4) {
        setIsMobileNavHidden(false)
      } else if (scrollDelta > 8) {
        setIsMobileNavHidden(true)
      }

      lastScrollYRef.current = currentScrollY
      ticking = false
    }

    const handleScroll = () => {
      if (ticking) {
        return
      }

      ticking = true
      window.requestAnimationFrame(updateVisibility)
    }

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileNavHidden(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize)

    return () => {
      window.cancelAnimationFrame(resetFrame)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [isFeedRoute])

  if (isStayRoute) {
    return (
      <header className="h-0 shrink-0">
        <StayDetailsHeader pathname={location.pathname} />
      </header>
    )
  }

  return (
    <header
      className={cn(
        "shrink-0",
        isFeedRoute && "md:sticky md:top-0 md:z-40"
      )}
    >
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

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/96 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-300 ease-out supports-[backdrop-filter]:bg-background/88 md:hidden",
          isFeedRoute && isMobileNavHidden
            ? "pointer-events-none translate-y-[calc(100%+1rem)]"
            : "translate-y-0"
        )}
      >
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
