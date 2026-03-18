import { Outlet, ScrollRestoration, useLocation } from "react-router-dom"

import { AppHeader } from "@/components/app-header"
import { StayDetailsHeaderProvider } from "@/components/stay-details-header"
import { cn } from "@/lib/utils"

export function AppShell() {
  const location = useLocation()
  const isFavouritesRoute =
    location.pathname === "/favourites" ||
    location.pathname.startsWith("/favourites/")

  return (
    <div className="min-h-svh bg-background text-foreground">
      <StayDetailsHeaderProvider>
        <div className="flex min-h-svh flex-col">
          <AppHeader />
          <main
            className={cn(
              "mx-auto w-full max-w-[88rem] min-h-0 flex-1 px-4 pt-6 pb-24 sm:px-6 md:pb-12 lg:px-8",
              isFavouritesRoute && "overflow-hidden"
            )}
          >
            <Outlet />
          </main>
        </div>
      </StayDetailsHeaderProvider>
      <ScrollRestoration />
    </div>
  )
}
