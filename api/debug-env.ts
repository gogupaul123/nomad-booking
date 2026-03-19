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
    cwd: process.cwd(),
    env: {
      nodeEnv: process.env.NODE_ENV ?? null,
      vercel: process.env.VERCEL ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      vercelRegion: process.env.VERCEL_REGION ?? null,
    },
    nodeVersion: process.version,
    platform: process.platform,
  })
}
