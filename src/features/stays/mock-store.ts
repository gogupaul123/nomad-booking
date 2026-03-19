import {
  getMinimumAvailableNightlyPrice,
  getNextAvailableCheckIn,
  getStayBookingQuote,
} from "./booking.js"
import {
  stayCardsResponseSchema,
  stayDetailsSchema,
  bookingSchema,
  reviewSchema,
  reviewsResponseSchema,
  stayAvailabilityEntrySchema,
  type FeedCollection,
  type StayCard,
  type StayDetails,
  type StayFilterBounds,
  type StaySearchParams,
  type Booking,
  type BookingInput,
  type Review,
  type ReviewInput,
  type StayBookingPolicy,
} from "./schemas.js"

type StayRecord = Omit<
  StayDetails,
  "rating" | "reviewCount" | "nightlyRate" | "availabilityLabel"
> & {
  baseNightlyRate: number
  reviews: Review[]
}

const feedCollections: FeedCollection[] = [
  "city-sprints",
  "quiet-corners",
  "design-led-stays",
  "long-stay-routines",
  "always-online",
]

const dateLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})
const REVIEW_DAY_MS = 24 * 60 * 60 * 1000
const reviewSeedAnchor = Date.now() - 2 * 60 * 60 * 1000

function recentReviewTimestamp(daysAgo: number, hour: number, minute: number) {
  const date = new Date(reviewSeedAnchor - daysAgo * REVIEW_DAY_MS)
  date.setUTCHours(hour, minute, 0, 0)
  return date.toISOString()
}

const generatedImagePool = [
  {
    src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    alt: "Refined suite with lounge seating and soft daylight.",
  },
  {
    src: "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
    alt: "Apartment living room with editorial styling and warm tones.",
  },
  {
    src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    alt: "Hotel-style room with layered bedding and bright windows.",
  },
  {
    src: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    alt: "Open kitchen and dining nook designed for longer stays.",
  },
  {
    src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    alt: "Comfortable modern home exterior at sunset.",
  },
  {
    src: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80",
    alt: "Quiet courtyard with natural textures and seating.",
  },
  {
    src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    alt: "Minimal bedroom and desk area with soft neutral styling.",
  },
  {
    src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    alt: "Polished residence interior with a calm palette.",
  },
]

const deskReadySeeds = [
  ["Barcelona", "Spain", "Eixample Desk Loft"],
  ["Tallinn", "Estonia", "Port Workspace Suites"],
  ["Seoul", "South Korea", "Mapo Focus Residence"],
  ["Prague", "Czech Republic", "Vinohrady Task House"],
  ["Vienna", "Austria", "Neubau Work Atelier"],
  ["Bucharest", "Romania", "Riverline Studio Stay"],
  ["Rotterdam", "Netherlands", "Harbor Desk Club"],
  ["Warsaw", "Poland", "Powisle Sprint House"],
  ["Mexico City", "Mexico", "Roma Norte Work Flat"],
  ["Cape Town", "South Africa", "Kloof Street Desk Rooms"],
  ["Taipei", "Taiwan", "Da'an Maker Suites"],
] as const

const quietFocusSeeds = [
  ["Kyoto", "Japan", "Gion Quiet House"],
  ["Ljubljana", "Slovenia", "Riverside Silence Suites"],
  ["Porto", "Portugal", "Cedofeita Calm Residence"],
  ["Ghent", "Belgium", "Canal Stillness Rooms"],
  ["Ubud", "Indonesia", "Bamboo Quiet Retreat"],
  ["Valencia", "Spain", "Ruzafa Listening House"],
  ["Split", "Croatia", "Stone Lane Quiet Stay"],
  ["Brasov", "Romania", "Old Town Slow Rooms"],
  ["Oaxaca", "Mexico", "Courtyard Hush House"],
  ["Chiang Mai", "Thailand", "Nimman Pause Suites"],
  ["Reykjavik", "Iceland", "Harbor Silence Stay"],
] as const

const longStaySeeds = [
  ["Budapest", "Hungary", "Pantry House Budapest"],
  ["Krakow", "Poland", "Wawel Extended Loft"],
  ["Belgrade", "Serbia", "Dorcol Long Stay Loft"],
  ["Canggu", "Indonesia", "Surf & Settle Suites"],
  ["Buenos Aires", "Argentina", "Palermo Pantry Club"],
  ["Athens", "Greece", "Koukaki Monthhouse"],
  ["Istanbul", "Turkey", "Moda Home Base"],
  ["Lima", "Peru", "Barranco Living Rooms"],
  ["Marrakech", "Morocco", "Medina Courtyard Stay"],
  ["Sofia", "Bulgaria", "Vitosha Residence Club"],
  ["Ho Chi Minh City", "Vietnam", "Saigon Monthly Loft"],
] as const

