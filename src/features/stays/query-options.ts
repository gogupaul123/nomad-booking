import { keepPreviousData, queryOptions } from "@tanstack/react-query"

import {
  fetchBookingCards,
  fetchBookingDetails,
  fetchBookingReviews,
} from "@/features/stays/api-client"
import type { BookingSearchParams } from "@/features/stays/schemas"

export const bookingKeys = {
  all: ["bookings"] as const,
  lists: () => [...bookingKeys.all, "list"] as const,
  list: (filters: BookingSearchParams) =>
    [...bookingKeys.lists(), filters] as const,
  detail: (bookingId: string) =>
    [...bookingKeys.all, "detail", bookingId] as const,
  reviews: (bookingId: string) =>
    [...bookingKeys.detail(bookingId), "reviews"] as const,
}

export function bookingCardsQueryOptions(filters: BookingSearchParams) {
  return queryOptions({
    queryKey: bookingKeys.list(filters),
    queryFn: () => fetchBookingCards(filters),
    placeholderData: keepPreviousData,
  })
}

export function bookingDetailsQueryOptions(bookingId: string) {
  return queryOptions({
    queryKey: bookingKeys.detail(bookingId),
    queryFn: () => fetchBookingDetails(bookingId),
    enabled: bookingId.length > 0,
  })
}

export function bookingReviewsQueryOptions(bookingId: string) {
  return queryOptions({
    queryKey: bookingKeys.reviews(bookingId),
    queryFn: () => fetchBookingReviews(bookingId),
    enabled: bookingId.length > 0,
  })
}
