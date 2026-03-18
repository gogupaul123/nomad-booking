import { describe, expect, it } from "vitest"

import {
  staySearchParamsSchema,
  reviewInputSchema,
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
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      maxRating: undefined,
      sort: "rating-high",
    })
  })

  it("accepts the supported server-side sort options", () => {
    expect(
      staySearchParamsSchema.parse({
        sort: "price-high",
      }).sort
    ).toBe("price-high")
  })

  it("parses numeric filter values from search params", () => {
    expect(
      staySearchParamsSchema.parse({
        minPrice: "120",
        maxPrice: "220",
        minRating: "4.2",
        maxRating: "4.8",
      })
    ).toMatchObject({
      minPrice: 120,
      maxPrice: 220,
      minRating: 4.2,
      maxRating: 4.8,
    })
  })
})

describe("reviewInputSchema", () => {
  it("rejects comments that are too short", () => {
    expect(() =>
      reviewInputSchema.parse({
        name: "Sam",
        rating: 4,
        comment: "Too short",
      })
    ).toThrow()
  })
})
