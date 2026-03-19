import type { VercelRequest, VercelResponse } from "@vercel/node"

import { sendJson, sendRouteError } from "../_lib/response.js"
import { getStayById } from "../../src/features/stays/mock-store.js"

function getStayId(request: VercelRequest) {
  const rawId = request.query.id
  const stayId = Array.isArray(rawId) ? rawId[0] : rawId
  return stayId ? decodeURIComponent(stayId) : stayId
}

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    sendJson(response, 405, { message: "Method not allowed." })
    return
  }

  try {
    const stayId = getStayId(request)
    if (!stayId) {
      sendJson(response, 400, { message: "Stay id is required." })
      return
    }

    sendJson(response, 200, getStayById(stayId))
  } catch (error) {
    sendRouteError(response, error)
  }
}
