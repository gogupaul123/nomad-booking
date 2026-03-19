import { useEffect, useState } from "react"
import {
  ArrowLeft01Icon,
  Building06Icon,
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckCircle2 } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { bookingSchema, type Booking } from "@/features/stays/schemas"
import {
  formatCurrency,
  formatDateTime,
  formatStayDateRange,
} from "@/lib/formatters"

function SummaryRow({
  label,
  value,
  isTotal = false,
}: {
  label: string
  value: string
  isTotal?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={isTotal ? "font-medium" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={isTotal ? "text-xl font-semibold" : "tabular-nums"}>
        {value}
      </span>
    </div>
  )
}

function readConfirmationFromLocationState(value: unknown): Booking | null {
  const parsed = bookingSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function ConfirmationPage() {
  const location = useLocation()
  const [confirmation] = useState(() =>
    readConfirmationFromLocationState(location.state)
  )

  useEffect(() => {
    if (!confirmation || typeof window === "undefined") {
      return
    }

    const nextState =
      window.history.state && typeof window.history.state === "object"
        ? { ...window.history.state, usr: null }
        : window.history.state

    window.history.replaceState(
      nextState,
      "",
      `${window.location.pathname}${window.location.search}`
    )
  }, [confirmation])

  if (!confirmation) {
    return (
      <section className="flex min-h-[24rem] w-full items-center justify-center px-6 py-8">
        <div className="flex max-w-xl flex-col items-center gap-5 text-center">
          <HugeiconsIcon
            className="text-muted-foreground/70"
            icon={Clock01Icon}
            size={120}
            strokeWidth={1.6}
          />
          <div className="space-y-2">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              Confirmation expired
            </p>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              This page only keeps the last confirmation for the current visit.
              Your booking is still available in Favourites under Your
              bookings.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link className={buttonVariants()} to="/favourites">
              Open favourites
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} to="/feed">
              Return to home
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Link
          aria-label="Back to feed"
          className="inline-flex size-11 items-center justify-center text-foreground transition-colors hover:text-primary"
          to="/feed"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} strokeWidth={1.9} />
        </Link>

        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Booking confirmed
        </h1>
      </div>

      <Card className="py-0">
        <CardContent className="grid gap-0 p-0 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-stretch">
          <div className="space-y-6 p-6 xl:pr-8">
            <div className="text-base leading-snug font-medium">
              Purchase summary
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tight text-foreground">
                {confirmation.stayName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={16}
                    strokeWidth={1.9}
                  />
                  {confirmation.location.city}, {confirmation.location.country}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Building06Icon}
                    size={16}
                    strokeWidth={1.9}
                  />
                  Confirmed stay
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-sm font-medium">
                <HugeiconsIcon
                  className="text-primary"
                  icon={Calendar03Icon}
                  size={18}
                  strokeWidth={1.9}
                />
                <span className="text-xl font-semibold text-foreground">
                  {formatStayDateRange(
                    confirmation.checkIn,
                    confirmation.checkOut
                  )}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {confirmation.nights} night
                {confirmation.nights === 1 ? "" : "s"} for 1 person
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <SummaryRow
                label={`Stay subtotal (${confirmation.nights} night${confirmation.nights === 1 ? "" : "s"})`}
                value={formatCurrency(confirmation.nightlySubtotal)}
              />
              <SummaryRow
                label="Cleaning fee"
                value={formatCurrency(confirmation.cleaningFee)}
              />
              <SummaryRow
                label="Service fee"
                value={formatCurrency(confirmation.serviceFee)}
              />
              <SummaryRow
                isTotal
                label="Total charged"
                value={formatCurrency(confirmation.totalPrice)}
              />
            </div>
          </div>

          <div className="relative xl:self-stretch">
            <div className="absolute inset-y-0 left-0 hidden w-px bg-border xl:block" />
            <div className="flex h-full min-h-full flex-col justify-between px-6 py-6">
              <div className="space-y-5">
                <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <CheckCircle2 className="size-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Payment went through
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Your stay is confirmed and the booking has been saved to
                    Favourites.
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Confirmed at</p>
                    <p className="font-medium text-foreground">
                      {formatDateTime(confirmation.confirmedAt)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Booking ID</p>
                    <p className="font-medium text-foreground">
                      {confirmation.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-6">
                <Link className={buttonVariants({ className: "w-full" })} to="/favourites">
                  Open favourites
                </Link>
                <Link
                  className={buttonVariants({
                    className: "w-full",
                    variant: "outline",
                  })}
                  to={`/stays/${confirmation.stayId}`}
                >
                  Return to stay page
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
