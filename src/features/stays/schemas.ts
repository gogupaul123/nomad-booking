import { z } from "zod"

function firstValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value
}

function optionalTrimmedString(maxLength: number) {
  return z.preprocess((value) => {
    const singleValue = firstValue(value)
    if (typeof singleValue !== "string") {
      return undefined
    }

    const trimmedValue = singleValue.trim()
    return trimmedValue.length === 0 ? undefined : trimmedValue
  }, z.string().max(maxLength).optional())
}

function optionalSearchNumber({
  min,
  max,
}: {
  min?: number
  max?: number
}) {
  return z.preprocess((value) => {
    const singleValue = firstValue(value)

    if (
      singleValue === undefined ||
      singleValue === null ||
      singleValue === ""
    ) {
      return undefined
    }

    if (typeof singleValue === "number") {
      return singleValue
    }

    if (typeof singleValue !== "string") {
      return singleValue
    }

    const normalizedValue = Number(singleValue)
    return Number.isFinite(normalizedValue) ? normalizedValue : singleValue
  }, z.number().min(min ?? Number.NEGATIVE_INFINITY).max(max ?? Number.POSITIVE_INFINITY).optional())
}

export const staySearchParamsSchema = z.object({
  query: optionalTrimmedString(80),
  city: optionalTrimmedString(60),
  minPrice: optionalSearchNumber({ min: 0 }),
  maxPrice: optionalSearchNumber({ min: 0 }),
  minRating: optionalSearchNumber({ min: 0, max: 5 }),
  maxRating: optionalSearchNumber({ min: 0, max: 5 }),
  sort: z.preprocess(
    firstValue,
    z
      .enum(["rating-high", "rating-low", "price-high", "price-low"])
      .default("rating-high")
  ),
}).superRefine((value, context) => {
  if (
    value.minPrice !== undefined &&
    value.maxPrice !== undefined &&
    value.minPrice > value.maxPrice
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Minimum price cannot be greater than maximum price.",
      path: ["minPrice"],
    })
  }

  if (
    value.minRating !== undefined &&
    value.maxRating !== undefined &&
    value.minRating > value.maxRating
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Minimum rating cannot be greater than maximum rating.",
      path: ["minRating"],
    })
  }
})

export const checkoutSearchParamsSchema = z.object({
  stayId: z.preprocess(firstValue, z.string().min(1)),
  checkIn: z.preprocess(firstValue, z.iso.date()),
  checkOut: z.preprocess(firstValue, z.iso.date()),
}).superRefine((value, context) => {
  if (value.checkIn >= value.checkOut) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Check-out must be after check-in.",
      path: ["checkOut"],
    })
  }
})

export const stayLocationSchema = z.object({
  city: z.string().min(1),
  country: z.string().min(1),
})

export const stayImageSchema = z.object({
  src: z.string().url(),
  alt: z.string().min(1),
})

export const amenitySchema = z.enum([
  "Fast Wi-Fi",
  "Dedicated desk",
  "Monitor",
  "Ergonomic chair",
  "Phone booth",
  "Standing desk",
  "Self check-in",
  "Breakfast included",
  "Coffee station",
  "Air conditioning",
  "Kitchen",
  "Laundry machine",
  "Gym access",
  "Late check-out",
  "Quiet hours",
  "Swimming pool",
  "Takeout",
])

export const feedCollectionSchema = z.enum([
  "city-sprints",
  "quiet-corners",
  "design-led-stays",
  "long-stay-routines",
  "always-online",
])

export const stayBookingPolicySchema = z.object({
  minNights: z.number().int().min(1).max(30),
  cleaningFee: z.number().nonnegative(),
  serviceFee: z.number().nonnegative(),
})

export const stayAvailabilityEntrySchema = z.object({
  date: z.iso.date(),
  nightlyPrice: z.number().positive(),
  remainingUnits: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
})

export const stayCardSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  location: stayLocationSchema,
  description: z.string().min(1),
  nightlyRate: z.number().positive(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  amenities: z.array(amenitySchema).min(1),
  availabilityLabel: z.string().min(1),
  feedCollection: feedCollectionSchema,
  image: stayImageSchema,
})

