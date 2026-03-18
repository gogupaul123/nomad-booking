import { fetchJson } from "@/lib/fetch-json"

import {
  stayCardsResponseSchema,
  stayDetailsSchema,
  staySearchParamsSchema,
  checkoutSearchParamsSchema,
  bookingInputSchema,
  bookingSchema,
  reviewInputSchema,
  reviewSchema,
  reviewsResponseSchema,
  type StaySearchParams,
  type CheckoutSearchParams,
  type BookingInput,
  type ReviewInput,
} from "@/features/stays/schemas"

function buildSearchString(params: StaySearchParams) {
  const searchParams = new URLSearchParams()

  if (params.query) {
    searchParams.set("query", params.query)
  }

  if (params.city) {
    searchParams.set("city", params.city)
  }

  if (params.minPrice !== undefined) {
    searchParams.set("minPrice", String(params.minPrice))
  }

  if (params.maxPrice !== undefined) {
    searchParams.set("maxPrice", String(params.maxPrice))
  }

  if (params.minRating !== undefined) {
    searchParams.set("minRating", String(params.minRating))
  }

  if (params.maxRating !== undefined) {
    searchParams.set("maxRating", String(params.maxRating))
  }

  if (params.sort !== "rating-high") {
    searchParams.set("sort", params.sort)
  }

  return searchParams.toString()
}

export function parseStaySearchParams(searchParams: URLSearchParams) {
  return staySearchParamsSchema.parse({
    query: searchParams.get("query") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    minRating: searchParams.get("minRating") ?? undefined,
    maxRating: searchParams.get("maxRating") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  })
}

export function parseCheckoutSearchParams(searchParams: URLSearchParams) {
  return checkoutSearchParamsSchema.safeParse({
    stayId: searchParams.get("stayId") ?? undefined,
    checkIn: searchParams.get("checkIn") ?? undefined,
    checkOut: searchParams.get("checkOut") ?? undefined,
  })
}

export function createStaySearchString(params: StaySearchParams) {
  const normalized = staySearchParamsSchema.parse(params)
  const searchString = buildSearchString(normalized)
  return searchString.length > 0 ? `?${searchString}` : ""
}

export async function fetchStayCards(params: StaySearchParams) {
  const normalized = staySearchParamsSchema.parse(params)
  const searchString = buildSearchString(normalized)

  return fetchJson(
    searchString.length > 0 ? `/api/stays?${searchString}` : "/api/stays",
    stayCardsResponseSchema
  )
}

export async function fetchStayDetails(stayId: string) {
  return fetchJson(`/api/stays/${stayId}`, stayDetailsSchema)
}

export async function fetchStayReviews(stayId: string) {
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
  return fetchJson("/api/bookings", bookingSchema, {
    method: "POST",
    body: JSON.stringify(parsedInput),
  })
}

export function assertCheckoutSearchParams(searchParams: URLSearchParams) {
  return checkoutSearchParamsSchema.parse({
    stayId: searchParams.get("stayId") ?? undefined,
    checkIn: searchParams.get("checkIn") ?? undefined,
    checkOut: searchParams.get("checkOut") ?? undefined,
  }) satisfies CheckoutSearchParams
}
