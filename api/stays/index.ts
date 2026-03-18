import type { VercelRequest, VercelResponse } from "@vercel/node"

import { sendJson, sendRouteError } from "../_lib/response"
import { listStays } from "@/features/stays/mock-store"
import { staySearchParamsSchema } from "@/features/stays/schemas"

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    sendJson(response, 405, { message: "Method not allowed." })
    return
  }

  try {
    const filters = staySearchParamsSchema.parse({
      query: request.query.query,
      city: request.query.city,
      sort: request.query.sort,
    })

    sendJson(response, 200, listStays(filters))
  } catch (error) {
    sendRouteError(response, error)
  }
}
