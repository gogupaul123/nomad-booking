import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { ZodError } from "zod"

import {
  addReview,
  createBooking,
  getReviewsByStayId,
  getStayById,
  listStays,
  StoreError,
} from "../src/features/stays/mock-store.ts"
import {
  bookingInputSchema,
  reviewInputSchema,
  staySearchParamsSchema,
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
      const filters = staySearchParamsSchema.parse({
        query: url.searchParams.get("query") ?? undefined,
        city: url.searchParams.get("city") ?? undefined,
        sort: url.searchParams.get("sort") ?? undefined,
      })

      sendJson(response, 200, listStays(filters))
      return
    }

    const stayDetailsMatch = pathname.match(/^\/api\/stays\/([^/]+)$/)
    if (method === "GET" && stayDetailsMatch) {
      sendJson(response, 200, getStayById(decodeURIComponent(stayDetailsMatch[1]!)))
      return
    }

    const stayReviewsMatch = pathname.match(/^\/api\/stays\/([^/]+)\/reviews$/)
    if (stayReviewsMatch && method === "GET") {
      sendJson(
        response,
        200,
        getReviewsByStayId(decodeURIComponent(stayReviewsMatch[1]!))
      )
      return
    }

    if (stayReviewsMatch && method === "POST") {
      const stayId = decodeURIComponent(stayReviewsMatch[1]!)
      const review = addReview(
        stayId,
        reviewInputSchema.parse(await readJsonBody(request))
      )

      console.info("review_created", { stayId, reviewId: review.id })
      sendJson(response, 200, review)
      return
    }

    if (pathname === "/api/bookings" && method === "POST") {
      const booking = createBooking(
        bookingInputSchema.parse(await readJsonBody(request))
      )

      console.info("booking_created", {
        bookingId: booking.id,
        stayId: booking.stayId,
      })
      sendJson(response, 200, booking)
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
