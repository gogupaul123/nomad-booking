import type { VercelRequest, VercelResponse } from "@vercel/node"

import { parseJsonBody, sendJson, sendRouteError } from "./_lib/response"
import { createReservation } from "@/features/stays/mock-store"
import { reservationInputSchema } from "@/features/stays/schemas"

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Method not allowed." })
    return
  }

  try {
    const reservation = createReservation(
      reservationInputSchema.parse(parseJsonBody(request.body))
    )

    console.info("reservation_created", {
      reservationId: reservation.id,
      bookingId: reservation.bookingId,
    })
    sendJson(response, 200, reservation)
  } catch (error) {
    sendRouteError(response, error)
  }
}
