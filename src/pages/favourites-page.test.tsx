import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { FavouritesPage } from "@/pages/favourites-page"
import {
  clearStoredStayActivity,
  recordRecentlyViewedStay,
  toggleSavedStay,
} from "@/features/stays/persistence"
import type { StayCard } from "@/features/stays/schemas"

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

describe("FavouritesPage", () => {
  beforeEach(() => {
    clearStoredStayActivity()
    localStorage.clear()
  })

  afterEach(() => {
    clearStoredStayActivity()
    localStorage.clear()
  })

  it("renders recently viewed and saved stays from local storage", () => {
    recordRecentlyViewedStay(lisbonStay)
    toggleSavedStay(tbilisiStay)

    render(
      <MemoryRouter>
        <FavouritesPage />
      </MemoryRouter>
    )

    expect(
      screen.getByRole("heading", { name: /your bookings/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /recently viewed/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /saved stays/i })
    ).toBeInTheDocument()
    expect(screen.getByText("Lisbon Loft House")).toBeInTheDocument()
    expect(screen.getByText("Tbilisi Hideout")).toBeInTheDocument()
  })
})
