import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { getFirstBookableRange } from "@/features/stays/booking"
import { StayBookingRail } from "@/features/stays/components/StayBookingRail"
import { getStayById } from "@/features/stays/mock-store"
import { formatStayDate } from "@/lib/formatters"

function getCalendarDayButton(date: string) {
  return document.querySelector(
    `[data-day="${new Date(`${date}T00:00:00`).toLocaleDateString("en-US")}"]`
  ) as HTMLButtonElement | null
}

describe("StayBookingRail", () => {
  it("lets you clear dates and then pick check-in followed by check-out", () => {
    const stay = getStayById("stay_vinohrady-task-house")
    const firstRange = getFirstBookableRange(
      stay.availabilityCalendar,
      stay.bookingPolicy
    )

    if (!firstRange) {
      throw new Error("Expected a bookable range for the test stay.")
    }

    render(
      <MemoryRouter>
        <StayBookingRail isMobileViewport={false} stay={stay} />
      </MemoryRouter>
    )

    fireEvent.click(screen.getAllByRole("button", { name: /check-in/i })[1]!)
    fireEvent.click(screen.getByRole("button", { name: /clear dates/i }))

    const checkInButton = getCalendarDayButton(firstRange.checkIn)
    if (!checkInButton) {
      throw new Error("Expected check-in day button to exist.")
    }

    fireEvent.click(checkInButton)

    expect(
      screen.getAllByText(formatStayDate(firstRange.checkIn, "MMM d, yyyy"))
        .length
    ).toBeGreaterThan(0)

    const checkOutButton = getCalendarDayButton(firstRange.checkOut)
    if (!checkOutButton) {
      throw new Error("Expected check-out day button to exist.")
    }

    fireEvent.click(checkOutButton)

    expect(
      screen.getAllByText(formatStayDate(firstRange.checkOut, "MMM d, yyyy"))
        .length
    ).toBeGreaterThan(0)
  })

  it("uses a drawer-based calendar picker on mobile", () => {
    const stay = getStayById("stay_vinohrady-task-house")

    render(
      <MemoryRouter>
        <StayBookingRail isMobileViewport stay={stay} />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole("button", { name: /check-in/i }))

    expect(document.querySelector('[data-slot="drawer-content"]')).not.toBeNull()
    expect(
      screen.getByRole("button", { name: /clear dates/i })
    ).toBeInTheDocument()
  })
})
