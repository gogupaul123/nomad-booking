import {
  bookingCardsResponseSchema,
  bookingDetailsSchema,
  reservationSchema,
  reviewSchema,
  reviewsResponseSchema,
  type BookingCard,
  type BookingDetails,
  type BookingSearchParams,
  type Reservation,
  type ReservationInput,
  type Review,
  type ReviewInput,
} from "@/features/stays/schemas"

type BookingRecord = Omit<BookingDetails, "rating" | "reviewCount"> & {
  reviews: Review[]
}

function isoDate(day: string) {
  return `${day}T15:00:00.000Z`
}

const bookingRecords: BookingRecord[] = [
  {
    id: "booking_lisbon-loft",
    slug: "lisbon-loft-house",
    name: "Lisbon Loft House",
    location: {
      city: "Lisbon",
      country: "Portugal",
    },
    description:
      "Sunlit loft suites with reliable workstations, warm design, and easy access to a calm neighborhood cafe.",
    nightlyRate: 164,
    amenities: [
      "Fast Wi-Fi",
      "Dedicated desk",
      "Monitor",
      "Ergonomic chair",
      "Self check-in",
      "Coffee station",
      "Air conditioning",
      "Kitchen",
      "Laundry machine",
      "Quiet hours",
    ],
    availabilityLabel: "Next opening: Mar 28",
    image: {
      src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
      alt: "Warm Lisbon loft living room with desk and natural light.",
    },
    images: [
      {
        src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
        alt: "Warm Lisbon loft living room with desk and natural light.",
      },
      {
        src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        alt: "Minimal bedroom with soft tones and boutique styling.",
      },
      {
        src: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
        alt: "Kitchen and dining nook inside a modern apartment stay.",
      },
    ],
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
        bookingId: "booking_lisbon-loft",
        author: "Maya",
        rating: 5,
        comment:
          "The desk setup felt intentional instead of decorative, and the morning light made it easy to settle into work quickly.",
        createdAt: "2026-03-05T08:00:00.000Z",
      },
      {
        id: "review_lisbon_2",
        bookingId: "booking_lisbon-loft",
        author: "Jon",
        rating: 4,
        comment:
          "Great coffee partnership downstairs and a surprisingly quiet street for central Lisbon. I would absolutely book it again for a short sprint.",
        createdAt: "2026-03-11T10:30:00.000Z",
      },
    ],
  },
  {
    id: "booking_medellin-sky",
    slug: "medellin-sky-residence",
    name: "Medellin Sky Residence",
    location: {
      city: "Medellin",
      country: "Colombia",
    },
    description:
      "A hillside residence built for longer work trips, with flexible layouts, calmer evenings, and polished extended-stay comforts.",
    nightlyRate: 138,
    amenities: [
      "Fast Wi-Fi",
      "Standing desk",
      "Monitor",
      "Phone booth",
      "Ergonomic chair",
      "Late check-out",
      "Gym access",
      "Breakfast included",
      "Laundry machine",
      "Air conditioning",
    ],
    availabilityLabel: "Next opening: Mar 30",
    image: {
      src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      alt: "Bright bedroom and lounge in a serviced residence.",
    },
    images: [
      {
        src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        alt: "Bright bedroom and lounge in a serviced residence.",
      },
      {
        src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        alt: "Modern suite interior with layered textures.",
      },
      {
        src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
        alt: "Open-plan lounge with mountain-city atmosphere.",
      },
    ],
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
        bookingId: "booking_medellin-sky",
        author: "Tara",
        rating: 5,
        comment:
          "I booked for product planning week and the space handled both deep work and team calls without stress. The air and the view were a bonus.",
        createdAt: "2026-03-02T15:10:00.000Z",
      },
    ],
  },
  {
    id: "booking_tbilisi-courtyard",
    slug: "tbilisi-courtyard-studios",
    name: "Tbilisi Courtyard Studios",
    location: {
      city: "Tbilisi",
      country: "Georgia",
    },
    description:
      "Editorial-style studios centered around a courtyard lounge, calm work rhythms, and a softer budget without losing useful amenities.",
    nightlyRate: 119,
    amenities: [
      "Fast Wi-Fi",
      "Dedicated desk",
      "Self check-in",
      "Coffee station",
      "Kitchen",
      "Laundry machine",
      "Quiet hours",
      "Late check-out",
      "Air conditioning",
    ],
    availabilityLabel: "Next opening: Apr 1",
    image: {
      src: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
      alt: "Design-led studio kitchen and lounge with warm textures.",
    },
    images: [
      {
        src: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
        alt: "Design-led studio kitchen and lounge with warm textures.",
      },
      {
        src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        alt: "Private room with refined, calm styling.",
      },
      {
        src: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80",
        alt: "Shared courtyard space arranged for quiet work and tea.",
      },
    ],
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
        bookingId: "booking_tbilisi-courtyard",
        author: "Rina",
        rating: 4,
        comment:
          "The place feels more curated than corporate, which I appreciated. I only wish I had booked the longer slot before it sold out.",
        createdAt: "2026-03-08T13:45:00.000Z",
      },
      {
        id: "review_tbilisi_2",
        bookingId: "booking_tbilisi-courtyard",
        author: "Ben",
        rating: 5,
        comment:
          "Beautiful interiors, excellent tea, and the host guide actually surfaced useful spots to work from after checkout.",
        createdAt: "2026-03-12T11:05:00.000Z",
      },
    ],
  },
]

