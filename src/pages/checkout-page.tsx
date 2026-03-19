import { startTransition, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft01Icon,
  Building06Icon,
  Calendar03Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { PaymentCard } from "@/components/billingsdk/payment-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getStayBookingQuote } from "@/features/stays/booking"
import { postBooking } from "@/features/stays/api-client"
import { recordConfirmedBooking } from "@/features/stays/persistence"
import {
  stayDetailsQueryOptions,
  stayKeys,
} from "@/features/stays/query-options"
import { bookingInputSchema, checkoutSearchParamsSchema } from "@/features/stays/schemas"
import { formatCurrency, formatStayDateRange } from "@/lib/formatters"

const MOCK_CHECKOUT_GUEST = {
  email: "guest@nomad-booking.demo",
  guestName: "Nomad Booking Guest",
}

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

export function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)

  const parsedSearch = checkoutSearchParamsSchema.safeParse({
    stayId: searchParams.get("stayId") ?? undefined,
    checkIn: searchParams.get("checkIn") ?? undefined,
    checkOut: searchParams.get("checkOut") ?? undefined,
  })

  const stayId = parsedSearch.success ? parsedSearch.data.stayId : ""
  const stayQuery = useQuery(stayDetailsQueryOptions(stayId))

  const bookingMutation = useMutation({
    mutationFn: postBooking,
    onSuccess: (booking) => {
      if (stayQuery.data) {
        recordConfirmedBooking(booking, stayQuery.data)
      }

      toast.success("Booking confirmed", {
        description: `${booking.stayName} is reserved from ${formatStayDateRange(
          booking.checkIn,
          booking.checkOut
        )}.`,
      })

      void queryClient.invalidateQueries({
        queryKey: stayKeys.detail(stayId),
      })
      void queryClient.invalidateQueries({ queryKey: stayKeys.lists() })
      startTransition(() => {
        navigate("/confirmation", { state: booking })
      })
    },
  })

  const quote = useMemo(() => {
    if (!parsedSearch.success || !stayQuery.data) {
      return null
    }

    return getStayBookingQuote(
      stayQuery.data.availabilityCalendar,
      stayQuery.data.bookingPolicy,
      parsedSearch.data.checkIn,
      parsedSearch.data.checkOut
    )
  }, [parsedSearch, stayQuery.data])

  const bookingDraft = useMemo(() => {
    if (!quote || !stayQuery.data) {
      return null
    }

    return bookingInputSchema.parse({
      stayId: stayQuery.data.id,
      checkIn: quote.checkIn,
      checkOut: quote.checkOut,
      guestName: MOCK_CHECKOUT_GUEST.guestName,
      email: MOCK_CHECKOUT_GUEST.email,
      specialRequests: undefined,
    })
  }, [quote, stayQuery.data])

  if (!parsedSearch.success) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Checkout link is incomplete</AlertTitle>
        <AlertDescription>
          Pick a stay and date range before opening checkout.
        </AlertDescription>
      </Alert>
    )
  }

  if (stayQuery.isPending || !stayQuery.data) {
    return <Card className="h-80 animate-pulse rounded-[28px]" />
  }

  if (!quote) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Selected dates are no longer available</AlertTitle>
        <AlertDescription>
          Go back to the stay page and pick a different date range before
          continuing.
        </AlertDescription>
      </Alert>
    )
  }

  const stay = stayQuery.data

  return (
    <section className="w-full space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Link
          aria-label="Back to stay details"
          className="inline-flex size-11 items-center justify-center text-foreground transition-colors hover:text-primary"
          to={`/stays/${stay.id}`}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} strokeWidth={1.9} />
        </Link>

        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Confirm &amp; pay
        </h1>
      </div>

      <Card className="py-0">
        <CardContent className="grid gap-0 p-0 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-stretch">
          <div className="space-y-6 p-6 xl:pr-8">
            <div className="text-base leading-snug font-medium">
              Order Summary
            </div>

            <div className="grid gap-5 md:grid-cols-[12.5rem_minmax(0,1fr)] md:items-start">
              <div className="aspect-[4/3] overflow-hidden rounded-xl">
                <img
                  alt={stay.image.alt}
                  className="h-full w-full object-cover"
                  src={stay.image.src}
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                  {stay.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={Location01Icon}
                      size={16}
                      strokeWidth={1.9}
                    />
                    {stay.location.city}, {stay.location.country}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={Building06Icon}
                      size={16}
                      strokeWidth={1.9}
                    />
                    {stay.hostType}
                  </span>
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {stay.description}
                </p>
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
                  {formatStayDateRange(quote.checkIn, quote.checkOut)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {quote.nights} night{quote.nights === 1 ? "" : "s"} for 1
                person
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <SummaryRow
                label={`Stay subtotal (${quote.nights} night${quote.nights === 1 ? "" : "s"})`}
                value={formatCurrency(quote.nightlySubtotal)}
              />
              <SummaryRow
                label="Cleaning fee"
                value={formatCurrency(quote.cleaningFee)}
              />
              <SummaryRow
                label="Service fee"
                value={formatCurrency(quote.serviceFee)}
              />
              <SummaryRow
                isTotal
                label="Total"
                value={formatCurrency(quote.totalPrice)}
              />
            </div>
          </div>

          <div className="relative xl:self-stretch">
            <div className="absolute inset-y-0 left-0 hidden w-px bg-border xl:block" />
            <div className="flex h-full min-h-full flex-col px-6 py-6">
              <PaymentCard
                className="max-w-none flex-1"
                description="Enter card details to continue."
                embedded
                footerNote="This is a mockup pay."
                onPay={async () => {
                  if (!bookingDraft) {
                    setFormError("Unable to prepare the booking right now.")
                    return
                  }

                  setFormError(null)

                  try {
                    await bookingMutation.mutateAsync(bookingDraft)
                  } catch (error) {
                    setFormError(
                      error instanceof Error
                        ? error.message
                        : "Unable to confirm booking."
                    )
                  }
                }}
                price={String(quote.totalPrice)}
                title="Payment details"
              />

              {formError ? (
                <Alert className="mt-4" variant="destructive">
                  <AlertTitle>Booking not confirmed</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
