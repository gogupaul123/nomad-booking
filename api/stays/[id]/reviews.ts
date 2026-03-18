import type { VercelRequest, VercelResponse } from "@vercel/node"

import { parseJsonBody, sendJson, sendRouteError } from "../../_lib/response"
import { addReview, getReviewsByBookingId } from "@/features/stays/mock-store"
import { reviewInputSchema } from "@/features/stays/schemas"

function getStayId(request: VercelRequest) {
  const rawId = request.query.id
  return Array.isArray(rawId) ? rawId[0] : rawId
}

export default function handler(request: VercelRequest, response: VercelResponse) {
  const bookingId = getStayId(request)

  if (!bookingId) {
    sendJson(response, 400, { message: "Booking id is required." })
    return
  }

  try {
    if (request.method === "GET") {
      sendJson(response, 200, getReviewsByBookingId(bookingId))
      return
    }

    if (request.method === "POST") {
      const review = addReview(
        bookingId,
        reviewInputSchema.parse(parseJsonBody(request.body))
      )

      console.info("review_created", { bookingId, reviewId: review.id })
      sendJson(response, 200, review)
      return
    }

    sendJson(response, 405, { message: "Method not allowed." })
  } catch (error) {
    sendRouteError(response, error)
  }
}
