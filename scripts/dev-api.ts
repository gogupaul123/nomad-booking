import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { ZodError } from "zod"

import {
  addReview,
  createReservation,
  getBookingById,
  getReviewsByBookingId,
  listBookingCards,
  StoreError,
} from "../src/features/stays/mock-store.ts"
import {
  bookingSearchParamsSchema,
  reservationInputSchema,
  reviewInputSchema,
} from "../src/features/stays/schemas.ts"

const port = Number(process.env.PORT ?? 3001)

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown
) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  })
  response.end(JSON.stringify(payload))
}

async function readJsonBody(request: IncomingMessage) {
  let rawBody = ""

  for await (const chunk of request) {
    rawBody += chunk
  }

  if (rawBody.length === 0) {
    return undefined
  }

  return JSON.parse(rawBody) as unknown
}

function sendRouteError(response: ServerResponse, error: unknown) {
  if (error instanceof ZodError) {
    sendJson(response, 400, {
      message: "Request validation failed.",
      issues: error.issues.map((issue) => issue.message),
    })
    return
  }

  if (error instanceof StoreError) {
    sendJson(response, error.status, {
      message: error.message,
    })
    return
  }

  console.error("Unexpected local API error", error)
  sendJson(response, 500, {
    message: "Unexpected server error.",
  })
}

const server = createServer(async (request, response) => {
  const method = request.method ?? "GET"
  const url = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? "localhost"}`
  )
  const pathname = url.pathname

  try {
    if (method === "GET" && pathname === "/api/stays") {
      const filters = bookingSearchParamsSchema.parse({
        query: url.searchParams.get("query") ?? undefined,
        city: url.searchParams.get("city") ?? undefined,
        sort: url.searchParams.get("sort") ?? undefined,
      })

      sendJson(response, 200, listBookingCards(filters))
      return
    }

    const bookingDetailsMatch = pathname.match(/^\/api\/stays\/([^/]+)$/)
    if (method === "GET" && bookingDetailsMatch) {
      sendJson(
        response,
        200,
        getBookingById(decodeURIComponent(bookingDetailsMatch[1]!))
      )
      return
    }

    const bookingReviewsMatch = pathname.match(/^\/api\/stays\/([^/]+)\/reviews$/)
    if (bookingReviewsMatch && method === "GET") {
      sendJson(
        response,
        200,
        getReviewsByBookingId(decodeURIComponent(bookingReviewsMatch[1]!))
      )
      return
    }

    if (bookingReviewsMatch && method === "POST") {
      const bookingId = decodeURIComponent(bookingReviewsMatch[1]!)
      const review = addReview(
        bookingId,
        reviewInputSchema.parse(await readJsonBody(request))
      )

      console.info("review_created", { bookingId, reviewId: review.id })
      sendJson(response, 200, review)
      return
    }

    if (pathname === "/api/bookings" && method === "POST") {
      const reservation = createReservation(
        reservationInputSchema.parse(await readJsonBody(request))
      )

      console.info("reservation_created", {
        reservationId: reservation.id,
        bookingId: reservation.bookingId,
      })
      sendJson(response, 200, reservation)
      return
    }

    sendJson(response, 404, {
      message: "Route not found.",
    })
  } catch (error) {
    sendRouteError(response, error)
  }
})

server.listen(port, () => {
  console.info(`Nomad Booking local API listening on http://localhost:${port}`)
})
