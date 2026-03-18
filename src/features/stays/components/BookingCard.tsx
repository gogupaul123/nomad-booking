import { Link } from "react-router-dom"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FavouriteIcon, StarIcon } from "@hugeicons/core-free-icons"

import { Skeleton } from "@/components/ui/skeleton"
import { AmenityChip } from "@/features/stays/components/AmenityChip"
import type { BookingCard as BookingCardData } from "@/features/stays/schemas"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

type BookingCardVariant = "normal" | "compact"

type LoadingBookingCardProps = {
  isLoading: true
  booking?: never
  variant?: BookingCardVariant
  className?: string
}

type ReadyBookingCardProps = {
  booking: BookingCardData
  isLoading?: false
  variant?: BookingCardVariant
  className?: string
}

type BookingCardProps = LoadingBookingCardProps | ReadyBookingCardProps

function formatRating(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function BookingCardBody({
  booking,
  imageLoaded,
  onImageLoad,
  variant = "normal",
}: {
  booking?: BookingCardData
  imageLoaded: boolean
  onImageLoad: () => void
  variant?: BookingCardVariant
}) {
  const visibleAmenities = booking?.amenities.slice(0, 2) ?? []
  const remainingAmenities = booking
    ? Math.max(booking.amenities.length - visibleAmenities.length, 0)
    : 0
  const isCompact = variant === "compact"

  return (
    <div className="space-y-2">
      <div className="relative aspect-[1.25/1] h-auto overflow-hidden rounded-2xl bg-slate-100 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.45)] dark:bg-slate-900">
        {booking ? (
          <>
            <img
              alt={booking.image.alt}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-300 ease-out",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              onError={onImageLoad}
              onLoad={onImageLoad}
              src={booking.image.src}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_48%,rgba(15,23,42,0.42)_100%)]" />
            <div className="absolute top-2 right-2 inline-flex items-center justify-end gap-1 rounded-md bg-white/92 px-2 py-1 leading-none text-slate-800 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.6)] backdrop-blur-sm dark:bg-slate-950/88 dark:text-slate-100">
              <span className="inline-flex items-center justify-center leading-none">
                <HugeiconsIcon
                  className="shrink-0 text-slate-700 dark:text-slate-200"
                  icon={StarIcon}
                  size={11}
                  strokeWidth={2}
                />
              </span>
              <span
                className={cn(
                  "inline-flex items-center justify-center leading-none font-medium",
                  "text-[11px]"
                )}
              >
                {formatRating(booking.rating)}
              </span>
            </div>
            <div className="absolute inset-x-2 bottom-2 flex min-w-0 items-center gap-1.5">
              {visibleAmenities.map((amenity, index) => (
                <AmenityChip
                  amenity={amenity}
                  className={cn(
                    index === 0
                      ? cn("max-w-[10rem]", isCompact && "max-w-[8.5rem]")
                      : "min-w-0 flex-1"
                  )}
                  key={amenity}
                  suffix={
                    index === 1 && remainingAmenities > 0
                      ? `+${remainingAmenities}`
                      : undefined
                  }
                />
              ))}
            </div>
          </>
        ) : (
          <Skeleton className="h-full w-full rounded-none" />
        )}
      </div>

      <div className="flex-col justify-center pl-px">
        {booking ? (
          <p
            className={cn(
              "line-clamp-1 font-semibold tracking-[-0.01em] text-foreground",
              isCompact ? "text-sm" : "text-md"
            )}
          >
            {booking.name}
          </p>
        ) : (
          <Skeleton className="mb-1 h-4 w-2/3 rounded-sm" />
        )}

        {booking ? (
          <p className="line-clamp-1 text-[11px] text-muted-foreground">
            {booking.location.city}, {booking.location.country}
          </p>
        ) : (
          <Skeleton className="mb-1 h-4 w-1/2 rounded-sm" />
        )}

        {booking ? (
          <p className="text-[11px] text-muted-foreground">
            From&nbsp;
            <span className="font-semibold text-foreground">
              {formatCurrency(booking.nightlyRate)}
            </span>
            &nbsp;/ night
          </p>
        ) : (
          <Skeleton className="h-4 w-2/5 rounded-sm" />
        )}

        {booking ? (
          <p className="line-clamp-1 text-[11px] text-muted-foreground">
            {booking.availabilityLabel}
          </p>
        ) : (
          <Skeleton className="h-4 w-1/3 rounded-sm" />
        )}
      </div>
    </div>
  )
}

export function BookingCard(props: BookingCardProps) {
  const [loadedImageSrc, setLoadedImageSrc] = useState<string | null>(null)
  const [isFavourite, setIsFavourite] = useState(false)
  const booking = props.isLoading ? undefined : props.booking
  const { className, variant = "normal" } = props
  const imageLoaded = Boolean(
    booking?.image.src && loadedImageSrc === booking.image.src
  )

  const cardBody = (
    <BookingCardBody
      booking={booking}
      imageLoaded={imageLoaded}
      onImageLoad={() => {
        if (booking) {
          setLoadedImageSrc(booking.image.src)
        }
      }}
      variant={variant}
    />
  )

  return (
    <article
      className={cn(
        "relative w-full",
        variant === "compact" ? "max-w-[10.5rem]" : "max-w-60",
        className
      )}
    >
      {booking ? (
        <button
          aria-label={
            isFavourite ? "Remove from favourites" : "Add to favourites"
          }
          aria-pressed={isFavourite}
          className="group absolute top-2 left-2 z-10 inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center p-0.5 text-foreground transition-transform duration-150 hover:scale-110 active:scale-95"
          onClick={() => {
            setIsFavourite((current) => !current)
          }}
          type="button"
        >
          <span className="relative inline-flex items-center justify-center">
            <HugeiconsIcon
              className="absolute text-foreground/15"
              icon={FavouriteIcon}
              size={26}
              strokeWidth={1.9}
            />
            <HugeiconsIcon
              className={cn(
                isFavourite
                  ? "text-primary"
                  : "text-white group-hover:text-primary"
              )}
              icon={FavouriteIcon}
              size={26}
              strokeWidth={1.9}
            />
          </span>
        </button>
      ) : null}
      {booking ? (
        <Link
          aria-label={`View ${booking.name}`}
          className="group block h-full w-full rounded-[1.8rem] outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          to={`/bookings/${booking.id}`}
        >
          {cardBody}
        </Link>
      ) : (
        cardBody
      )}
    </article>
  )
}
