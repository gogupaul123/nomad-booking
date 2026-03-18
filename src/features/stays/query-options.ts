import { queryOptions } from "@tanstack/react-query"

import {
  fetchStayCards,
  fetchStayDetails,
  fetchStayReviews,
} from "@/features/stays/api-client"
import type { StaySearchParams } from "@/features/stays/schemas"

export const stayKeys = {
  all: ["stays"] as const,
  lists: () => [...stayKeys.all, "list"] as const,
  list: (filters: StaySearchParams) =>
    [...stayKeys.lists(), filters] as const,
  detail: (stayId: string) =>
    [...stayKeys.all, "detail", stayId] as const,
  reviews: (stayId: string) =>
    [...stayKeys.detail(stayId), "reviews"] as const,
}

export function stayCardsQueryOptions(filters: StaySearchParams) {
  return queryOptions({
    queryKey: stayKeys.list(filters),
    queryFn: () => fetchStayCards(filters),
  })
}

export function stayDetailsQueryOptions(stayId: string) {
  return queryOptions({
    queryKey: stayKeys.detail(stayId),
    queryFn: () => fetchStayDetails(stayId),
    enabled: stayId.length > 0,
  })
}

export function stayReviewsQueryOptions(stayId: string) {
  return queryOptions({
    queryKey: stayKeys.reviews(stayId),
    queryFn: () => fetchStayReviews(stayId),
    enabled: stayId.length > 0,
  })
}
