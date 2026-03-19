import type { VercelRequest, VercelResponse } from "@vercel/node"

import { parseJsonBody, sendJson, sendRouteError } from "../../_lib/response.js"
import { addReview, getReviewsByStayId } from "../../../src/features/stays/mock-store.js"
import { reviewInputSchema } from "../../../src/features/stays/schemas.js"

function getStayId(request: VercelRequest) {
  const rawId = request.query.id
  const stayId = Array.isArray(rawId) ? rawId[0] : rawId
  return stayId ? decodeURIComponent(stayId) : stayId
}

export default function handler(request: VercelRequest, response: VercelResponse) {
  const stayId = getStayId(request)

  if (!stayId) {
    sendJson(response, 400, { message: "Stay id is required." })
    return
  }

  try {
    if (request.method === "GET") {
      sendJson(response, 200, getReviewsByStayId(stayId))
      return
    }

    if (request.method === "POST") {
      const review = addReview(
        stayId,
        reviewInputSchema.parse(parseJsonBody(request.body))
      )

      console.info("review_created", { stayId, reviewId: review.id })
      sendJson(response, 200, review)
      return
    }

    sendJson(response, 405, { message: "Method not allowed." })
  } catch (error) {
    sendRouteError(response, error)
  }
}
