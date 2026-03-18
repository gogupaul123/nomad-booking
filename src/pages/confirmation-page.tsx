import { Link, useLocation } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { bookingSchema } from "@/features/stays/schemas"
import {
  formatCurrency,
  formatDateTime,
  formatStayDate,
  formatStayDateRange,
} from "@/lib/formatters"

export function ConfirmationPage() {
  const location = useLocation()
  const parsedConfirmation = bookingSchema.safeParse(location.state)

  if (!parsedConfirmation.success) {
    return (
      <Card className="border border-border/70 bg-background/85 py-0">
        <CardHeader>
          <CardTitle>No confirmation in memory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          <p className="text-sm text-muted-foreground">
            This mock flow keeps the confirmation in navigation state instead of
            a persistent bookings table.
          </p>
          <Link className={buttonVariants()} to="/feed">
            Return to home
          </Link>
        </CardContent>
      </Card>
    )
  }

  const confirmation = parsedConfirmation.data

  return (
    <Card className="border border-white/70 bg-white/90 py-0 shadow-[0_24px_72px_-42px_rgba(16,42,72,0.38)] dark:border-white/10 dark:bg-white/5">
      <CardHeader>
        <p className="text-[0.74rem] font-black uppercase tracking-[0.42em] text-primary">
          Booking confirmed
        </p>
        <CardTitle className="text-3xl">Your stay is confirmed.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pb-5">
        <div className="grid gap-4 rounded-[24px] border border-border/70 bg-muted/25 p-5 sm:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
              Stay
            </p>
            <p className="mt-2 text-lg font-semibold">{confirmation.stayName}</p>
            <p className="text-sm text-muted-foreground">
              {confirmation.location.city}, {confirmation.location.country}
            </p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
              Reservation
            </p>
            <p className="mt-2 text-lg font-semibold">
              {formatStayDateRange(confirmation.checkIn, confirmation.checkOut)}
            </p>
            <p className="text-sm text-muted-foreground">
              Confirmed {formatDateTime(confirmation.confirmedAt)}
            </p>
          </div>
        </div>

        <div className="grid gap-5 rounded-[24px] border border-border/70 bg-background/75 p-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
              Dates
            </p>
            <p className="font-medium text-foreground">
              {formatStayDate(confirmation.checkIn, "MMM d, yyyy")}
            </p>
            <p className="font-medium text-foreground">
              {formatStayDate(confirmation.checkOut, "MMM d, yyyy")}
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
              Stay length
            </p>
            <p className="font-medium text-foreground">
              {confirmation.nights} night{confirmation.nights === 1 ? "" : "s"}
            </p>
            <p className="text-sm text-muted-foreground">Reserved for 1 person</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-border/70 bg-muted/25 p-5">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Stay subtotal</span>
              <span className="font-medium text-foreground">
                {formatCurrency(confirmation.nightlySubtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Cleaning fee</span>
              <span className="font-medium text-foreground">
                {formatCurrency(confirmation.cleaningFee)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Service fee</span>
              <span className="font-medium text-foreground">
                {formatCurrency(confirmation.serviceFee)}
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-foreground">Total charged (mocked)</span>
            <span className="text-lg font-semibold text-foreground">
              {formatCurrency(confirmation.totalPrice)}
            </span>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <p>Guest: {confirmation.guestName}</p>
          <p>Email: {confirmation.email}</p>
        </div>

        <div className="rounded-[20px] border border-border/70 bg-background/85 p-4 text-sm text-muted-foreground">
          Tradeoff note: this challenge foundation intentionally stops at a
          confirmation screen instead of adding a persistent “my bookings”
          account area.
        </div>

        <div className="flex flex-wrap gap-3">
          <Link className={buttonVariants()} to="/feed">
            Browse more stays
          </Link>
          <Link
            className={buttonVariants({ variant: "outline" })}
            to={`/stays/${confirmation.stayId}`}
          >
            Return to stay page
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
