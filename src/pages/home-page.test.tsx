import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { HomePage } from "@/pages/home-page"

function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("renders bookings returned by the API", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          bookings: [
            {
              id: "booking_lisbon-loft",
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
              image: {
                src: "https://images.example.com/lisbon.jpg",
                alt: "Lisbon loft interior",
              },
            },
          ],
          availableCities: ["Lisbon"],
          total: 1,
        }),
        { status: 200 }
      )
    )

    renderHomePage()

    expect(
      screen.getByRole("heading", {
        name: /explore bookable stays/i,
      })
    ).toBeInTheDocument()
    expect(await screen.findByText("Lisbon Loft House")).toBeInTheDocument()
  })

  it("shows an empty state when no bookings match", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          bookings: [],
          availableCities: ["Lisbon"],
          total: 0,
        }),
        { status: 200 }
      )
    )

    renderHomePage()

    expect(
      await screen.findByText(/no bookings matched this search/i)
    ).toBeInTheDocument()
  })
})
