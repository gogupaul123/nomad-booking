import {
  bookingConfirmationSchema,
  reviewSchema,
  reviewsResponseSchema,
  stayDetailSchema,
  staysResponseSchema,
  type BookingConfirmation,
  type BookingInput,
  type Review,
  type ReviewInput,
  type StayDetail,
  type StaySearchParams,
  type StaySummary,
} from "@/features/stays/schemas"

type StayRecord = Omit<StayDetail, "rating" | "reviewCount"> & {
  reviews: Review[]
}

function isoDate(day: string) {
  return `${day}T15:00:00.000Z`
}

const stayRecords: StayRecord[] = [
  {
    id: "stay_lisbon-loft",
    slug: "lisbon-loft-house",
    name: "Lisbon Loft House",
    location: {
      city: "Lisbon",
      country: "Portugal",
    },
    tagline: "Sunlit loft suites two streets away from a calm neighborhood cafe.",
    nightlyRate: 164,
    tags: ["City pulse", "Quiet nights", "Walkable"],
    remoteWorkPerks: ["500 Mbps Wi-Fi", "Monitor on request", "Coffee bar"],
    availabilityLabel: "Next opening: Mar 28",
    visual: {
      gradient:
        "linear-gradient(135deg, rgba(27,103,170,0.95), rgba(148,201,255,0.72) 48%, rgba(255,225,171,0.92))",
      eyebrow: "Atlantic focus",
    },
    description:
      "A compact but polished stay designed for people who split their day between focused work blocks and long neighborhood walks. Every room includes a desk setup, acoustic curtains, and easy access to coworking add-ons.",
    hostType: "Boutique apartment hotel",
    cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
    workspaceHighlights: [
      "Dedicated desk with task lighting",
      "Reserved quiet floor after 22:00",
      "Partner cafe with breakfast bundle",
    ],
    availabilitySlots: [
      {
        id: "slot_lisbon_1",
        label: "3 nights",
        checkIn: isoDate("2026-03-28"),
        checkOut: isoDate("2026-03-31"),
        remainingUnits: 2,
        totalPrice: 492,
        isAvailable: true,
      },
      {
        id: "slot_lisbon_2",
        label: "5 nights",
        checkIn: isoDate("2026-04-02"),
        checkOut: isoDate("2026-04-07"),
        remainingUnits: 1,
        totalPrice: 820,
        isAvailable: true,
      },
    ],
    reviews: [
      {
        id: "review_lisbon_1",
        stayId: "stay_lisbon-loft",
        author: "Maya",
        rating: 5,
        comment:
          "The desk setup felt intentional instead of decorative, and the morning light made it easy to settle into work quickly.",
        createdAt: "2026-03-05T08:00:00.000Z",
      },
      {
        id: "review_lisbon_2",
        stayId: "stay_lisbon-loft",
        author: "Jon",
        rating: 4,
        comment:
          "Great coffee partnership downstairs and a surprisingly quiet street for central Lisbon. I would absolutely book it again for a short sprint.",
        createdAt: "2026-03-11T10:30:00.000Z",
      },
    ],
  },
  {
    id: "stay_medellin-sky",
    slug: "medellin-sky-residence",
    name: "Medellin Sky Residence",
    location: {
      city: "Medellin",
      country: "Colombia",
    },
    tagline:
      "A hillside residence with cool evenings, standing desks, and late check-out.",
    nightlyRate: 138,
    tags: ["Mountain air", "Team friendly", "Extended stays"],
    remoteWorkPerks: ["Standing desk", "4K monitor", "Sound-treated calls booth"],
    availabilityLabel: "Next opening: Mar 30",
    visual: {
      gradient:
        "linear-gradient(135deg, rgba(20,76,115,0.96), rgba(115,205,186,0.75) 45%, rgba(255,234,195,0.88))",
      eyebrow: "Cloudline calm",
    },
    description:
      "Built for longer stays, this property mixes apartment privacy with hotel-grade service. Guests can book wellness mornings, shared dinners, and same-day monitor delivery without leaving the app.",
    hostType: "Serviced residence",
    cancellationPolicy: "Free cancellation up to 72 hours before check-in.",
    workspaceHighlights: [
      "Dual-zone lighting for day and night work",
      "Weekly community breakfast for remote workers",
      "Ergonomic chair in every suite",
    ],
    availabilitySlots: [
      {
        id: "slot_medellin_1",
        label: "4 nights",
        checkIn: isoDate("2026-03-30"),
        checkOut: isoDate("2026-04-03"),
        remainingUnits: 3,
        totalPrice: 552,
        isAvailable: true,
      },
      {
        id: "slot_medellin_2",
        label: "7 nights",
        checkIn: isoDate("2026-04-08"),
        checkOut: isoDate("2026-04-15"),
        remainingUnits: 1,
        totalPrice: 966,
        isAvailable: true,
      },
    ],
    reviews: [
      {
        id: "review_medellin_1",
        stayId: "stay_medellin-sky",
        author: "Tara",
        rating: 5,
        comment:
          "I booked for product planning week and the space handled both deep work and team calls without stress. The air and the view were a bonus.",
        createdAt: "2026-03-02T15:10:00.000Z",
      },
    ],
  },
  {
    id: "stay_tbilisi-courtyard",
    slug: "tbilisi-courtyard-studios",
    name: "Tbilisi Courtyard Studios",
    location: {
      city: "Tbilisi",
      country: "Georgia",
    },
    tagline:
      "Editorial-style studios built around a courtyard lounge and all-day tea room.",
    nightlyRate: 119,
    tags: ["Design-led", "Budget smart", "Courtyard social"],
    remoteWorkPerks: ["Fast mesh Wi-Fi", "Tea lounge", "Printer access"],
    availabilityLabel: "Next opening: Apr 1",
    visual: {
      gradient:
        "linear-gradient(135deg, rgba(89,55,136,0.94), rgba(242,181,166,0.82) 52%, rgba(255,240,222,0.92))",
      eyebrow: "Courtyard rhythm",
    },
    description:
      "For travelers who want character without sacrificing reliability, these studios pair warm interiors with practical work amenities. The courtyard becomes a social workspace in the afternoons and a quiet reading space by evening.",
    hostType: "Design hostel-private suites",
    cancellationPolicy: "Free cancellation up to 24 hours before check-in.",
    workspaceHighlights: [
      "Private booths bookable in two-hour blocks",
      "Tea and snack pantry included",
      "Host-curated neighborhood guide for nomads",
    ],
    availabilitySlots: [
      {
        id: "slot_tbilisi_1",
        label: "3 nights",
        checkIn: isoDate("2026-04-01"),
        checkOut: isoDate("2026-04-04"),
        remainingUnits: 2,
        totalPrice: 357,
        isAvailable: true,
      },
      {
        id: "slot_tbilisi_2",
        label: "6 nights",
        checkIn: isoDate("2026-04-10"),
        checkOut: isoDate("2026-04-16"),
        remainingUnits: 0,
        totalPrice: 714,
        isAvailable: false,
      },
    ],
    reviews: [
      {
        id: "review_tbilisi_1",
        stayId: "stay_tbilisi-courtyard",
        author: "Rina",
        rating: 4,
        comment:
          "The place feels more curated than corporate, which I appreciated. I only wish I had booked the longer slot before it sold out.",
        createdAt: "2026-03-08T13:45:00.000Z",
      },
      {
        id: "review_tbilisi_2",
        stayId: "stay_tbilisi-courtyard",
        author: "Ben",
        rating: 5,
        comment:
          "Beautiful interiors, excellent tea, and the host guide actually surfaced useful spots to work from after checkout.",
        createdAt: "2026-03-12T11:05:00.000Z",
      },
    ],
  },
]

