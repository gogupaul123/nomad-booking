import { describe, expect, it } from "vitest"

import { getFirstBookableRange } from "@/features/stays/booking"
import {
  addReview,
  createBooking,
  getReviewsByStayId,
  getStayById,
  listStayCards,
} from "@/features/stays/mock-store"

describe("addReview", () => {
  it("returns the newly added review as the most recent review for the stay", () => {
    const review = addReview("stay_bamboo-quiet-retreat", {
      name: "Sam",
      rating: 5,
      comment:
        "The setup made it easy to focus all week, and the stay felt calm and practical the whole time.",
    })

    const reviews = getReviewsByStayId("stay_bamboo-quiet-retreat").reviews

    expect(review.name).toBe("Sam")
    expect(Date.parse(review.createdAt)).toBeLessThanOrEqual(Date.now())
    expect(reviews[0]?.id).toBe(review.id)
    expect(reviews[0]?.name).toBe("Sam")
  })
})

describe("mock stay catalog", () => {
  it("ensures every seeded stay exposes at least 10 reviews", () => {
    const stays = listStayCards({ sort: "rating-high" }).stays

    for (const stay of stays) {
      expect(getReviewsByStayId(stay.id).reviews.length).toBeGreaterThanOrEqual(
        10
      )
    }
  })

  it("resolves a stay by slug as well as id", () => {
    const stay = getStayById("lisbon-loft-house")

    expect(stay.id).toBe("stay_lisbon-loft")
    expect(stay.slug).toBe("lisbon-loft-house")
  })

  it("creates a range booking and stores the selected dates", () => {
    const stay = getStayById("stay_lisbon-loft")
    const range = getFirstBookableRange(stay.availabilityCalendar, stay.bookingPolicy)

    expect(range).not.toBeNull()
    if (!range) {
      throw new Error("Expected an initial bookable range for the seeded stay.")
    }

    const booking = createBooking({
      stayId: stay.id,
      checkIn: range.checkIn,
      checkOut: range.checkOut,
      guestName: "Alex Rivers",
      email: "alex@example.com",
      specialRequests: "Quiet floor if possible.",
    })

    expect(booking.checkIn).toBe(range.checkIn)
    expect(booking.checkOut).toBe(range.checkOut)
    expect(booking.totalPrice).toBe(
      booking.nightlySubtotal +
        booking.cleaningFee +
        booking.serviceFee
    )
  })
})
