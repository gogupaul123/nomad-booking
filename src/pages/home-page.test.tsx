import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { HomePage } from "@/pages/home-page"

const mockFilterBounds = {
  price: {
    min: 1,
    max: 500,
  },
  rating: {
    min: 0,
    max: 5,
  },
}

function renderHomePage(initialEntries: string[] = ["/feed"]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
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
            },
          ],
          availableCities: ["Lisbon"],
          filterBounds: mockFilterBounds,
          total: 1,
        }),
        { status: 200 }
      )
    )

    renderHomePage()

    expect(
      screen.getByRole("heading", {
        name: /city sprints/i,
      })
    ).toBeInTheDocument()
    expect((await screen.findAllByText("Lisbon Loft House")).length).toBeGreaterThan(0)
  })

  it("shows the search empty state when no stays match", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          stays: [],
          availableCities: ["Lisbon"],
          filterBounds: mockFilterBounds,
          total: 0,
        }),
        { status: 200 }
      )
    )

    renderHomePage(["/feed?query=quiet"])

    expect(
      await screen.findByText(/no results found/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/try a different city, widen the filters, or search with a broader term/i)
    ).toBeInTheDocument()
  })

  it("passes the selected sort to the server and renders the feed header", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          stays: [],
          availableCities: ["Lisbon"],
          filterBounds: mockFilterBounds,
          total: 0,
        }),
        { status: 200 }
      )
    )

    renderHomePage(["/feed?sort=price-high"])

    expect(screen.getByText(/suggested results/i)).toBeInTheDocument()
    expect(
      screen.getByText(/showing international stays results/i)
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/stays?sort=price-high",
        expect.anything()
      )
    })
  })

  it("debounces search input changes and refetches with the query", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          stays: [],
          availableCities: ["Lisbon", "Tbilisi"],
          filterBounds: mockFilterBounds,
          total: 0,
        }),
        { status: 200 }
      )
    )

    renderHomePage()

    fireEvent.change(screen.getByRole("textbox", { name: /search stays/i }), {
      target: { value: "quiet" },
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        "/api/stays?query=quiet",
        expect.anything()
      )
    })
  })

  it("passes city and range filters to the server", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          stays: [],
          availableCities: ["Lisbon", "Tbilisi"],
          filterBounds: mockFilterBounds,
          total: 0,
        }),
        { status: 200 }
      )
    )

    renderHomePage([
      "/feed?city=Lisbon&minPrice=120&maxPrice=220&minRating=4.2&maxRating=4.8",
    ])

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        "/api/stays?city=Lisbon&minPrice=120&maxPrice=220&minRating=4.2&maxRating=4.8",
        expect.anything()
      )
    })
  })

  it("keeps the feed in row mode when filters are applied without a search query", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          stays: [
            {
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
            },
          ],
          availableCities: ["Lisbon"],
          filterBounds: mockFilterBounds,
          total: 1,
        }),
        { status: 200 }
      )
    )

    renderHomePage(["/feed?city=Lisbon&minPrice=120"])

    expect(
      await screen.findByRole("heading", { name: /city sprints/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: /search results/i })
    ).not.toBeInTheDocument()
  })

  it("clears filters immediately and closes the dialog", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          stays: [],
          availableCities: ["Lisbon", "Tbilisi"],
          filterBounds: mockFilterBounds,
          total: 0,
        }),
        { status: 200 }
      )
    )

    renderHomePage(["/feed?city=Lisbon&minPrice=120&maxPrice=220"])

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }))
    fireEvent.click(await screen.findByRole("button", { name: /clear/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith("/api/stays", expect.anything())
    })

    await waitFor(() => {
      expect(screen.queryByText(/refine stays/i)).not.toBeInTheDocument()
    })
  })

  it("shows the full city combobox list inside the filters dialog", async () => {
    let resolveResponse: ((value: Response) => void) | undefined

    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveResponse = resolve
      })
    )

    renderHomePage()

    await act(async () => {
      resolveResponse?.(
        new Response(
          JSON.stringify({
            stays: [],
            availableCities: ["Lisbon", "Tbilisi"],
            filterBounds: mockFilterBounds,
            total: 0,
          }),
          { status: 200 }
        )
      )
    })

    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /open filters/i }))
    })
    expect(await screen.findByText(/refine stays/i)).toBeInTheDocument()

    const cityCombobox = await screen.findByRole("combobox", {
      name: /filter by city/i,
    })

    await act(async () => {
      cityCombobox.focus()
      fireEvent.click(cityCombobox)
      fireEvent.keyDown(cityCombobox, { key: "ArrowDown" })
    })

    await waitFor(() => {
      expect(screen.getByText("Lisbon")).toBeInTheDocument()
      expect(screen.getByText("Tbilisi")).toBeInTheDocument()
    })
    expect(
      screen.queryByText(/no cities match this search/i)
    ).not.toBeInTheDocument()
    expect(screen.queryByText("All cities")).not.toBeInTheDocument()
  })

  it("disables the city field when no cities are available", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          stays: [],
          availableCities: [],
          filterBounds: mockFilterBounds,
          total: 0,
        }),
        { status: 200 }
      )
    )

    renderHomePage()

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }))

    const unavailableCityInput = await screen.findByPlaceholderText(
      /no cities available/i
    )

    expect(unavailableCityInput).toBeDisabled()
    expect(
      screen.queryByRole("combobox", { name: /filter by city/i })
    ).not.toBeInTheDocument()
  })

  it("refreshes the city combobox when feed data arrives after the dialog is already open", async () => {
    let resolveResponse: ((value: Response) => void) | undefined

    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveResponse = resolve
      })
    )

    renderHomePage()

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /open filters/i }))
    })
    expect(await screen.findByText(/refine stays/i)).toBeInTheDocument()

    await act(async () => {
      resolveResponse?.(
        new Response(
          JSON.stringify({
            stays: [],
            availableCities: ["Lisbon", "Tbilisi"],
            filterBounds: mockFilterBounds,
            total: 0,
          }),
          { status: 200 }
        )
      )
    })

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: /filter by city/i })
      ).toBeInTheDocument()
    })

    const cityCombobox = screen.getByRole("combobox", { name: /filter by city/i })

    await act(async () => {
      cityCombobox.focus()
      fireEvent.click(cityCombobox)
      fireEvent.keyDown(cityCombobox, { key: "ArrowDown" })
    })

    await waitFor(() => {
      expect(screen.getByText("Lisbon")).toBeInTheDocument()
      expect(screen.getByText("Tbilisi")).toBeInTheDocument()
    })
  })
})