export const stayDetailsSchema = stayCardSchema.extend({
  hostType: z.string().min(1),
  cancellationPolicy: z.string().min(1),
  workspaceHighlights: z.array(z.string().min(1)).min(1),
  images: z.array(stayImageSchema).min(1),
  bookingPolicy: stayBookingPolicySchema,
  availabilityCalendar: z.array(stayAvailabilityEntrySchema).min(30),
})

export const reviewSchema = z.object({
  id: z.string().min(1),
  stayId: z.string().min(1),
  name: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
  createdAt: z.iso.datetime(),
})

export const reviewInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "At least 2 characters.")
    .max(40, "Keep the name under 40 characters."),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .min(20, "At least 20 characters.")
    .max(280, "Keep the comment under 280 characters."),
})

export const bookingInputSchema = z.object({
  stayId: z.string().min(1),
  checkIn: z.iso.date(),
  checkOut: z.iso.date(),
  guestName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  specialRequests: z
    .string()
    .trim()
    .max(240)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
}).superRefine((value, context) => {
  if (value.checkIn >= value.checkOut) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Check-out must be after check-in.",
      path: ["checkOut"],
    })
  }
})

export const bookingSchema = z.object({
  id: z.string().min(1),
  stayId: z.string().min(1),
  stayName: z.string().min(1),
  location: stayLocationSchema,
  checkIn: z.iso.date(),
  checkOut: z.iso.date(),
  nights: z.number().int().positive(),
  nightlySubtotal: z.number().nonnegative(),
  cleaningFee: z.number().nonnegative(),
  serviceFee: z.number().nonnegative(),
  totalPrice: z.number().positive(),
  guestName: z.string().min(1),
  email: z.email(),
  confirmedAt: z.iso.datetime(),
})

export const stayFilterBoundsSchema = z.object({
  price: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }),
  rating: z.object({
    min: z.number().min(0).max(5),
    max: z.number().min(0).max(5),
  }),
})

export const stayCardsResponseSchema = z.object({
  stays: z.array(stayCardSchema),
  availableCities: z.array(z.string().min(1)),
  filterBounds: stayFilterBoundsSchema,
  total: z.number().int().nonnegative(),
})

export const reviewsResponseSchema = z.object({
  reviews: z.array(reviewSchema),
})

export const persistedStayEntrySchema = z.object({
  stay: stayCardSchema,
  updatedAt: z.iso.datetime(),
})

export const persistedBookingEntrySchema = z.object({
  booking: bookingSchema,
  stay: stayCardSchema,
  updatedAt: z.iso.datetime(),
})

export const stayActivityStorageSchema = z.object({
  version: z.literal(1),
  recentlyViewed: z.array(persistedStayEntrySchema),
  saved: z.array(persistedStayEntrySchema),
  bookings: z.array(persistedBookingEntrySchema).default([]),
})

export type Amenity = z.infer<typeof amenitySchema>
export type FeedCollection = z.infer<typeof feedCollectionSchema>
export type StayAvailabilityEntry = z.infer<typeof stayAvailabilityEntrySchema>
export type StayBookingPolicy = z.infer<typeof stayBookingPolicySchema>
export type StayCard = z.infer<typeof stayCardSchema>
export type StayDetails = z.infer<typeof stayDetailsSchema>
export type StaySearchParams = z.infer<typeof staySearchParamsSchema>
export type CheckoutSearchParams = z.infer<typeof checkoutSearchParamsSchema>
export type Booking = z.infer<typeof bookingSchema>
export type BookingInput = z.infer<typeof bookingInputSchema>
export type Review = z.infer<typeof reviewSchema>
export type ReviewInput = z.infer<typeof reviewInputSchema>
export type PersistedStayEntry = z.infer<typeof persistedStayEntrySchema>
export type PersistedBookingEntry = z.infer<typeof persistedBookingEntrySchema>
export type StayActivityStorage = z.infer<typeof stayActivityStorageSchema>
export type StayFilterBounds = z.infer<typeof stayFilterBoundsSchema>
