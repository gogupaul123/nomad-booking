import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppHeader } from "@/components/app-header"
import { ThemeProvider } from "@/components/theme-provider"

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }))
  )
})

function renderHeader(initialEntry: string) {
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AppHeader />
      </MemoryRouter>
    </ThemeProvider>
  )
}

describe("AppHeader", () => {
  it("marks feed as active on the feed route", () => {
    renderHeader("/feed")

    expect(
      screen
        .getAllByRole("link", { name: /feed/i })
        .some((link) => link.getAttribute("aria-current") === "page")
    ).toBe(true)
  })

  it("marks favourites as active on the favourites route", () => {
    renderHeader("/favourites")

    expect(
      screen
        .getAllByRole("link", { name: /favourites/i })
        .some((link) => link.getAttribute("aria-current") === "page")
    ).toBe(true)
  })
})