const bookings: BookingConfirmation[] = []

export class StoreError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "StoreError"
    this.status = status
  }
}

function getReviewsForStay(stayId: string) {
  const stay = stayRecords.find((record) => record.id === stayId)

  if (!stay) {
    throw new StoreError("Stay not found.", 404)
  }

  return [...stay.reviews].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt)
  )
}

function getRatingMeta(stayId: string) {
  const reviews = getReviewsForStay(stayId)
  const reviewCount = reviews.length
  const totalRating = reviews.reduce(
    (sum: number, review: Review) => sum + review.rating,
    0
  )

  return {
    reviewCount,
    rating:
      reviewCount === 0
        ? 0
        : Number((totalRating / reviewCount).toFixed(reviewCount > 2 ? 1 : 0)),
  }
}

function toSummary(record: StayRecord): StaySummary {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    location: record.location,
    tagline: record.tagline,
    nightlyRate: record.nightlyRate,
    tags: record.tags,
    remoteWorkPerks: record.remoteWorkPerks,
    availabilityLabel: record.availabilityLabel,
    visual: record.visual,
    ...getRatingMeta(record.id),
  }
}

function toDetail(record: StayRecord): StayDetail {
  return stayDetailSchema.parse({
    ...toSummary(record),
    description: record.description,
    hostType: record.hostType,
    cancellationPolicy: record.cancellationPolicy,
    workspaceHighlights: record.workspaceHighlights,
    availabilitySlots: record.availabilitySlots,
  })
}

