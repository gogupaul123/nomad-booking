import { fetchJson } from "@/lib/fetch-json"

import {
  bookingCardsResponseSchema,
  bookingDetailsSchema,
  bookingSearchParamsSchema,
  checkoutSearchParamsSchema,
  reservationInputSchema,
  reservationSchema,
  reviewInputSchema,
  reviewSchema,
  reviewsResponseSchema,
  type BookingSearchParams,
  type CheckoutSearchParams,
  type ReservationInput,
  type ReviewInput,
} from "@/features/stays/schemas"

function buildSearchString(params: BookingSearchParams) {
  const searchParams = new URLSearchParams()

  if (params.query) {
    searchParams.set("query", params.query)
  }

  if (params.city) {
    searchParams.set("city", params.city)
  }

  if (params.sort !== "recommended") {
    searchParams.set("sort", params.sort)
  }

  return searchParams.toString()
}

export function parseBookingSearchParams(searchParams: URLSearchParams) {
  return bookingSearchParamsSchema.parse({
    query: searchParams.get("query") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  })
}

export function parseCheckoutSearchParams(searchParams: URLSearchParams) {
  return checkoutSearchParamsSchema.safeParse({
    bookingId: searchParams.get("bookingId") ?? undefined,
    slotId: searchParams.get("slotId") ?? undefined,
  })
}

export function createBookingSearchString(params: BookingSearchParams) {
  const normalized = bookingSearchParamsSchema.parse(params)
  const searchString = buildSearchString(normalized)
  return searchString.length > 0 ? `?${searchString}` : ""
}

export async function fetchBookingCards(params: BookingSearchParams) {
  const normalized = bookingSearchParamsSchema.parse(params)
  const searchString = buildSearchString(normalized)

  return fetchJson(
    searchString.length > 0 ? `/api/stays?${searchString}` : "/api/stays",
    bookingCardsResponseSchema
  )
}

export async function fetchBookingDetails(bookingId: string) {
  return fetchJson(`/api/stays/${bookingId}`, bookingDetailsSchema)
}

export async function fetchBookingReviews(bookingId: string) {
  return fetchJson(`/api/stays/${bookingId}/reviews`, reviewsResponseSchema)
}

export async function postReview(bookingId: string, input: ReviewInput) {
  const parsedInput = reviewInputSchema.parse(input)
  return fetchJson(`/api/stays/${bookingId}/reviews`, reviewSchema, {
    method: "POST",
    body: JSON.stringify(parsedInput),
  })
}

export async function postReservation(input: ReservationInput) {
  const parsedInput = reservationInputSchema.parse(input)
  return fetchJson("/api/bookings", reservationSchema, {
    method: "POST",
    body: JSON.stringify(parsedInput),
  })
}

export function assertCheckoutSearchParams(searchParams: URLSearchParams) {
  return checkoutSearchParamsSchema.parse({
    bookingId: searchParams.get("bookingId") ?? undefined,
    slotId: searchParams.get("slotId") ?? undefined,
  }) satisfies CheckoutSearchParams
}
