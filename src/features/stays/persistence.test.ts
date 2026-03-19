import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  clearStoredStayActivity,
  getStoredStayActivity,
  isStaySaved,
  recordConfirmedBooking,
  recordRecentlyViewedStay,
  toggleSavedStay,
} from "@/features/stays/persistence"
import type { Booking, StayCard } from "@/features/stays/schemas"

const lisbonStay: StayCard = {
  id: "stay_lisbon-loft",
  slug: "lisbon-loft-house",
  name: "Lisbon Loft House",
  location: { city: "Lisbon", country: "Portugal" },
  description:
    "Sunlit loft suites with reliable workstations and calm neighborhood energy.",
  nightlyRate: 164,
  rating: 4.5,
  reviewCount: 2,
  amenities: ["Fast Wi-Fi", "Dedicated desk"],
  availabilityLabel: "Next opening: Mar 28",
  feedCollection: "city-sprints",
  image: {
    src: "https://images.example.com/lisbon.jpg",
    alt: "Lisbon loft interior",
  },
}

const tbilisiStay: StayCard = {
  ...lisbonStay,
  id: "stay_tbilisi-hideout",
  slug: "tbilisi-hideout",
  name: "Tbilisi Hideout",
  location: { city: "Tbilisi", country: "Georgia" },
  image: {
    src: "https://images.example.com/tbilisi.jpg",
    alt: "Tbilisi apartment workspace",
  },
}

const lisbonBooking: Booking = {
  id: "booking_lisbon-loft_1",
  stayId: lisbonStay.id,
  stayName: lisbonStay.name,
  location: lisbonStay.location,
  checkIn: "2026-04-11",
  checkOut: "2026-04-14",
  nights: 3,
  nightlySubtotal: 492,
  cleaningFee: 28,
  serviceFee: 19,
  totalPrice: 539,
  guestName: "Nomad Booking Guest",
  email: "guest@nomad-booking.demo",
  confirmedAt: "2026-03-19T09:20:00.000Z",
}

describe("stay persistence", () => {
  beforeEach(() => {
    localStorage.clear()
    clearStoredStayActivity()
  })

  afterEach(() => {
    localStorage.clear()
    clearStoredStayActivity()
  })

  it("stores recently viewed stays in most recent order without duplicates", () => {
    recordRecentlyViewedStay(lisbonStay)
    recordRecentlyViewedStay(tbilisiStay)
    recordRecentlyViewedStay(lisbonStay)

    expect(
      getStoredStayActivity().recentlyViewed.map((entry) => entry.stay.id)
    ).toEqual([lisbonStay.id, tbilisiStay.id])
  })

  it("adds and removes saved stays", () => {
    expect(toggleSavedStay(lisbonStay)).toBe(true)
    expect(isStaySaved(lisbonStay.id)).toBe(true)
    expect(getStoredStayActivity().saved).toHaveLength(1)

    expect(toggleSavedStay(lisbonStay)).toBe(false)
    expect(isStaySaved(lisbonStay.id)).toBe(false)
    expect(getStoredStayActivity().saved).toHaveLength(0)
  })

  it("stores confirmed bookings with a stay snapshot", () => {
    recordConfirmedBooking(lisbonBooking, lisbonStay)

    expect(getStoredStayActivity().bookings).toHaveLength(1)
    expect(getStoredStayActivity().bookings[0]?.booking.id).toBe(
      lisbonBooking.id
    )
    expect(getStoredStayActivity().bookings[0]?.stay.id).toBe(lisbonStay.id)
  })
})
