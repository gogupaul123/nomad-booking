import {
  Calendar03Icon,
  Clock01Icon,
  FavouriteIcon,
} from "@hugeicons/core-free-icons"

import { HorizontalStaysRow } from "@/features/stays/components/HorizontalStaysRow"
import { useStayActivity } from "@/features/stays/persistence"
import { Separator } from "@/components/ui/separator"

export function FavouritesPage() {
  const stayActivity = useStayActivity()
  const recentlyViewedStays = stayActivity.recentlyViewed.map(
    (entry) => entry.stay
  )
  const savedStays = stayActivity.saved.map((entry) => entry.stay)

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="flex h-full flex-col gap-4 overflow-hidden">
        <HorizontalStaysRow
          emptyState={{
            icon: Calendar03Icon,
            title: "No bookings yet",
            description:
              "Once you confirm a stay, your upcoming bookings will appear here for quick access.",
          }}
          icon={Calendar03Icon}
          stays={[]}
          title="Your bookings"
        />
        <Separator className="self-center data-horizontal:w-4/5" />
        <HorizontalStaysRow
          emptyState={{
            icon: Clock01Icon,
            title: "No recently viewed stays",
            description:
              "Open a few stay pages from the feed and they’ll appear here for quick access.",
          }}
          icon={Clock01Icon}
          stays={recentlyViewedStays}
          title="Recently viewed"
        />
        <Separator className="self-center data-horizontal:w-4/5" />
        <HorizontalStaysRow
          emptyState={{
            icon: FavouriteIcon,
            title: "No saved stays yet",
            description:
              "Tap the heart on any stay card and your shortlist will start building here.",
          }}
          icon={FavouriteIcon}
          stays={savedStays}
          title="Saved stays"
        />
      </div>
    </div>
  )
}
