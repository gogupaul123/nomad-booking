import { fetchJson } from "@/lib/fetch-json"

import {
  bookingConfirmationSchema,
  bookingInputSchema,
  checkoutSearchParamsSchema,
  reviewInputSchema,
  reviewSchema,
  reviewsResponseSchema,
  stayDetailSchema,
  staySearchParamsSchema,
  staysResponseSchema,
  type BookingInput,
  type CheckoutSearchParams,
  type ReviewInput,
  type StaySearchParams,
} from "@/features/stays/schemas"

function buildSearchString(params: StaySearchParams) {
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

export function parseStaySearchParams(searchParams: URLSearchParams) {
  return staySearchParamsSchema.parse({
    query: searchParams.get("query") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  })
}

export function parseCheckoutSearchParams(searchParams: URLSearchParams) {
  return checkoutSearchParamsSchema.safeParse({
    stayId: searchParams.get("stayId") ?? undefined,
    slotId: searchParams.get("slotId") ?? undefined,
  })
}

export function createStaySearchString(params: StaySearchParams) {
  const normalized = staySearchParamsSchema.parse(params)
  const searchString = buildSearchString(normalized)
  return searchString.length > 0 ? `?${searchString}` : ""
}

export async function fetchStays(params: StaySearchParams) {
  const normalized = staySearchParamsSchema.parse(params)
  const searchString = buildSearchString(normalized)

  return fetchJson(
    searchString.length > 0 ? `/api/stays?${searchString}` : "/api/stays",
    staysResponseSchema
  )
}

export async function fetchStayById(stayId: string) {
  return fetchJson(`/api/stays/${stayId}`, stayDetailSchema)
}

export async function fetchReviews(stayId: string) {
  return fetchJson(`/api/stays/${stayId}/reviews`, reviewsResponseSchema)
}

export async function postReview(stayId: string, input: ReviewInput) {
  const parsedInput = reviewInputSchema.parse(input)
  return fetchJson(`/api/stays/${stayId}/reviews`, reviewSchema, {
    method: "POST",
    body: JSON.stringify(parsedInput),
  })
}

export async function postBooking(input: BookingInput) {
  const parsedInput = bookingInputSchema.parse(input)
  return fetchJson("/api/bookings", bookingConfirmationSchema, {
    method: "POST",
    body: JSON.stringify(parsedInput),
  })
}

export function assertCheckoutSearchParams(searchParams: URLSearchParams) {
  return checkoutSearchParamsSchema.parse({
    stayId: searchParams.get("stayId") ?? undefined,
    slotId: searchParams.get("slotId") ?? undefined,
  }) satisfies CheckoutSearchParams
}
