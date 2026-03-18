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

  it("renders stays returned by the API", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          stays: [
            {
              id: "stay_lisbon-loft",
              slug: "lisbon-loft-house",
              name: "Lisbon Loft House",
              location: { city: "Lisbon", country: "Portugal" },
              tagline: "Sunlit loft suites two streets away from a calm cafe.",
              nightlyRate: 164,
              rating: 4.5,
              reviewCount: 2,
              tags: ["City pulse"],
              remoteWorkPerks: ["500 Mbps Wi-Fi"],
              availabilityLabel: "Next opening: Mar 28",
              visual: {
                gradient: "linear-gradient(135deg, #123456, #abcdef)",
                eyebrow: "Atlantic focus",
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
        name: /book focused stays with hotel polish and remote-work amenities/i,
      })
    ).toBeInTheDocument()
    expect(await screen.findByText("Lisbon Loft House")).toBeInTheDocument()
  })

  it("shows an empty state when no stays match", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          stays: [],
          availableCities: ["Lisbon"],
          total: 0,
        }),
        { status: 200 }
      )
    )

    renderHomePage()

    expect(
      await screen.findByText(/no stays matched this search/i)
    ).toBeInTheDocument()
  })
})