const fastWifiSeeds = [
  ["Dubai", "United Arab Emirates", "Marina Signal Suites"],
  ["Singapore", "Singapore", "Orchard Velocity Rooms"],
  ["Amsterdam", "Netherlands", "De Pijp Fibre House"],
  ["Tokyo", "Japan", "Shibuya Bandwidth Stay"],
  ["Berlin", "Germany", "Kreuzberg Network Loft"],
  ["Los Angeles", "United States", "Silver Lake Sync Suites"],
  ["Doha", "Qatar", "West Bay Fibre Club"],
  ["Sydney", "Australia", "Surry Hills Signal Studio"],
  ["Dublin", "Ireland", "Docklands Gigabit Rooms"],
  ["Toronto", "Canada", "Queen West Online House"],
  ["Vilnius", "Lithuania", "Old Town Fastlane Suites"],
] as const

type GeneratedCategory = "desk-ready" | "quiet-focus" | "long-stay" | "fast-wifi"

function slugify(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildGeneratedImages(seedIndex: number) {
  return Array.from({ length: 3 }, (_, offset) => {
    return generatedImagePool[(seedIndex + offset) % generatedImagePool.length]
  })
}

function getFeedCollection(index: number) {
  return feedCollections[index % feedCollections.length]
}

function optimizeCardImage(src: string) {
  return src
    .replace("w=1200", "w=640")
    .replace("w=1000", "w=640")
    .replace("q=80", "q=70")
}

function compareStaysBySort(
  left: StayRecord,
  right: StayRecord,
  sort: StaySearchParams["sort"]
) {
  const leftRating = getRatingMeta(left.id)
  const rightRating = getRatingMeta(right.id)
  const leftStartingPrice =
    getMinimumAvailableNightlyPrice(left.availabilityCalendar) ??
    left.baseNightlyRate
  const rightStartingPrice =
    getMinimumAvailableNightlyPrice(right.availabilityCalendar) ??
    right.baseNightlyRate

  if (sort === "rating-low") {
    return (
      leftRating.rating - rightRating.rating ||
      rightRating.reviewCount - leftRating.reviewCount ||
      leftStartingPrice - rightStartingPrice
    )
  }

  if (sort === "price-high") {
    return (
      rightStartingPrice - leftStartingPrice ||
      rightRating.rating - leftRating.rating ||
      rightRating.reviewCount - leftRating.reviewCount
    )
  }

  if (sort === "price-low") {
    return (
      leftStartingPrice - rightStartingPrice ||
      rightRating.rating - leftRating.rating ||
      rightRating.reviewCount - leftRating.reviewCount
    )
  }

  return (
    rightRating.rating - leftRating.rating ||
    rightRating.reviewCount - leftRating.reviewCount ||
    leftStartingPrice - rightStartingPrice
  )
}

function isoCalendarDateFromOffset(offset: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

function buildBookingPolicy(
  cleaningFee: number,
  serviceFee: number
) {
  return {
    minNights: 1,
    cleaningFee,
    serviceFee,
  } satisfies StayBookingPolicy
}

function buildAvailabilityCalendar(
  baseNightlyRate: number,
  openingOffset: number,
  inventorySeed: number
) {
  const horizonDays = 150

  return Array.from({ length: horizonDays }, (_, index) => {
    const dayOffset = openingOffset + index
    const isWeekend = dayOffset % 7 === 4 || dayOffset % 7 === 5
    const pricingWave = ((inventorySeed + index) % 9) - 4
    const nightlyPrice = Math.max(
      1,
      Math.round(
        baseNightlyRate *
          (isWeekend ? 1.18 : 1) *
          (1 + pricingWave * 0.025)
      )
    )
    const beforeOpening = index < openingOffset
    const maintenanceBlock =
      !beforeOpening &&
      ((index + inventorySeed) % 23 === 0 || (index + inventorySeed) % 23 === 1)
    const soldOutBlock =
      !beforeOpening &&
      ((index + inventorySeed) % 31 === 9 || (index + inventorySeed) % 31 === 10)
    const remainingUnits = beforeOpening
      ? 0
      : maintenanceBlock || soldOutBlock
        ? 0
        : 1 + ((index + inventorySeed) % 4 === 0 ? 1 : 0)

    return stayAvailabilityEntrySchema.parse({
      date: isoCalendarDateFromOffset(index),
      nightlyPrice,
      remainingUnits,
      isAvailable: remainingUnits > 0,
    })
  })
}

function generatedAmenities(category: GeneratedCategory, index: number) {
  if (category === "desk-ready") {
    return [
      "Dedicated desk",
      index % 2 === 0 ? "Monitor" : "Standing desk",
      "Ergonomic chair",
      "Self check-in",
      index % 3 === 0 ? "Breakfast included" : "Air conditioning",
      index % 2 === 0 ? "Late check-out" : "Gym access",
    ] satisfies StayDetails["amenities"]
  }

  if (category === "quiet-focus") {
    return [
      index % 2 === 0 ? "Quiet hours" : "Phone booth",
      "Self check-in",
      "Air conditioning",
      index % 3 === 0 ? "Breakfast included" : "Gym access",
      index % 2 === 0 ? "Swimming pool" : "Takeout",
    ] satisfies StayDetails["amenities"]
  }

  if (category === "long-stay") {
    return [
      "Kitchen",
      "Laundry machine",
      "Coffee station",
      "Self check-in",
      index % 2 === 0 ? "Late check-out" : "Breakfast included",
      "Air conditioning",
    ] satisfies StayDetails["amenities"]
  }

  return [
    "Fast Wi-Fi",
    "Self check-in",
    "Air conditioning",
    index % 2 === 0 ? "Breakfast included" : "Gym access",
    index % 3 === 0 ? "Swimming pool" : "Takeout",
    index % 2 === 0 ? "Late check-out" : "Breakfast included",
  ] satisfies StayDetails["amenities"]
}

function generatedDescription(
  category: GeneratedCategory,
  city: string,
  name: string
) {
  if (category === "desk-ready") {
    return `${name} in ${city} is built for focused work weeks, with intentional desk setups, polished interiors, and a confident city-stay feel.`
  }

  if (category === "quiet-focus") {
    return `${name} brings a softer pace to ${city}, balancing calm nights, quieter corners, and a restorative atmosphere for solo travel.`
  }

  if (category === "long-stay") {
    return `${name} is arranged for routine-heavy trips in ${city}, with the practical comforts that make a multi-week stay feel easy instead of improvised.`
  }

  return `${name} keeps you online and moving in ${city}, with reliable connectivity, polished check-in flow, and a sharper short-stay energy.`
}

function generatedHighlights(category: GeneratedCategory) {
  if (category === "desk-ready") {
    return [
      "Desk zones designed for all-day laptop work",
      "Task lighting and cable-friendly furniture",
      "Easy late arrivals without host coordination",
    ]
  }

  if (category === "quiet-focus") {
    return [
      "Calm room acoustics with low evening noise",
      "Spaces that support reading, reflection, and calls",
      "Gentler pace than a typical city stay",
    ]
  }

  if (category === "long-stay") {
    return [
      "Kitchen setup that actually supports routine cooking",
      "Laundry and storage designed for longer visits",
      "Flexible checkout rhythm for rolling schedules",
    ]
  }

  return [
    "Strong upload speeds across the full unit",
    "Check-in flow built for quick arrivals",
    "Reliable signal for short-notice remote weeks",
  ]
}

function generatedHostType(category: GeneratedCategory, index: number) {
  const hostTypes = {
    "desk-ready": [
      "Work-forward boutique stay",
      "Serviced loft residence",
      "Design apartment hotel",
    ],
    "quiet-focus": [
      "Quiet guesthouse suites",
      "Courtyard residence",
      "Slow-stay townhouse",
    ],
    "long-stay": [
      "Extended-stay apartment",
      "Residence club",
      "Monthly stay suites",
    ],
    "fast-wifi": [
      "Modern city hotel",
      "Express residence",
      "Tech-forward stay",
    ],
  } as const

  return hostTypes[category][index % hostTypes[category].length]
}

function generatedCancellationPolicy(category: GeneratedCategory) {
  if (category === "quiet-focus") {
    return "Free cancellation up to 24 hours before check-in."
  }

  if (category === "long-stay") {
    return "Free cancellation up to 5 days before check-in."
  }

  return "Free cancellation up to 72 hours before check-in."
}

function generatedReviewComment(
  category: GeneratedCategory,
  city: string,
  name: string
) {
  if (category === "desk-ready") {
    return `${name} made my ${city} work sprint feel easy. The setup felt intentional, and I never had to improvise a place to take calls or focus.`
  }

  if (category === "quiet-focus") {
    return `I booked ${name} in ${city} when I needed a calmer stretch of travel, and it delivered exactly that without feeling isolated or flat.`
  }

  if (category === "long-stay") {
    return `${name} in ${city} handled the rhythm of a longer stay really well. Cooking, laundry, and day-to-day routine all felt built in instead of patched together.`
  }

  return `The connection at ${name} in ${city} was consistent the whole trip, which made it an easy yes for meetings, uploads, and short-deadline work.`
}

const generatedNightlyRatesByCategory: Record<
  GeneratedCategory,
  readonly number[]
> = {
  "desk-ready": [72, 96, 121, 148, 176, 205, 235, 268, 302, 338, 375],
  "quiet-focus": [1, 19, 32, 47, 61, 78, 95, 113, 132, 154, 179],
  "long-stay": [88, 118, 149, 181, 214, 248, 283, 319, 356, 394, 433],
  "fast-wifi": [159, 194, 228, 264, 301, 339, 378, 418, 459, 482, 500],
}

const generatedReviewProfiles: readonly (readonly number[])[] = [
  [],
  [1],
  [2],
  [3],
  [4],
  [5],
  [4, 5],
  [2, 4],
  [1, 3, 5],
  [],
  [5, 5, 4],
]

const reviewAuthorPool = [
  "Ava",
  "Mateo",
  "Nina",
  "Jules",
  "Omar",
  "Leah",
  "Sofia",
  "Kai",
  "Mara",
  "Theo",
  "Iris",
  "Noah",
] as const

const supplementalReviewTemplates = [
  "The stay felt polished from check-in to checkout, and it was easy to keep a steady remote-work rhythm the whole time.",
  "I could move between focus blocks and downtime naturally here, which made the trip feel calmer and more sustainable.",
  "The setup worked well for calls, deep work, and evenings in, so I never felt like I was compromising on routine.",
  "I booked this for a focused stretch of travel and it delivered the right balance of comfort, quiet, and practical details.",
  "Everything felt intentional instead of improvised, especially the day-to-day details that matter once you settle in.",
  "It handled a work-heavy week really well and still felt like a place I wanted to come back to after logging off.",
] as const

function getGeneratedNightlyRate(category: GeneratedCategory, index: number) {
  return generatedNightlyRatesByCategory[category][index]
}

function buildGeneratedReviews(
  category: GeneratedCategory,
  city: string,
  name: string,
  stayId: string,
  index: number
) {
  const profile = generatedReviewProfiles[index]

  return profile.map((rating, reviewIndex) => ({
    id: `review_${stayId}_${reviewIndex + 1}`,
    stayId,
    name: ["Ava", "Mateo", "Nina", "Jules", "Omar", "Leah"][
      (index + reviewIndex) % 6
    ],
    rating,
    comment: generatedReviewComment(category, city, name),
    createdAt: recentReviewTimestamp(42 + index + reviewIndex, 9, 0),
  }))
}

function supplementalReviewTimestamp(staySeedIndex: number, reviewIndex: number) {
  return recentReviewTimestamp(
    20 + staySeedIndex + reviewIndex,
    8 + (reviewIndex % 7),
    15
  )
}

function supplementalReviewComment(stay: Pick<StayRecord, "location" | "name">, reviewIndex: number) {
  const template =
    supplementalReviewTemplates[
      reviewIndex % supplementalReviewTemplates.length
    ]

  return `${template} ${stay.name} in ${stay.location.city} stood out for how easy it was to stay in sync with the trip.`
}

function supplementalReviewRating(staySeedIndex: number, reviewIndex: number) {
  const ratingCycle = [5, 4, 5, 4, 3, 5, 4, 5, 4, 5, 3, 4]
  return ratingCycle[(staySeedIndex + reviewIndex) % ratingCycle.length]
}

function ensureMinimumReviews(stay: StayRecord, staySeedIndex: number) {
  const nextReviews = [...stay.reviews]
  const minimumReviews = 10

  for (let reviewIndex = nextReviews.length; reviewIndex < minimumReviews; reviewIndex += 1) {
    nextReviews.push(
      reviewSchema.parse({
        id: `review_${stay.id}_generated_${reviewIndex + 1}`,
        stayId: stay.id,
        name: reviewAuthorPool[(staySeedIndex + reviewIndex) % reviewAuthorPool.length],
        rating: supplementalReviewRating(staySeedIndex, reviewIndex),
        comment: supplementalReviewComment(stay, reviewIndex),
        createdAt: supplementalReviewTimestamp(staySeedIndex, reviewIndex),
      })
    )
  }

  return {
    ...stay,
    reviews: nextReviews,
  }
}

function createGeneratedStays(
  category: GeneratedCategory,
  seeds: readonly (readonly [string, string, string])[],
  openingOffsetStart: number,
  feedCollectionOffsetStart: number
): StayRecord[] {
  return seeds.map(([city, country, name], index) => {
    const slug = slugify(name)
    const stayId = `stay_${slug}`
    const baseNightlyRate = getGeneratedNightlyRate(category, index)
    const openingOffset = openingOffsetStart + index
    const images = buildGeneratedImages(openingOffset)

    return {
      id: stayId,
      slug,
      name,
      location: {
        city,
        country,
      },
      description: generatedDescription(category, city, name),
      baseNightlyRate,
      amenities: generatedAmenities(category, index),
      feedCollection: getFeedCollection(feedCollectionOffsetStart + index),
      image: images[0],
      images,
      hostType: generatedHostType(category, index),
      cancellationPolicy: generatedCancellationPolicy(category),
      workspaceHighlights: generatedHighlights(category),
      bookingPolicy: buildBookingPolicy(
        Math.max(12, Math.round(baseNightlyRate * 0.18)),
        Math.max(8, Math.round(baseNightlyRate * 0.12))
      ),
      availabilityCalendar: buildAvailabilityCalendar(
        baseNightlyRate,
        openingOffset,
        openingOffset + feedCollectionOffsetStart
      ),
      reviews: buildGeneratedReviews(category, city, name, stayId, index),
    }
  })
}

const generatedStayRecords = [
  ...createGeneratedStays("desk-ready", deskReadySeeds, 2, 0),
  ...createGeneratedStays("quiet-focus", quietFocusSeeds, 14, 11),
  ...createGeneratedStays("long-stay", longStaySeeds, 26, 22),
  ...createGeneratedStays("fast-wifi", fastWifiSeeds, 38, 33),
]

const rawStayRecords: StayRecord[] = [
  {
    id: "stay_lisbon-loft",
    slug: "lisbon-loft-house",
    name: "Lisbon Loft House",
    location: {
      city: "Lisbon",
      country: "Portugal",
    },
    description:
      "Sunlit loft suites with reliable workstations, warm design, and easy access to a calm neighborhood cafe.",
    baseNightlyRate: 468,
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
    feedCollection: "always-online",
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
    bookingPolicy: buildBookingPolicy(72, 38),
    availabilityCalendar: buildAvailabilityCalendar(468, 10, 3),
    reviews: [
      {
        id: "review_lisbon_1",
        stayId: "stay_lisbon-loft",
        name: "Maya",
        rating: 5,
        comment:
          "The desk setup felt intentional instead of decorative, and the morning light made it easy to settle into work quickly.",
        createdAt: recentReviewTimestamp(16, 8, 0),
      },
      {
        id: "review_lisbon_2",
        stayId: "stay_lisbon-loft",
        name: "Jon",
        rating: 4,
        comment:
          "Great coffee partnership downstairs and a surprisingly quiet street for central Lisbon. I would absolutely book it again for a short sprint.",
        createdAt: recentReviewTimestamp(10, 10, 30),
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
    description:
      "A hillside residence built for longer work trips, with flexible layouts, calmer evenings, and polished extended-stay comforts.",
    baseNightlyRate: 64,
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
    feedCollection: "city-sprints",
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
    bookingPolicy: buildBookingPolicy(18, 12),
    availabilityCalendar: buildAvailabilityCalendar(64, 12, 7),
    reviews: [
      {
        id: "review_medellin_1",
        stayId: "stay_medellin-sky",
        name: "Tara",
        rating: 2,
        comment:
          "I booked for product planning week and the space handled both deep work and team calls without stress. The air and the view were a bonus.",
        createdAt: recentReviewTimestamp(19, 15, 10),
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
    description:
      "Editorial-style studios centered around a courtyard lounge, calm work rhythms, and a softer budget without losing useful amenities.",
    baseNightlyRate: 12,
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
    feedCollection: "quiet-corners",
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
    bookingPolicy: buildBookingPolicy(14, 9),
    availabilityCalendar: buildAvailabilityCalendar(12, 14, 11),
    reviews: [],
  },
  ...generatedStayRecords,
]

const stayRecords: StayRecord[] = rawStayRecords.map((stay, index) =>
  ensureMinimumReviews(stay, index)
)

const bookings: Booking[] = []

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

const stayFilterBounds: StayFilterBounds = {
  price: {
    min: 1,
    max: 500,
  },
  rating: {
    min: 0,
    max: 5,
  },
}

function getStartingNightlyPrice(record: StayRecord) {
  return (
    getMinimumAvailableNightlyPrice(record.availabilityCalendar) ??
    record.baseNightlyRate
  )
}

function getAvailabilityLabel(record: StayRecord) {
  const nextAvailableCheckIn = getNextAvailableCheckIn(
    record.availabilityCalendar,
    record.bookingPolicy
  )

  if (!nextAvailableCheckIn) {
    return "No upcoming availability"
  }

  return `Next opening: ${dateLabelFormatter.format(new Date(nextAvailableCheckIn))}`
}

function toStayCard(record: StayRecord): StayCard {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    location: record.location,
    description: record.description,
    nightlyRate: getStartingNightlyPrice(record),
    amenities: record.amenities,
    availabilityLabel: getAvailabilityLabel(record),
    feedCollection: record.feedCollection,
    image: {
      ...record.image,
      src: optimizeCardImage(record.image.src),
    },
    ...getRatingMeta(record.id),
  }
}

function toStayDetails(record: StayRecord): StayDetails {
  return stayDetailsSchema.parse({
    ...toStayCard(record),
    hostType: record.hostType,
    cancellationPolicy: record.cancellationPolicy,
    workspaceHighlights: record.workspaceHighlights,
    images: record.images,
    bookingPolicy: record.bookingPolicy,
    availabilityCalendar: record.availabilityCalendar,
  })
}

export function listStayCards(filters: StaySearchParams) {
  const normalizedQuery = filters.query?.toLocaleLowerCase()
  const normalizedCity = filters.city?.toLocaleLowerCase()

  let filtered = stayRecords.filter((record) => {
    const rating = getRatingMeta(record.id).rating
    const startingNightlyPrice = getStartingNightlyPrice(record)

    if (
      normalizedCity &&
      record.location.city.toLocaleLowerCase() !== normalizedCity
    ) {
      return false
    }

    if (
      filters.minPrice !== undefined &&
      startingNightlyPrice < filters.minPrice
    ) {
      return false
    }

    if (
      filters.maxPrice !== undefined &&
      startingNightlyPrice > filters.maxPrice
    ) {
      return false
    }

    if (filters.minRating !== undefined && rating < filters.minRating) {
      return false
    }

    if (filters.maxRating !== undefined && rating > filters.maxRating) {
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

  filtered = [...filtered].sort((left, right) =>
    compareStaysBySort(left, right, filters.sort)
  )

  return stayCardsResponseSchema.parse({
    stays: filtered.map(toStayCard),
    availableCities: Array.from(
      new Set(stayRecords.map((record) => record.location.city))
    ).sort((left, right) => left.localeCompare(right)),
    filterBounds: stayFilterBounds,
    total: filtered.length,
  })
}

export function getStayById(stayId: string) {
  const stay = stayRecords.find((record) => record.id === stayId)

  if (!stay) {
    throw new StoreError("Stay not found.", 404)
  }

  return toStayDetails(stay)
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
    name: input.name,
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

  const quote = getStayBookingQuote(
    stay.availabilityCalendar,
    stay.bookingPolicy,
    input.checkIn,
    input.checkOut
  )

  if (!quote) {
    throw new StoreError("Those dates are no longer available.")
  }

  stay.availabilityCalendar = stay.availabilityCalendar.map((entry) => {
    if (!quote.nightDates.includes(entry.date)) {
      return entry
    }

    const remainingUnits = Math.max(entry.remainingUnits - 1, 0)

    return {
      ...entry,
      remainingUnits,
      isAvailable: remainingUnits > 0,
    }
  })

  const booking = bookingSchema.parse({
    id: `booking_${bookings.length + 1}`,
    stayId: stay.id,
    stayName: stay.name,
    location: stay.location,
    checkIn: quote.checkIn,
    checkOut: quote.checkOut,
    nights: quote.nights,
    nightlySubtotal: quote.nightlySubtotal,
    cleaningFee: quote.cleaningFee,
    serviceFee: quote.serviceFee,
    totalPrice: quote.totalPrice,
    guestName: input.guestName,
    email: input.email,
    confirmedAt: new Date().toISOString(),
  })

  bookings.unshift(booking)
  return booking
}
