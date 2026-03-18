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

export const bookingSearchParamsSchema = z.object({
  query: optionalTrimmedString(80),
  city: optionalTrimmedString(60),
  sort: z.preprocess(
    firstValue,
    z.enum(["recommended", "price-low", "rating"]).default("recommended")
  ),
})

export const checkoutSearchParamsSchema = z.object({
  bookingId: z.preprocess(firstValue, z.string().min(1)),
  slotId: z.preprocess(firstValue, z.string().min(1)),
})

export const bookingLocationSchema = z.object({
  city: z.string().min(1),
  country: z.string().min(1),
})

export const bookingImageSchema = z.object({
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

export const availabilitySlotSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  checkIn: z.iso.datetime(),
  checkOut: z.iso.datetime(),
  remainingUnits: z.number().int().nonnegative(),
  totalPrice: z.number().positive(),
  isAvailable: z.boolean(),
})

export const bookingCardSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  location: bookingLocationSchema,
  description: z.string().min(1),
  nightlyRate: z.number().positive(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  amenities: z.array(amenitySchema).min(1),
  availabilityLabel: z.string().min(1),
  image: bookingImageSchema,
})

export const bookingDetailsSchema = bookingCardSchema.extend({
  hostType: z.string().min(1),
  cancellationPolicy: z.string().min(1),
  workspaceHighlights: z.array(z.string().min(1)).min(1),
  images: z.array(bookingImageSchema).min(1),
  availabilitySlots: z.array(availabilitySlotSchema).min(1),
})

export const reviewSchema = z.object({
  id: z.string().min(1),
  bookingId: z.string().min(1),
  author: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
  createdAt: z.iso.datetime(),
})

export const reviewInputSchema = z.object({
  author: z.string().trim().min(2).max(40),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(20).max(280),
})

export const reservationInputSchema = z.object({
  bookingId: z.string().min(1),
  slotId: z.string().min(1),
  guestName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  specialRequests: z
    .string()
    .trim()
    .max(240)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
})

export const reservationSchema = z.object({
  id: z.string().min(1),
  bookingId: z.string().min(1),
  bookingName: z.string().min(1),
  slotLabel: z.string().min(1),
  location: bookingLocationSchema,
  totalPrice: z.number().positive(),
  guestName: z.string().min(1),
  email: z.email(),
  confirmedAt: z.iso.datetime(),
})

export const bookingCardsResponseSchema = z.object({
  bookings: z.array(bookingCardSchema),
  availableCities: z.array(z.string().min(1)),
  total: z.number().int().nonnegative(),
})

export const reviewsResponseSchema = z.object({
  reviews: z.array(reviewSchema),
})

export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>
export type Amenity = z.infer<typeof amenitySchema>
export type BookingCard = z.infer<typeof bookingCardSchema>
export type BookingDetails = z.infer<typeof bookingDetailsSchema>
export type BookingSearchParams = z.infer<typeof bookingSearchParamsSchema>
export type CheckoutSearchParams = z.infer<typeof checkoutSearchParamsSchema>
export type Reservation = z.infer<typeof reservationSchema>
export type ReservationInput = z.infer<typeof reservationInputSchema>
export type Review = z.infer<typeof reviewSchema>
export type ReviewInput = z.infer<typeof reviewInputSchema>
