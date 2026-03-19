import type { VercelRequest, VercelResponse } from "@vercel/node"

import { parseJsonBody, sendJson, sendRouteError } from "./_lib/response.js"
import { createBooking } from "../src/features/stays/mock-store.js"
import { bookingInputSchema } from "../src/features/stays/schemas.js"

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Method not allowed." })
    return
  }

  try {
    const booking = createBooking(
      bookingInputSchema.parse(parseJsonBody(request.body))
    )

    console.info("booking_created", {
      bookingId: booking.id,
      stayId: booking.stayId,
    })
    sendJson(response, 200, booking)
  } catch (error) {
    sendRouteError(response, error)
  }
}
