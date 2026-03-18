import { Outlet, ScrollRestoration } from "react-router-dom"

import { AppHeader } from "@/components/app-header"

export function AppShell() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="flex min-h-svh flex-col">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-[88rem] flex-1 px-4 pt-6 pb-24 sm:px-6 md:pb-12 lg:px-8">
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </div>
  )
}