const reservations: Reservation[] = []

export class StoreError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "StoreError"
    this.status = status
  }
}

function getReviewsForBooking(bookingId: string) {
  const booking = bookingRecords.find((record) => record.id === bookingId)

  if (!booking) {
    throw new StoreError("Booking not found.", 404)
  }

  return [...booking.reviews].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt)
  )
}

function getRatingMeta(bookingId: string) {
  const reviews = getReviewsForBooking(bookingId)
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

function toBookingCard(record: BookingRecord): BookingCard {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    location: record.location,
    description: record.description,
    nightlyRate: record.nightlyRate,
    amenities: record.amenities,
    availabilityLabel: record.availabilityLabel,
    image: record.image,
    ...getRatingMeta(record.id),
  }
}

function toBookingDetails(record: BookingRecord): BookingDetails {
  return bookingDetailsSchema.parse({
    ...toBookingCard(record),
    hostType: record.hostType,
    cancellationPolicy: record.cancellationPolicy,
    workspaceHighlights: record.workspaceHighlights,
    images: record.images,
    availabilitySlots: record.availabilitySlots,
  })
}

export function listBookingCards(filters: BookingSearchParams) {
  const normalizedQuery = filters.query?.toLocaleLowerCase()
  const normalizedCity = filters.city?.toLocaleLowerCase()

  let filtered = bookingRecords.filter((record) => {
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
      record.description,
      ...record.amenities,
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

  return bookingCardsResponseSchema.parse({
    bookings: filtered.map(toBookingCard),
    availableCities: Array.from(
      new Set(bookingRecords.map((record) => record.location.city))
    ).sort((left, right) => left.localeCompare(right)),
    total: filtered.length,
  })
}

export function getBookingById(bookingId: string) {
  const booking = bookingRecords.find((record) => record.id === bookingId)

  if (!booking) {
    throw new StoreError("Booking not found.", 404)
  }

  return toBookingDetails(booking)
}

export function getReviewsByBookingId(bookingId: string) {
  return reviewsResponseSchema.parse({
    reviews: getReviewsForBooking(bookingId),
  })
}

export function addReview(bookingId: string, input: ReviewInput) {
  const booking = bookingRecords.find((record) => record.id === bookingId)

  if (!booking) {
    throw new StoreError("Booking not found.", 404)
  }

  const review = reviewSchema.parse({
    id: `review_${booking.reviews.length + 1}_${Date.now()}`,
    bookingId,
    author: input.author,
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date().toISOString(),
  })

  booking.reviews.unshift(review)
  return review
}

export function createReservation(input: ReservationInput) {
  const booking = bookingRecords.find((record) => record.id === input.bookingId)

  if (!booking) {
    throw new StoreError("Booking not found.", 404)
  }

  const slot = booking.availabilitySlots.find(
    (candidate) => candidate.id === input.slotId
  )

  if (!slot) {
    throw new StoreError("Availability slot not found.", 404)
  }

  if (!slot.isAvailable || slot.remainingUnits === 0) {
    throw new StoreError("That slot just sold out. Pick another option.")
  }

  slot.remainingUnits -= 1
  slot.isAvailable = slot.remainingUnits > 0

  const reservation = reservationSchema.parse({
    id: `reservation_${reservations.length + 1}`,
    bookingId: booking.id,
    bookingName: booking.name,
    slotLabel: slot.label,
    location: booking.location,
    totalPrice: slot.totalPrice,
    guestName: input.guestName,
    email: input.email,
    confirmedAt: new Date().toISOString(),
  })

  reservations.unshift(reservation)
  return reservation
}
