import { keepPreviousData, queryOptions } from "@tanstack/react-query"

import {
  fetchReviews,
  fetchStayById,
  fetchStays,
} from "@/features/stays/api-client"
import type { StaySearchParams } from "@/features/stays/schemas"

export const stayKeys = {
  all: ["stays"] as const,
  lists: () => [...stayKeys.all, "list"] as const,
  list: (filters: StaySearchParams) => [...stayKeys.lists(), filters] as const,
  detail: (stayId: string) => [...stayKeys.all, "detail", stayId] as const,
  reviews: (stayId: string) => [...stayKeys.detail(stayId), "reviews"] as const,
}

export function stayListQueryOptions(filters: StaySearchParams) {
  return queryOptions({
    queryKey: stayKeys.list(filters),
    queryFn: () => fetchStays(filters),
    placeholderData: keepPreviousData,
  })
}

export function stayDetailQueryOptions(stayId: string) {
  return queryOptions({
    queryKey: stayKeys.detail(stayId),
    queryFn: () => fetchStayById(stayId),
    enabled: stayId.length > 0,
  })
}

export function stayReviewsQueryOptions(stayId: string) {
  return queryOptions({
    queryKey: stayKeys.reviews(stayId),
    queryFn: () => fetchReviews(stayId),
    enabled: stayId.length > 0,
  })
}
