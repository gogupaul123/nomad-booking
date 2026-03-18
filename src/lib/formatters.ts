import { format, parseISO } from "date-fns"

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatSlotRange(checkIn: string, checkOut: string) {
  return `${format(new Date(checkIn), "MMM d")} - ${format(
    new Date(checkOut),
    "MMM d"
  )}`
}

export function formatStayDate(value: string, pattern = "MMM d, yyyy") {
  return format(parseISO(value), pattern)
}

export function formatStayDateRange(checkIn: string, checkOut: string) {
  return `${formatStayDate(checkIn, "MMM d")} - ${formatStayDate(
    checkOut,
    "MMM d"
  )}`
}

export function formatDateTime(value: string) {
  return format(new Date(value), "MMM d, yyyy 'at' HH:mm")
}
