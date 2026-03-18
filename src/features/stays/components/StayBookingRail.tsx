import { useMemo, useState } from "react"
import { type DateRange } from "react-day-picker"
import {
  Cancel01Icon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "react-router-dom"

import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  getFirstBookableRange,
  getStayBookingQuote,
  getStayStartingPrice,
  isCheckInDateSelectable,
  isCheckoutDateSelectable,
  toCalendarDateString,
} from "@/features/stays/booking"
import type { StayDetails } from "@/features/stays/schemas"
import {
  formatCurrency,
  formatStayDate,
  formatStayDateRange,
} from "@/lib/formatters"
import { cn } from "@/lib/utils"

type SelectedStayDates = {
  checkIn: string
  checkOut: string
}

type ActiveDateField = "checkIn" | "checkOut"

function toDateRange(value: SelectedStayDates | null): DateRange | undefined {
  if (!value) {
    return undefined
  }

  return {
    from: new Date(`${value.checkIn}T00:00:00`),
    to: new Date(`${value.checkOut}T00:00:00`),
  }
}

function formatDateInputValue(value?: string) {
  return value ? formatStayDate(value, "MMM d, yyyy") : "Add date"
}

function DateRangeTriggerRow({
  activeField,
  checkInValue,
  checkOutValue,
  className,
  onOpenField,
}: {
  activeField?: ActiveDateField
  checkInValue?: string
  checkOutValue?: string
  className?: string
  onOpenField: (field: ActiveDateField) => void
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.45rem] border border-border/75 bg-background",
        className
      )}
    >
      <div className="grid grid-cols-2 divide-x divide-border/70">
        <button
          className={cn(
            "flex min-h-[5.15rem] cursor-pointer flex-col items-start justify-center px-4 py-3 text-left transition-colors hover:bg-muted/35",
            activeField === "checkIn" && "bg-muted/35"
          )}
          onClick={() => {
            onOpenField("checkIn")
          }}
          type="button"
        >
          <span className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-foreground">
            Check-in
          </span>
          <span className="mt-1 text-sm font-medium text-foreground">
            {formatDateInputValue(checkInValue)}
          </span>
        </button>

        <button
          className={cn(
            "flex min-h-[5.15rem] cursor-pointer flex-col items-start justify-center px-4 py-3 text-left transition-colors hover:bg-muted/35",
            activeField === "checkOut" && "bg-muted/35"
          )}
          onClick={() => {
            onOpenField("checkOut")
          }}
          type="button"
        >
          <span className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-foreground">
            Check-out
          </span>
          <span className="mt-1 text-sm font-medium text-foreground">
            {formatDateInputValue(checkOutValue)}
          </span>
        </button>
      </div>
    </div>
  )
}

