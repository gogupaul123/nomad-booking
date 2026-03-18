import { Link, Outlet, ScrollRestoration } from "react-router-dom"

export function AppShell() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(49,115,184,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(247,190,96,0.18),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(245,248,251,1))] text-foreground dark:bg-[radial-gradient(circle_at_top_left,_rgba(49,115,184,0.24),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(247,190,96,0.15),_transparent_24%),linear-gradient(180deg,_rgba(18,24,33,1),_rgba(12,18,25,1))]">
      <div className="mx-auto flex min-h-svh max-w-6xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_18px_60px_-32px_rgba(24,46,86,0.35)] backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Link
                className="text-[0.7rem] font-black uppercase tracking-[0.4em] text-primary"
                to="/"
              >
                Nomad Booking
              </Link>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Work-friendly stays for remote teams, solo travelers, and
                founders who want fast Wi-Fi, calm design, and a checkout flow
                that feels trustworthy.
              </p>
            </div>
            <div className="rounded-full border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
              Theme toggle: press <kbd className="font-semibold">D</kbd>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </div>
  )
}
