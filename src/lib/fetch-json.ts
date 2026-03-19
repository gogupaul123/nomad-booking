import { z } from "zod"

const apiErrorSchema = z.object({
  message: z.string(),
  issues: z.array(z.string()).optional(),
})

export class ApiError extends Error {
  status: number
  issues?: string[]

  constructor(message: string, status: number, issues?: string[]) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.issues = issues
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  schema: z.ZodType<T>,
  init?: RequestInit
) {
  const response = await fetch(input, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  })

  const rawText = await response.text()
  const payload = rawText.length > 0 ? JSON.parse(rawText) : null

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload)
    throw new ApiError(
      parsedError.success ? parsedError.data.message : "Request failed.",
      response.status,
      parsedError.success ? parsedError.data.issues : undefined
    )
  }

  return schema.parse(payload)
}