export function listStays(filters: StaySearchParams) {
  const normalizedQuery = filters.query?.toLocaleLowerCase()
  const normalizedCity = filters.city?.toLocaleLowerCase()

  let filtered = stayRecords.filter((record) => {
    if (
      normalizedCity &&
      record.location.city.toLocaleLowerCase() !== normalizedCity
    ) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    const searchableText = [
      record.name,
      record.location.city,
      record.location.country,
      record.tagline,
      ...record.tags,
      ...record.remoteWorkPerks,
    ]
      .join(" ")
      .toLocaleLowerCase()

    return searchableText.includes(normalizedQuery)
  })

  filtered = [...filtered].sort((left, right) => {
    if (filters.sort === "price-low") {
      return left.nightlyRate - right.nightlyRate
    }

    if (filters.sort === "rating") {
      return getRatingMeta(right.id).rating - getRatingMeta(left.id).rating
    }

    const leftScore =
      getRatingMeta(left.id).rating * 10 + getRatingMeta(left.id).reviewCount
    const rightScore =
      getRatingMeta(right.id).rating * 10 + getRatingMeta(right.id).reviewCount

    return rightScore - leftScore
  })

  return staysResponseSchema.parse({
    stays: filtered.map(toSummary),
    availableCities: Array.from(
      new Set(stayRecords.map((record) => record.location.city))
    ).sort((left, right) => left.localeCompare(right)),
    total: filtered.length,
  })
}

export function getStayById(stayId: string) {
  const stay = stayRecords.find((record) => record.id === stayId)

  if (!stay) {
    throw new StoreError("Stay not found.", 404)
  }

  return toDetail(stay)
}

export function getReviewsByStayId(stayId: string) {
  return reviewsResponseSchema.parse({
    reviews: getReviewsForStay(stayId),
  })
}

export function addReview(stayId: string, input: ReviewInput) {
  const stay = stayRecords.find((record) => record.id === stayId)

  if (!stay) {
    throw new StoreError("Stay not found.", 404)
  }

  const review = reviewSchema.parse({
    id: `review_${stay.reviews.length + 1}_${Date.now()}`,
    stayId,
    author: input.author,
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date().toISOString(),
  })

  stay.reviews.unshift(review)
  return review
}

export function createBooking(input: BookingInput) {
  const stay = stayRecords.find((record) => record.id === input.stayId)

  if (!stay) {
    throw new StoreError("Stay not found.", 404)
  }

  const slot = stay.availabilitySlots.find((candidate) => candidate.id === input.slotId)

  if (!slot) {
    throw new StoreError("Availability slot not found.", 404)
  }

  if (!slot.isAvailable || slot.remainingUnits === 0) {
    throw new StoreError("That slot just sold out. Pick another option.")
  }

  slot.remainingUnits -= 1
  slot.isAvailable = slot.remainingUnits > 0

  const confirmation = bookingConfirmationSchema.parse({
    id: `booking_${bookings.length + 1}`,
    stayId: stay.id,
    stayName: stay.name,
    slotLabel: slot.label,
    location: stay.location,
    totalPrice: slot.totalPrice,
    guestName: input.guestName,
    email: input.email,
    confirmedAt: new Date().toISOString(),
  })

  bookings.unshift(confirmation)
  return confirmation
}
