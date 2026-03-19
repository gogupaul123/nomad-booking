import {
  Calendar03Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"

import { Card, CardContent } from "@/components/ui/card"
import type { PersistedBookingEntry } from "@/features/stays/schemas"
import {
  formatCurrency,
  formatDateTime,
  formatStayDateRange,
} from "@/lib/formatters"

type LatestBookingCardProps = {
  entry: PersistedBookingEntry
}

export function LatestBookingCard({ entry }: LatestBookingCardProps) {
  const { booking, stay } = entry

  return (
    <Card className="overflow-hidden py-0">
      <Link
        aria-label={`Open ${booking.stayName}`}
        className="block h-full"
        to={`/stays/${booking.stayId}`}
      >
        <CardContent className="grid h-full gap-0 p-0 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]">
          <div className="aspect-[16/9] overflow-hidden lg:aspect-auto lg:h-full">
            <img
              alt={stay.image.alt}
              className="h-full w-full object-cover"
              src={stay.image.src}
            />
          </div>

          <div className="flex h-full min-h-0 flex-col gap-5 p-5 md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  <CheckCircle2 className="size-4" />
                  Latest booking
                </div>

                <div className="space-y-2">
                  <h3 className="line-clamp-2 text-3xl font-black tracking-tight text-foreground">
                    {booking.stayName}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={Location01Icon}
                        size={16}
                        strokeWidth={1.9}
                      />
                      {booking.location.city}, {booking.location.country}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        size={16}
                        strokeWidth={1.9}
                      />
                      {formatStayDateRange(booking.checkIn, booking.checkOut)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 space-y-1 lg:min-w-36 lg:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Total paid
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {formatCurrency(booking.totalPrice)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-border/70 pt-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {booking.nights} night{booking.nights === 1 ? "" : "s"} for 1
                  person
                </p>
                <p className="text-sm text-muted-foreground">
                  Confirmed {formatDateTime(booking.confirmedAt)}
                </p>
              </div>

              <p className="text-sm font-medium text-primary">
                Open stay details
              </p>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
