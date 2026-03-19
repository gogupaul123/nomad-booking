import type { VercelRequest, VercelResponse } from "@vercel/node"

export default function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== "GET") {
    response.status(405).json({ message: "Method not allowed." })
    return
  }

  response.status(200).json({
    ok: true,
    region: process.env.VERCEL_REGION ?? null,
    runtime: "nodejs",
    timestamp: new Date().toISOString(),
  })
}
