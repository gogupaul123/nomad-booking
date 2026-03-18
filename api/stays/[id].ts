import type { VercelRequest, VercelResponse } from "@vercel/node"

import { sendJson, sendRouteError } from "../_lib/response"
import { getBookingById } from "@/features/stays/mock-store"

function getStayId(request: VercelRequest) {
  const rawId = request.query.id
  return Array.isArray(rawId) ? rawId[0] : rawId
}

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    sendJson(response, 405, { message: "Method not allowed." })
    return
  }

  try {
    const bookingId = getStayId(request)
    if (!bookingId) {
      sendJson(response, 400, { message: "Booking id is required." })
      return
    }

    sendJson(response, 200, getBookingById(bookingId))
  } catch (error) {
    sendRouteError(response, error)
  }
}
