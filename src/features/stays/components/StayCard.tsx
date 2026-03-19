import { Link } from "react-router-dom"

import { memo, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FavouriteIcon, StarIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Skeleton } from "@/components/ui/skeleton"
import { AmenityChip } from "@/features/stays/components/AmenityChip"
import {
  toggleSavedStay,
  useIsStaySaved,
} from "@/features/stays/persistence"
import type { StayCard as StayCardData } from "@/features/stays/schemas"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

type StayCardVariant = "normal" | "compact"

type LoadingStayCardProps = {
  isLoading: true
  stay?: never
  variant?: StayCardVariant
  className?: string
}

type ReadyStayCardProps = {
  stay: StayCardData
  isLoading?: false
  variant?: StayCardVariant
  className?: string
}

type StayCardProps = LoadingStayCardProps | ReadyStayCardProps

const favouriteHeartPath =
  "M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"

function formatRating(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function StayCardBody({
  stay,
  variant = "normal",
  favouriteControl,
}: {
  stay?: StayCardData
  variant?: StayCardVariant
  favouriteControl?: ReactNode
}) {
  const visibleAmenities = stay?.amenities.slice(0, 2) ?? []
  const remainingAmenities = stay
    ? Math.max(stay.amenities.length - visibleAmenities.length, 0)
    : 0
  const isCompact = variant === "compact"

  return (
    <div className="space-y-2">
      <div className="relative aspect-[1.05/1] h-auto overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
        {stay ? (
          <>
            <img
              alt={stay.image.alt}
              className="h-full w-full object-cover"
              decoding="async"
              fetchPriority="low"
              loading="lazy"
              src={stay.image.src}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_48%,rgba(15,23,42,0.42)_100%)]" />
            <div className="absolute inset-x-2 top-2 flex min-w-0 items-start gap-1.5">
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
            <div className="absolute bottom-2 left-2 inline-flex items-center justify-end gap-1 rounded-md border border-white/70 bg-white/92 px-2 py-1 leading-none text-slate-800 dark:border-white/10 dark:bg-slate-950/92 dark:text-slate-100">
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
                {formatRating(stay.rating)}
              </span>
            </div>
            {favouriteControl}
          </>
        ) : (
          <Skeleton className="h-full w-full rounded-none" />
        )}
      </div>

      <div className="flex-col justify-center pl-px">
        {stay ? (
          <p
            className={cn(
              "line-clamp-1 font-semibold tracking-[-0.01em] text-foreground",
              isCompact ? "text-xs" : "text-sm"
            )}
          >
            {stay.name}
          </p>
        ) : (
          <Skeleton className="mb-1 h-4 w-2/3 rounded-sm" />
        )}

        {stay ? (
          <p className="line-clamp-1 text-[11px] text-muted-foreground">
            {stay.location.city}, {stay.location.country}
          </p>
        ) : (
          <Skeleton className="mb-1 h-4 w-1/2 rounded-sm" />
        )}

        {stay ? (
          <p className="text-[11px] text-muted-foreground">
            From&nbsp;
            <span className="font-semibold text-foreground">
              {formatCurrency(stay.nightlyRate)}
            </span>
            &nbsp;/ night
          </p>
        ) : (
          <Skeleton className="mb-1 h-4 w-2/5 rounded-sm" />
        )}

        {stay ? (
          <p className="line-clamp-1 text-[11px] text-muted-foreground">
            {stay.availabilityLabel}
          </p>
        ) : (
          <Skeleton className="h-4 w-1/3 rounded-sm" />
        )}
      </div>
    </div>
  )
}

export const StayCard = memo(function StayCard(props: StayCardProps) {
  const stay = props.isLoading ? undefined : props.stay
  const { className, variant = "normal" } = props
  const isFavourite = useIsStaySaved(stay?.id ?? "")

  const cardBody = (
    <StayCardBody
      stay={stay}
      favouriteControl={
        stay ? (
          <button
            aria-label={
              isFavourite ? "Remove from favourites" : "Add to favourites"
            }
            aria-pressed={isFavourite}
            className="group pointer-events-auto absolute right-2 bottom-2 z-20 inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center p-0.5 text-foreground transition-transform duration-150 hover:scale-110 active:scale-95"
            onClick={() => {
              const isSavedNow = toggleSavedStay(stay)

              if (isSavedNow) {
                toast.success("Saved to favourites", {
                  description: `${stay.name} is now in your saved stays.`,
                })
                return
              }

              toast.info("Removed from favourites", {
                description: `${stay.name} was removed from your saved stays.`,
              })
            }}
            type="button"
          >
            <span className="relative inline-flex items-center justify-center">
              <svg
                aria-hidden="true"
                className={cn(
                  "absolute size-7 scale-[0.92] transition-all duration-150",
                  isFavourite
                    ? "text-primary opacity-100"
                    : "text-primary opacity-0"
                )}
                viewBox="0 0 24 24"
              >
                <path d={favouriteHeartPath} fill="currentColor" />
              </svg>
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
        ) : undefined
      }
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
      <div className={cn(stay ? "pointer-events-none" : undefined)}>
        {cardBody}
      </div>
      {stay ? (
        <Link
          aria-label={`View ${stay.name}`}
          className="absolute inset-0 z-10 rounded-[1.8rem] outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          to={`/stays/${stay.id}`}
        />
      ) : (
        <></>
      )}
    </article>
  )
})
