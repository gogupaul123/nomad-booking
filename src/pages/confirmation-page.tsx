import { Link, useLocation } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { bookingConfirmationSchema } from "@/features/stays/schemas"
import { formatCurrency, formatDateTime } from "@/lib/formatters"

export function ConfirmationPage() {
  const location = useLocation()
  const parsedConfirmation = bookingConfirmationSchema.safeParse(location.state)

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
          <Link className={buttonVariants()} to="/">
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
        <CardTitle className="text-3xl">Your stay is reserved.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pb-4">
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
              Booking
            </p>
            <p className="mt-2 text-lg font-semibold">{confirmation.slotLabel}</p>
            <p className="text-sm text-muted-foreground">
              Confirmed {formatDateTime(confirmation.confirmedAt)}
            </p>
          </div>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground">
          <p>Guest: {confirmation.guestName}</p>
          <p>Email: {confirmation.email}</p>
          <p>Total charged (mocked): {formatCurrency(confirmation.totalPrice)}</p>
        </div>
        <div className="rounded-[20px] border border-border/70 bg-background/85 p-4 text-sm text-muted-foreground">
          Tradeoff note: this challenge foundation intentionally stops at a
          confirmation screen instead of adding a persistent “my bookings”
          account area.
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className={buttonVariants()} to="/">
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
