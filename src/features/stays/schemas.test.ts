import { describe, expect, it } from "vitest"

import {
  bookingSearchParamsSchema,
  reviewInputSchema,
} from "@/features/stays/schemas"

describe("bookingSearchParamsSchema", () => {
  it("normalizes empty values into defaults", () => {
    expect(
      bookingSearchParamsSchema.parse({
        query: "   ",
        city: "",
        sort: undefined,
      })
    ).toEqual({
      query: undefined,
      city: undefined,
      sort: "recommended",
    })
  })
})

describe("reviewInputSchema", () => {
  it("rejects comments that are too short", () => {
    expect(() =>
      reviewInputSchema.parse({
        author: "Sam",
        rating: 4,
        comment: "Too short",
      })
    ).toThrow()
  })
})
