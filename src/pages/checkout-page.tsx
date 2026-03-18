import { startTransition, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { postReservation } from "@/features/stays/api-client"
import {
  bookingDetailsQueryOptions,
  bookingKeys,
} from "@/features/stays/query-options"
import {
  reservationInputSchema,
  checkoutSearchParamsSchema,
} from "@/features/stays/schemas"
import { formatCurrency, formatSlotRange } from "@/lib/formatters"

export function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const parsedSearch = checkoutSearchParamsSchema.safeParse({
    bookingId: searchParams.get("bookingId") ?? undefined,
    slotId: searchParams.get("slotId") ?? undefined,
  })

  const bookingId = parsedSearch.success ? parsedSearch.data.bookingId : ""
  const bookingQuery = useQuery(bookingDetailsQueryOptions(bookingId))

  const reservationMutation = useMutation({
    mutationFn: postReservation,
    onSuccess: (reservation) => {
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(bookingId),
      })
      void queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      startTransition(() => {
        navigate("/confirmation", { state: reservation })
      })
    },
  })

  if (!parsedSearch.success) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Checkout link is incomplete</AlertTitle>
        <AlertDescription>
          Pick a booking and an availability window before opening checkout.
        </AlertDescription>
      </Alert>
    )
  }

  if (bookingQuery.isPending || !bookingQuery.data) {
    return <Card className="h-80 animate-pulse rounded-[28px]" />
  }

  const booking = bookingQuery.data
  const slot = booking.availabilitySlots.find(
    (candidate) => candidate.id === parsedSearch.data.slotId
  )

  if (!slot) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Selected slot no longer exists</AlertTitle>
        <AlertDescription>
          The booking window you selected is no longer available.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border border-white/70 bg-white/90 py-0 shadow-[0_24px_72px_-42px_rgba(16,42,72,0.38)] dark:border-white/10 dark:bg-white/5">
        <CardHeader>
          <CardTitle>Booking summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mocked payment, but real validation at the form boundary.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          <div className="aspect-[4/3] overflow-hidden rounded-[24px] border border-border/60">
            <img
              alt={booking.image.alt}
              className="h-full w-full object-cover"
              src={booking.image.src}
            />
          </div>
          <div>
            <p className="text-xl font-semibold">{booking.name}</p>
            <p className="text-sm text-muted-foreground">
              {booking.location.city}, {booking.location.country}
            </p>
          </div>
          <div className="rounded-[20px] border border-border/70 bg-muted/30 p-4 text-sm">
            <p className="font-medium">{slot.label}</p>
            <p className="mt-1 text-muted-foreground">
              {formatSlotRange(slot.checkIn, slot.checkOut)}
            </p>
            <p className="mt-3 text-lg font-semibold">
              {formatCurrency(slot.totalPrice)}
            </p>
          </div>
          <Link
            className={buttonVariants({ size: "sm", variant: "outline" })}
            to={`/bookings/${booking.id}`}
          >
            Back to booking details
          </Link>
        </CardContent>
      </Card>

      <Card className="border border-border/70 bg-background/85 py-0">
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)

              const parsedReservation = reservationInputSchema.safeParse({
                bookingId: booking.id,
                slotId: slot.id,
                guestName: formData.get("guestName"),
                email: formData.get("email"),
                specialRequests: formData.get("specialRequests"),
              })

              if (!parsedReservation.success) {
                setFormError(
                  parsedReservation.error.issues[0]?.message ??
                    "Invalid reservation request."
                )
                return
              }

              try {
                await reservationMutation.mutateAsync(parsedReservation.data)
              } catch (error) {
                setFormError(
                  error instanceof Error
                    ? error.message
                    : "Unable to confirm booking."
                )
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <Label htmlFor="guestName">Guest name</Label>
                <Input id="guestName" name="guestName" placeholder="Alex Rivers" />
              </label>
              <label className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="alex@example.com"
                  type="email"
                />
              </label>
            </div>

            <label className="space-y-2">
              <Label htmlFor="specialRequests">Special requests</Label>
              <Textarea
                id="specialRequests"
                name="specialRequests"
                placeholder="Optional: quiet floor, monitor rental, late check-in."
              />
            </label>

            <div className="rounded-[20px] border border-border/70 bg-muted/25 p-4 text-sm text-muted-foreground">
              Payment is mocked for the challenge. Submitting this form calls
              the backend reservation function and returns a confirmation state.
            </div>

            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>Reservation not confirmed</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <button
              className={buttonVariants({ size: "lg" })}
              disabled={reservationMutation.isPending || !slot.isAvailable}
              type="submit"
            >
              {reservationMutation.isPending
                ? "Confirming..."
                : "Confirm reservation"}
            </button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
