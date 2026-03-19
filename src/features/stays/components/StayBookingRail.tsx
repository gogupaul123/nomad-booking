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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false)
  const [activeDateField, setActiveDateField] =
    useState<ActiveDateField>("checkIn")
  const [hasManualFieldOverride, setHasManualFieldOverride] = useState(false)

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

  const draftCheckIn = draftRange?.from
    ? toCalendarDateString(draftRange.from)
    : null

  const effectiveActiveDateField: ActiveDateField = !draftRange?.from
    ? "checkIn"
    : !draftRange.to && !hasManualFieldOverride
      ? "checkOut"
      : activeDateField

  const isSelectingCheckout =
    effectiveActiveDateField === "checkOut" && draftCheckIn !== null

  const isCalendarDayDisabled = (date: Date) => {
    const dateKey = toCalendarDateString(date)

    if (!isSelectingCheckout) {
      return !isCheckInDateSelectable(
        stay.availabilityCalendar,
        stay.bookingPolicy,
        dateKey
      )
    }

    if (dateKey <= draftCheckIn) {
      return true
    }

    return !isCheckoutDateSelectable(
      stay.availabilityCalendar,
      stay.bookingPolicy,
      draftCheckIn,
      dateKey
    )
  }

  const handleCheckInSelection = (date: Date) => {
    setDraftRange({ from: date, to: undefined })
    setSelectedDates(null)
    setActiveDateField("checkOut")
    setHasManualFieldOverride(false)
  }

  const handleCheckOutSelection = (date: Date) => {
    if (!draftRange?.from) {
      handleCheckInSelection(date)
      return
    }

    const checkIn = toCalendarDateString(draftRange.from)
    const checkOut = toCalendarDateString(date)

    if (checkOut <= checkIn) {
      return
    }

    const maybeQuote = getStayBookingQuote(
      stay.availabilityCalendar,
      stay.bookingPolicy,
      checkIn,
      checkOut
    )

    if (!maybeQuote) {
      return
    }

    setDraftRange({ from: draftRange.from, to: date })
    setSelectedDates({
      checkIn: maybeQuote.checkIn,
      checkOut: maybeQuote.checkOut,
    })
    setHasManualFieldOverride(false)
  }

  const handleCalendarDayClick = (date: Date) => {
    if (isCalendarDayDisabled(date)) {
      return
    }

    if (effectiveActiveDateField === "checkOut" && draftRange?.from) {
      handleCheckOutSelection(date)
      return
    }

    handleCheckInSelection(date)
  }

  const resetDraftRange = () => {
    setDraftRange(toDateRange(selectedDates))
    setHasManualFieldOverride(false)
  }

  const handleCalendarPickerOpenChange = (open: boolean) => {
    setIsCalendarPickerOpen(open)

    if (!open) {
      resetDraftRange()
    }
  }

  const openCalendarPicker = (field: ActiveDateField) => {
    const nextDraftRange = toDateRange(selectedDates)
    const canHonorRequestedField =
      field === "checkIn" || Boolean(nextDraftRange?.from)

    setActiveDateField(canHonorRequestedField ? field : "checkIn")
    setHasManualFieldOverride(canHonorRequestedField)
    setDraftRange(nextDraftRange)
    setIsCalendarPickerOpen(true)
  }

  const handleClearDates = () => {
    setDraftRange(undefined)
    setSelectedDates(null)
    setActiveDateField("checkIn")
    setHasManualFieldOverride(false)
  }

  const calendarPanelContent = (
    <>
      <div
        className={cn(
          "grid items-start gap-6 pt-0",
          isMobileViewport
            ? "grid-cols-1 gap-4 px-3 pt-4"
            : ""
        )}
        style={
          isMobileViewport
            ? undefined
            : { gridTemplateColumns: "minmax(0,1fr) var(--anchor-width)" }
        }
      >
        <div className={cn("min-w-0", isMobileViewport ? "" : "px-6 pt-6")}>
          <div className="space-y-1">
            <p className="text-md font-semibold tracking-tight text-foreground">
              {draftQuote
                ? `${draftQuote.nights} night${draftQuote.nights === 1 ? "" : "s"}`
                : "Select your dates"}
            </p>
            <p className="text-sm text-muted-foreground">
              {draftQuote
                ? formatStayDateRange(draftQuote.checkIn, draftQuote.checkOut)
                : "Choose check-in and check-out for this stay."}
            </p>
          </div>
        </div>

        <div className={cn("shrink-0", isMobileViewport ? "" : "")}>
          <DateRangeTriggerRow
            activeField={effectiveActiveDateField}
            checkInValue={
              draftRange?.from ? toCalendarDateString(draftRange.from) : undefined
            }
            checkOutValue={
              draftRange?.to ? toCalendarDateString(draftRange.to) : undefined
            }
            onOpenField={(field) => {
              const canHonorRequestedField =
                field === "checkIn" || Boolean(draftRange?.from)

              setActiveDateField(canHonorRequestedField ? field : "checkIn")
              setHasManualFieldOverride(canHonorRequestedField)
            }}
          />
        </div>
      </div>

      <div
        className={cn(
          "w-full pt-5",
          isMobileViewport ? "px-1.5 pb-3" : "flex justify-center px-4 pb-4"
        )}
      >
        <Calendar
          key={`stay-booking-calendar-${draftCheckIn ?? "empty"}-${draftRange?.to ? toCalendarDateString(draftRange.to) : "open"}-${effectiveActiveDateField}`}
          captionLayout="label"
          className={cn(
            "w-full max-w-none bg-transparent p-0",
            isMobileViewport
              ? "[--cell-size:calc((100%_-_1.5rem)/7)]"
              : "md:w-fit"
          )}
          classNames={{
            root: "relative w-full min-w-0 md:w-fit",
            months: cn(
              "w-full",
              isMobileViewport
                ? "grid grid-cols-1 gap-2"
                : "flex w-full flex-col gap-2 md:w-fit md:flex-row md:gap-2"
            ),
            month: cn(
              "w-full min-w-0",
              isMobileViewport ? "" : "md:w-[15rem] md:flex-none"
            ),
            month_caption:
              cn(
                "flex h-12 w-full items-center justify-center text-lg font-semibold",
                isMobileViewport ? "px-8" : "px-10 md:px-12"
              ),
            month_grid: "w-full border-collapse table-fixed",
            nav: "pointer-events-none absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between",
            button_previous:
              "pointer-events-auto size-10 rounded-full border-0 bg-transparent text-foreground shadow-none hover:bg-transparent hover:text-primary",
            button_next:
              "pointer-events-auto size-10 rounded-full border-0 bg-transparent text-foreground shadow-none hover:bg-transparent hover:text-primary",
            table: "w-full table-fixed border-collapse",
            weekdays: "mt-2 grid w-full grid-cols-7 gap-1",
            weekday:
              "flex h-9 items-center justify-center text-sm font-medium text-muted-foreground",
            week: "mt-1 grid w-full grid-cols-7 gap-1",
          }}
          disabled={isCalendarDayDisabled}
          excludeDisabled
          mode="range"
          numberOfMonths={2}
          onDayClick={handleCalendarDayClick}
          selected={draftRange}
        />
      </div>

      <div
        className={cn(
          "flex items-center justify-end gap-3 px-6 pb-6",
          isMobileViewport ? "px-3 pb-4" : ""
        )}
      >
        <Button
          className="shrink-0"
          onClick={handleClearDates}
          size="lg"
          type="button"
          variant="ghost"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.9} />
          <span>Clear dates</span>
        </Button>

        <Button
          className="shrink-0"
          onClick={() => {
            resetDraftRange()
            setIsCalendarPickerOpen(false)
          }}
          size="lg"
          type="button"
          variant="outline"
        >
          Close
        </Button>
      </div>
    </>
  )

  const dateRangeTrigger = (
    <DateRangeTriggerRow
      activeField={
        isCalendarPickerOpen && !isMobileViewport
          ? effectiveActiveDateField
          : undefined
      }
      checkInValue={selectedDates?.checkIn}
      checkOutValue={selectedDates?.checkOut}
      className={cn(
        "transition-opacity duration-150",
        isCalendarPickerOpen &&
          !isMobileViewport &&
          "pointer-events-none invisible"
      )}
      onOpenField={openCalendarPicker}
    />
  )

  const cardContent = (
    <>
      {isMobileViewport ? (
        dateRangeTrigger
      ) : (
        <PopoverTrigger
          className="block"
          nativeButton={false}
          render={<div />}
        >
          {dateRangeTrigger}
        </PopoverTrigger>
      )}

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
    </>
  )

  const card = (
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

        {cardContent}
      </CardContent>
    </Card>
  )

  if (isMobileViewport) {
    return (
      <Drawer onOpenChange={handleCalendarPickerOpenChange} open={isCalendarPickerOpen}>
        {card}
        <DrawerContent className="gap-0 overflow-y-auto rounded-t-[1.8rem] border-t border-border/70 bg-popover px-0 pb-[max(1rem,env(safe-area-inset-bottom))] text-popover-foreground data-[vaul-drawer-direction=bottom]:max-h-[92vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Stay booking dates</DrawerTitle>
            <DrawerDescription>
              Choose check-in and check-out dates for this stay.
            </DrawerDescription>
          </DrawerHeader>
          {calendarPanelContent}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover
      modal={false}
      onOpenChange={(open, eventDetails) => {
        if (!open && eventDetails.reason === "trigger-press") {
          return
        }

        handleCalendarPickerOpenChange(open)
      }}
      open={isCalendarPickerOpen}
    >
      {card}

      <PopoverContent
        align="end"
        className="relative [margin-top:calc(-5.15rem-0.75rem)] w-[min(34rem,calc(100vw-1rem))] gap-0 overflow-hidden rounded-[1.8rem] p-0"
        sideOffset={12}
      >
        {calendarPanelContent}
      </PopoverContent>
    </Popover>
  )
}
