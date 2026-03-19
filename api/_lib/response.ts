import type { VercelResponse } from "@vercel/node"
import { ZodError } from "zod"

import { StoreError } from "../../src/features/stays/mock-store"

export function sendJson(response: VercelResponse, status: number, payload: unknown) {
  response.status(status).json(payload)
}

export function sendRouteError(response: VercelResponse, error: unknown) {
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

  console.error("Unexpected API error", error)

  sendJson(response, 500, {
    message: "Unexpected server error.",
  })
}

export function parseJsonBody<T>(body: unknown) {
  if (typeof body === "string") {
    return JSON.parse(body) as T
  }

  return body as T
}
