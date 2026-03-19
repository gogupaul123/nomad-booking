import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns"

import type {
  StayAvailabilityEntry,
  StayBookingPolicy,
  StayDetails,
} from "./schemas"

export type BookingQuote = {
  checkIn: string
  checkOut: string
  nightDates: string[]
  nights: number
  nightlySubtotal: number
  cleaningFee: number
  serviceFee: number
  totalPrice: number
}

function formatCalendarDate(value: Date) {
  return format(value, "yyyy-MM-dd")
}

function getAvailabilityEntryMap(calendar: StayAvailabilityEntry[]) {
  return new Map(calendar.map((entry) => [entry.date, entry]))
}

export function toCalendarDateString(value: Date) {
  return formatCalendarDate(value)
}

export function listNightDates(checkIn: string, checkOut: string) {
  const nights = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn))

  return Array.from({ length: Math.max(nights, 0) }, (_, index) =>
    formatCalendarDate(addDays(parseISO(checkIn), index))
  )
}

export function getMinimumAvailableNightlyPrice(
  calendar: StayAvailabilityEntry[]
) {
  const availablePrices = calendar
    .filter((entry) => entry.isAvailable && entry.remainingUnits > 0)
    .map((entry) => entry.nightlyPrice)

  if (availablePrices.length === 0) {
    return null
  }

  return Math.min(...availablePrices)
}

export function getNextAvailableCheckIn(
  calendar: StayAvailabilityEntry[],
  bookingPolicy: StayBookingPolicy
) {
  for (const entry of calendar) {
    if (isCheckInDateSelectable(calendar, bookingPolicy, entry.date)) {
      return entry.date
    }
  }

  return null
}

export function getStayBookingQuote(
  calendar: StayAvailabilityEntry[],
  bookingPolicy: StayBookingPolicy,
  checkIn: string,
  checkOut: string
): BookingQuote | null {
  const nights = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn))

  if (nights < bookingPolicy.minNights) {
    return null
  }

  const availabilityByDate = getAvailabilityEntryMap(calendar)
  const nightDates = listNightDates(checkIn, checkOut)

  if (nightDates.length !== nights) {
    return null
  }

  const bookedEntries = nightDates.map((date) => availabilityByDate.get(date))

  if (
    bookedEntries.some(
      (entry) => !entry || !entry.isAvailable || entry.remainingUnits < 1
    )
  ) {
    return null
  }

  const nightlySubtotal = bookedEntries.reduce(
    (sum, entry) => sum + (entry?.nightlyPrice ?? 0),
    0
  )
  const totalPrice =
    nightlySubtotal +
    bookingPolicy.cleaningFee +
    bookingPolicy.serviceFee

  return {
    checkIn,
    checkOut,
    nightDates,
    nights,
    nightlySubtotal,
    cleaningFee: bookingPolicy.cleaningFee,
    serviceFee: bookingPolicy.serviceFee,
    totalPrice,
  }
}

export function getFirstBookableRange(
  calendar: StayAvailabilityEntry[],
  bookingPolicy: StayBookingPolicy
) {
  for (const entry of calendar) {
    for (let nights = bookingPolicy.minNights; nights <= 14; nights += 1) {
      const candidateCheckOut = formatCalendarDate(
        addDays(parseISO(entry.date), nights)
      )

      if (getStayBookingQuote(calendar, bookingPolicy, entry.date, candidateCheckOut)) {
        return {
          checkIn: entry.date,
          checkOut: candidateCheckOut,
        }
      }
    }
  }

  return null
}

export function isCheckInDateSelectable(
  calendar: StayAvailabilityEntry[],
  bookingPolicy: StayBookingPolicy,
  checkIn: string
) {
  const minimumCheckout = formatCalendarDate(
    addDays(parseISO(checkIn), bookingPolicy.minNights)
  )

  return getStayBookingQuote(calendar, bookingPolicy, checkIn, minimumCheckout) !== null
}

export function isCheckoutDateSelectable(
  calendar: StayAvailabilityEntry[],
  bookingPolicy: StayBookingPolicy,
  checkIn: string,
  checkOut: string
) {
  return getStayBookingQuote(calendar, bookingPolicy, checkIn, checkOut) !== null
}

export function getStayStartingPrice(stay: Pick<StayDetails, "availabilityCalendar">) {
  return getMinimumAvailableNightlyPrice(stay.availabilityCalendar)
}
