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

export const staySearchParamsSchema = z.object({
  query: optionalTrimmedString(80),
  city: optionalTrimmedString(60),
  sort: z.preprocess(
    firstValue,
    z.enum(["recommended", "price-low", "rating"]).default("recommended")
  ),
})

export const checkoutSearchParamsSchema = z.object({
  stayId: z.preprocess(firstValue, z.string().min(1)),
  slotId: z.preprocess(firstValue, z.string().min(1)),
})

export const stayLocationSchema = z.object({
  city: z.string().min(1),
  country: z.string().min(1),
})

export const stayVisualSchema = z.object({
  gradient: z.string().min(1),
  eyebrow: z.string().min(1),
})

export const availabilitySlotSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  checkIn: z.iso.datetime(),
  checkOut: z.iso.datetime(),
  remainingUnits: z.number().int().nonnegative(),
  totalPrice: z.number().positive(),
  isAvailable: z.boolean(),
})

export const staySummarySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  location: stayLocationSchema,
  tagline: z.string().min(1),
  nightlyRate: z.number().positive(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  tags: z.array(z.string().min(1)).min(1),
  remoteWorkPerks: z.array(z.string().min(1)).min(1),
  availabilityLabel: z.string().min(1),
  visual: stayVisualSchema,
})

export const stayDetailSchema = staySummarySchema.extend({
  description: z.string().min(1),
  hostType: z.string().min(1),
  cancellationPolicy: z.string().min(1),
  workspaceHighlights: z.array(z.string().min(1)).min(1),
  availabilitySlots: z.array(availabilitySlotSchema).min(1),
})

export const reviewSchema = z.object({
  id: z.string().min(1),
  stayId: z.string().min(1),
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

export const bookingInputSchema = z.object({
  stayId: z.string().min(1),
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

export const bookingConfirmationSchema = z.object({
  id: z.string().min(1),
  stayId: z.string().min(1),
  stayName: z.string().min(1),
  slotLabel: z.string().min(1),
  location: stayLocationSchema,
  totalPrice: z.number().positive(),
  guestName: z.string().min(1),
  email: z.string().email(),
  confirmedAt: z.iso.datetime(),
})

export const staysResponseSchema = z.object({
  stays: z.array(staySummarySchema),
  availableCities: z.array(z.string().min(1)),
  total: z.number().int().nonnegative(),
})

export const reviewsResponseSchema = z.object({
  reviews: z.array(reviewSchema),
})

export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>
export type BookingConfirmation = z.infer<typeof bookingConfirmationSchema>
export type BookingInput = z.infer<typeof bookingInputSchema>
export type CheckoutSearchParams = z.infer<typeof checkoutSearchParamsSchema>
export type Review = z.infer<typeof reviewSchema>
export type ReviewInput = z.infer<typeof reviewInputSchema>
export type StayDetail = z.infer<typeof stayDetailSchema>
export type StaySearchParams = z.infer<typeof staySearchParamsSchema>
export type StaySummary = z.infer<typeof staySummarySchema>
