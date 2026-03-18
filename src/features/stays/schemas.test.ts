import { describe, expect, it } from "vitest"

import {
  reviewInputSchema,
  staySearchParamsSchema,
} from "@/features/stays/schemas"

describe("staySearchParamsSchema", () => {
  it("normalizes empty values into defaults", () => {
    expect(
      staySearchParamsSchema.parse({
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
