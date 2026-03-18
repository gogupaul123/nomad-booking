import { useQuery } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router-dom"

import { StayCard } from "@/features/stays/components/stay-card"
import {
  createStaySearchString,
  parseStaySearchParams,
} from "@/features/stays/api-client"
import { stayListQueryOptions } from "@/features/stays/query-options"
import { buttonVariants } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { StaySearchParams } from "@/features/stays/schemas"

const sortOptions: Array<{
  label: string
  value: StaySearchParams["sort"]
}> = [
  { label: "Recommended", value: "recommended" },
  { label: "Price", value: "price-low" },
  { label: "Rating", value: "rating" },
]

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseStaySearchParams(searchParams)
  const staysQuery = useQuery(stayListQueryOptions(filters))

  const availableCities = staysQuery.data?.availableCities ?? []

  function buildFilterHref(nextFilters: Partial<StaySearchParams>) {
    return `/${createStaySearchString({
      ...filters,
      ...nextFilters,
    })}`
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-6 rounded-[32px] border border-white/70 bg-white/85 px-6 py-8 shadow-[0_30px_90px_-44px_rgba(16,42,72,0.45)] backdrop-blur dark:border-white/10 dark:bg-white/5 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.44em] text-primary">
              Booking.com-style challenge
            </p>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-balance sm:text-5xl">
              Book focused stays with hotel polish and remote-work amenities.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Nomad Booking turns the brief into a digital-nomad stay product:
              browse curated properties, inspect reviews and availability, and
              complete a mocked checkout without losing product clarity.
            </p>
          </div>
          <form
            className="grid gap-3 rounded-[24px] border border-border/70 bg-background/80 p-4 sm:grid-cols-[1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              const nextQuery = formData.get("query")

              setSearchParams(
                {
                  ...(filters.city ? { city: filters.city } : {}),
                  ...(filters.sort !== "recommended"
                    ? { sort: filters.sort }
                    : {}),
                  ...(typeof nextQuery === "string" && nextQuery.trim().length > 0
                    ? { query: nextQuery.trim() }
                    : {}),
                },
                { replace: false }
              )
            }}
          >
            <label className="space-y-2">
              <span className="text-sm font-medium">Search stays</span>
              <Input
                defaultValue={filters.query ?? ""}
                name="query"
                placeholder="Search by city, vibe, or workspace perk"
              />
            </label>
            <button
              className={cn(buttonVariants({ size: "lg" }), "self-end")}
              type="submit"
            >
              Search
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <Link
                className={buttonVariants({
                  size: "sm",
                  variant:
                    filters.sort === option.value ? "default" : "outline",
                })}
                key={option.value}
                to={buildFilterHref({ sort: option.value })}
              >
                Sort: {option.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid gap-4 rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(49,115,184,0.08),rgba(255,255,255,0.72))] p-5 dark:bg-[linear-gradient(180deg,rgba(49,115,184,0.2),rgba(255,255,255,0.05))]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Explore by city
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className={buttonVariants({
                  size: "sm",
                  variant: filters.city ? "outline" : "secondary",
                })}
                to={buildFilterHref({ city: undefined })}
              >
                All cities
              </Link>
              {availableCities.map((city) => (
                <Link
                  className={buttonVariants({
                    size: "sm",
                    variant: filters.city === city ? "secondary" : "outline",
                  })}
                  key={city}
                  to={buildFilterHref({ city })}
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-border/70 bg-background/85 p-4">
            <p className="text-sm font-semibold">Challenge-fit choices</p>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <li>Small mock backend with Vercel Functions.</li>
              <li>React Query handles loading, error, and refetch states.</li>
              <li>No fake “my bookings” persistence beyond booking confirmation.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Browse stays
            </p>
            <h2 className="text-2xl font-bold tracking-tight">
              {filters.city ? `${filters.city} stays` : "Book-ready properties"}
            </h2>
          </div>
          {staysQuery.data ? (
            <p className="text-sm text-muted-foreground">
              {staysQuery.data.total} result
              {staysQuery.data.total === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        {staysQuery.isPending ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton className="h-[24rem] rounded-[28px]" key={index} />
            ))}
          </div>
        ) : null}

        {staysQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load stays</AlertTitle>
            <AlertDescription>
              Start the app with `bun run dev` so the frontend and local API run
              together, or run `bun run dev:web` and `bun run dev:api` in
              separate terminals.
            </AlertDescription>
          </Alert>
        ) : null}

        {staysQuery.data && staysQuery.data.stays.length === 0 ? (
          <Alert>
            <AlertTitle>No stays matched this search.</AlertTitle>
            <AlertDescription>
              Try a different city or a broader term like “quiet” or “monitor”.
            </AlertDescription>
          </Alert>
        ) : null}

        {staysQuery.data && staysQuery.data.stays.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {staysQuery.data.stays.map((stay) => (
              <StayCard key={stay.id} stay={stay} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
