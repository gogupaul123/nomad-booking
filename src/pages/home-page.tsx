import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"

import { BookingCard } from "@/features/stays/components/BookingCard"
import { parseBookingSearchParams } from "@/features/stays/api-client"
import { bookingCardsQueryOptions } from "@/features/stays/query-options"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function HomePage() {
  const [searchParams] = useSearchParams()
  const filters = parseBookingSearchParams(searchParams)
  const bookingsQuery = useQuery(bookingCardsQueryOptions(filters))

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.72rem] font-black tracking-[0.42em] text-primary uppercase">
              Feed
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Explore bookable stays
            </h1>
          </div>
          {bookingsQuery.data ? (
            <p className="text-sm text-muted-foreground">
              {bookingsQuery.data.total} result
              {bookingsQuery.data.total === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        {bookingsQuery.isPending ? (
          <div className="grid justify-items-center gap-4 md:grid-cols-2 md:justify-items-start xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <BookingCard isLoading key={index} />
            ))}
          </div>
        ) : null}

        {bookingsQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load bookings</AlertTitle>
            <AlertDescription>
              Start the app with `bun run dev` so the frontend and local API run
              together, or run `bun run dev:web` and `bun run dev:api` in
              separate terminals.
            </AlertDescription>
          </Alert>
        ) : null}

        {bookingsQuery.data && bookingsQuery.data.bookings.length === 0 ? (
          <Alert>
            <AlertTitle>No bookings matched this search.</AlertTitle>
            <AlertDescription>
              Try a different city or a broader term like “quiet” or “monitor”.
            </AlertDescription>
          </Alert>
        ) : null}

        {bookingsQuery.data && bookingsQuery.data.bookings.length > 0 ? (
          <div className="grid justify-items-center gap-4 md:grid-cols-2 md:justify-items-start xl:grid-cols-3">
            {bookingsQuery.data.bookings.map((booking) => (
              <BookingCard booking={booking} key={booking.id} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
