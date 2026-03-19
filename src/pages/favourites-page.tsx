import {
  Calendar03Icon,
  Clock01Icon,
  FavouriteIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { HorizontalStaysRow } from "@/features/stays/components/HorizontalStaysRow"
import { LatestBookingCard } from "@/features/stays/components/LatestBookingCard"
import { useStayActivity } from "@/features/stays/persistence"
import { Separator } from "@/components/ui/separator"

export function FavouritesPage() {
  const stayActivity = useStayActivity()
  const latestBooking = stayActivity.bookings[0] ?? null
  const recentlyViewedStays = stayActivity.recentlyViewed.map(
    (entry) => entry.stay
  )
  const savedStays = stayActivity.saved.map((entry) => entry.stay)

  return (
    <div className="h-full min-h-0 w-full overflow-hidden">
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <section className="w-full shrink-0 space-y-4">
          <div className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={Calendar03Icon} size={18} strokeWidth={1.9} />
            <h2 className="text-lg font-semibold tracking-tight">
              Your bookings
            </h2>
          </div>

          {latestBooking ? (
            <LatestBookingCard entry={latestBooking} />
          ) : (
            <div className="flex min-h-[12rem] w-full items-center justify-center px-6 py-4">
              <div className="flex max-w-xl flex-col items-center gap-4 text-center">
                <HugeiconsIcon
                  className="text-muted-foreground/70"
                  icon={Calendar03Icon}
                  size={96}
                  strokeWidth={1.6}
                />
                <div className="space-y-2">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    No bookings yet
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                    Once you confirm a stay, your latest booking will appear
                    here for quick access.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
        <Separator className="shrink-0 self-center data-horizontal:w-4/5" />
        <HorizontalStaysRow
          className="min-h-0 flex-1"
          emptyState={{
            icon: Clock01Icon,
            title: "No recently viewed stays",
            description:
              "Open a few stay pages from the feed and they’ll appear here for quick access.",
          }}
          emptyStateClassName="min-h-0 flex-1 py-4"
          icon={Clock01Icon}
          stays={recentlyViewedStays}
          title="Recently viewed"
        />
        <Separator className="shrink-0 self-center data-horizontal:w-4/5" />
        <HorizontalStaysRow
          className="min-h-0 flex-1"
          emptyState={{
            icon: FavouriteIcon,
            title: "No saved stays yet",
            description:
              "Tap the heart on any stay card and your shortlist will start building here.",
          }}
          emptyStateClassName="min-h-0 flex-1 py-4"
          icon={FavouriteIcon}
          stays={savedStays}
          title="Saved stays"
        />
      </div>
    </div>
  )
}
