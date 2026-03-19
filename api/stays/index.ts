import type { VercelRequest, VercelResponse } from "@vercel/node"

import { sendJson, sendRouteError } from "../_lib/response.js"
import { listStayCards } from "../../src/features/stays/mock-store.js"
import { staySearchParamsSchema } from "../../src/features/stays/schemas.js"

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    sendJson(response, 405, { message: "Method not allowed." })
    return
  }

  try {
    const filters = staySearchParamsSchema.parse({
      query: request.query.query,
      city: request.query.city,
      minPrice: request.query.minPrice,
      maxPrice: request.query.maxPrice,
      minRating: request.query.minRating,
      maxRating: request.query.maxRating,
      sort: request.query.sort,
    })

    sendJson(response, 200, listStayCards(filters))
  } catch (error) {
    sendRouteError(response, error)
  }
}
