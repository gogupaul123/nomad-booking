import type { VercelRequest, VercelResponse } from "@vercel/node"

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack ?? null,
    }
  }

  return {
    message: String(error),
    name: "UnknownError",
    stack: null,
  }
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== "GET") {
    response.status(405).json({ message: "Method not allowed." })
    return
  }

  const diagnostics: Record<string, unknown> = {}

  try {
    const schemasModule = await import("../src/features/stays/schemas")
    diagnostics.schemas = {
      ok: true,
      exports: Object.keys(schemasModule).slice(0, 12),
    }
  } catch (error) {
    diagnostics.schemas = {
      ok: false,
      error: serializeError(error),
    }
  }

  try {
    const bookingModule = await import("../src/features/stays/booking")
    diagnostics.booking = {
      ok: true,
      exports: Object.keys(bookingModule),
    }
  } catch (error) {
    diagnostics.booking = {
      ok: false,
      error: serializeError(error),
    }
  }

  try {
    const storeModule = await import("../src/features/stays/mock-store")
    const sample = storeModule.listStayCards({
      sort: "rating-high",
    })

    diagnostics.mockStore = {
      ok: true,
      total: sample.total,
      cities: sample.availableCities.slice(0, 5),
      firstStay: sample.stays[0]?.id ?? null,
    }
  } catch (error) {
    diagnostics.mockStore = {
      ok: false,
      error: serializeError(error),
    }
  }

  response.status(200).json({
    ok:
      diagnostics.schemas &&
      diagnostics.booking &&
      diagnostics.mockStore,
    diagnostics,
  })
}