export function StayBookingRail({
  stay,
  isMobileViewport,
}: {
  stay: StayDetails
  isMobileViewport: boolean
}) {
  const initialSelection = useMemo(
    () => getFirstBookableRange(stay.availabilityCalendar, stay.bookingPolicy),
    [stay.availabilityCalendar, stay.bookingPolicy]
  )
  const [selectedDates, setSelectedDates] = useState<SelectedStayDates | null>(
    initialSelection
  )
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(
    toDateRange(initialSelection)
  )
  const [isCalendarPopoverOpen, setIsCalendarPopoverOpen] = useState(false)
  const [activeDateField, setActiveDateField] =
    useState<ActiveDateField>("checkIn")

  const selectedQuote = useMemo(() => {
    if (!selectedDates) {
      return null
    }

    return getStayBookingQuote(
      stay.availabilityCalendar,
      stay.bookingPolicy,
      selectedDates.checkIn,
      selectedDates.checkOut
    )
  }, [selectedDates, stay.availabilityCalendar, stay.bookingPolicy])

  const startingPrice = useMemo(
    () => getStayStartingPrice(stay) ?? stay.nightlyRate,
    [stay]
  )

  const draftRangeSummary = useMemo(() => {
    if (!draftRange?.from || !draftRange.to) {
      return null
    }

    return {
      checkIn: toCalendarDateString(draftRange.from),
      checkOut: toCalendarDateString(draftRange.to),
    }
  }, [draftRange])

  const draftQuote = useMemo(() => {
    if (!draftRangeSummary) {
      return null
    }

    return getStayBookingQuote(
      stay.availabilityCalendar,
      stay.bookingPolicy,
      draftRangeSummary.checkIn,
      draftRangeSummary.checkOut
    )
  }, [draftRangeSummary, stay.availabilityCalendar, stay.bookingPolicy])

  const reserveSearch = useMemo(() => {
    if (!selectedQuote) {
      return ""
    }

    const searchParams = new URLSearchParams({
      stayId: stay.id,
      checkIn: selectedQuote.checkIn,
      checkOut: selectedQuote.checkOut,
    })

    return `/checkout?${searchParams.toString()}`
  }, [selectedQuote, stay.id])

  const isCalendarDayDisabled = (date: Date) => {
    const dateKey = toCalendarDateString(date)

    if (!draftRange?.from || draftRange.to) {
      return !isCheckInDateSelectable(
        stay.availabilityCalendar,
        stay.bookingPolicy,
        dateKey
      )
    }

    const checkIn = toCalendarDateString(draftRange.from)

    if (dateKey <= checkIn) {
      return true
    }

    return !isCheckoutDateSelectable(
      stay.availabilityCalendar,
      stay.bookingPolicy,
      checkIn,
      dateKey
    )
  }

  const openCalendarPopover = (field: ActiveDateField) => {
    setActiveDateField(field)
    setDraftRange(toDateRange(selectedDates))
    setIsCalendarPopoverOpen(true)
  }

  return (
    <Popover
      modal={false}
      onOpenChange={(open, eventDetails) => {
        if (!open && eventDetails.reason === "trigger-press") {
          return
        }

        setIsCalendarPopoverOpen(open)

        if (!open) {
          setDraftRange(toDateRange(selectedDates))
        }
      }}
      open={isCalendarPopoverOpen}
    >
      <Card className="flex min-h-0 w-full overflow-visible rounded-[1.75rem] py-0 text-left lg:ml-6">
        <CardContent className="flex min-h-0 flex-col space-y-5 p-6">
          <div className="space-y-1">
            {selectedQuote ? (
              <>
                <span className="text-2xl font-semibold text-foreground">
                  In total {formatCurrency(selectedQuote.totalPrice)}
                </span>
                <p className="text-sm text-muted-foreground">
                  {selectedQuote.nights} night
                  {selectedQuote.nights === 1 ? "" : "s"} for 1 person
                </p>
              </>
            ) : (
              <>
                <span className="text-2xl font-semibold text-foreground">
                  From {formatCurrency(startingPrice)}
                </span>
                <p className="text-sm text-muted-foreground">
                  Minimum available price for 1 night and 1 guest.
                </p>
              </>
            )}
          </div>

          <PopoverTrigger
            className="block"
            nativeButton={false}
            render={<div />}
          >
            <DateRangeTriggerRow
              activeField={isCalendarPopoverOpen ? activeDateField : undefined}
              checkInValue={selectedDates?.checkIn}
              checkOutValue={selectedDates?.checkOut}
              className={cn(
                "transition-opacity duration-150",
                isCalendarPopoverOpen && "pointer-events-none invisible"
              )}
              onOpenField={openCalendarPopover}
            />
          </PopoverTrigger>

          {selectedQuote ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">
                  Stay subtotal ({selectedQuote.nights} night
                  {selectedQuote.nights === 1 ? "" : "s"})
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(selectedQuote.nightlySubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Cleaning fee</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(selectedQuote.cleaningFee)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Service fee</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(selectedQuote.serviceFee)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              Choose a valid date range to see the total and continue to
              checkout.
            </p>
          )}

          {selectedQuote ? (
            <Link
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
              to={reserveSearch}
            >
              <HugeiconsIcon
                icon={CreditCardIcon}
                size={18}
                strokeWidth={1.9}
              />
              Reserve
            </Link>
          ) : (
            <button
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "w-full"
              )}
              disabled
              type="button"
            >
              <HugeiconsIcon
                icon={CreditCardIcon}
                size={18}
                strokeWidth={1.9}
              />
              Select your dates
            </button>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Your card won&apos;t be charged yet.
          </p>
        </CardContent>
      </Card>

      <PopoverContent
        align="end"
        className="relative [margin-top:calc(-5.15rem-0.75rem)] w-[min(46rem,calc(100vw-1rem))] gap-0 overflow-hidden rounded-[1.8rem] p-0"
        sideOffset={12}
      >
        <div
          className="grid items-start gap-6 pt-0"
          style={{ gridTemplateColumns: "minmax(0,1fr) var(--anchor-width)" }}
        >
          <div className="min-w-0 px-6 pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {draftQuote
                  ? `${draftQuote.nights} night${draftQuote.nights === 1 ? "" : "s"}`
                  : "Select your dates"}
              </p>
              <p className="text-base text-muted-foreground">
                {draftQuote
                  ? formatStayDateRange(draftQuote.checkIn, draftQuote.checkOut)
                  : "Choose check-in and check-out for this stay."}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <DateRangeTriggerRow
              activeField={activeDateField}
              checkInValue={
                draftRange?.from
                  ? toCalendarDateString(draftRange.from)
                  : undefined
              }
              checkOutValue={
                draftRange?.to ? toCalendarDateString(draftRange.to) : undefined
              }
              onOpenField={(field) => {
                setActiveDateField(field)
              }}
            />
          </div>
        </div>

        <div className="flex justify-center px-6 pb-4 pt-5">
          <Calendar
            captionLayout="label"
            className="w-full bg-transparent p-0"
            classNames={{
              root: "relative w-full",
              months:
                "flex w-full flex-col gap-6 md:grid md:grid-cols-2 md:gap-8",
              month: "w-full",
              month_caption:
                "flex h-12 w-full items-center justify-center px-12 text-lg font-semibold",
              nav: "pointer-events-none absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between",
              button_previous:
                "pointer-events-auto size-10 rounded-full border-0 bg-transparent text-foreground shadow-none hover:bg-transparent hover:text-primary",
              button_next:
                "pointer-events-auto size-10 rounded-full border-0 bg-transparent text-foreground shadow-none hover:bg-transparent hover:text-primary",
              weekdays: "mt-2 grid grid-cols-7 gap-1",
              weekday:
                "flex h-9 items-center justify-center text-sm font-medium text-muted-foreground",
              week: "mt-1 grid grid-cols-7 gap-1",
            }}
            disabled={isCalendarDayDisabled}
            excludeDisabled
            mode="range"
            numberOfMonths={isMobileViewport ? 1 : 2}
            onSelect={(range) => {
              if (!range?.from) {
                setDraftRange(undefined)
                setSelectedDates(null)
                return
              }

              if (range.to) {
                const maybeQuote = getStayBookingQuote(
                  stay.availabilityCalendar,
                  stay.bookingPolicy,
                  toCalendarDateString(range.from),
                  toCalendarDateString(range.to)
                )

                if (!maybeQuote) {
                  setDraftRange({
                    from: range.from,
                    to: undefined,
                  })
                  setActiveDateField("checkOut")
                  return
                }

                setDraftRange(range)
                setSelectedDates({
                  checkIn: maybeQuote.checkIn,
                  checkOut: maybeQuote.checkOut,
                })
                setActiveDateField("checkOut")
                return
              }

              setDraftRange(range)
              setActiveDateField("checkOut")
            }}
            selected={draftRange}
          />
        </div>

        <div className="flex flex-col gap-3 px-6 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Button
            className="order-1 w-full sm:order-none sm:w-auto"
            onClick={() => {
              setDraftRange(undefined)
              setSelectedDates(null)
              setActiveDateField("checkIn")
            }}
            size="lg"
            type="button"
            variant="ghost"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.9} />
            <span>Clear dates</span>
          </Button>

          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setDraftRange(toDateRange(selectedDates))
              setIsCalendarPopoverOpen(false)
            }}
            size="lg"
            type="button"
            variant="outline"
          >
            Close
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
