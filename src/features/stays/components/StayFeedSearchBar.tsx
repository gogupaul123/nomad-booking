import { Fragment, useEffect, useMemo, useState } from "react"
import type { SetURLSearchParams } from "react-router-dom"
import {
  Cancel01Icon,
  DollarCircleIcon,
  FilterHorizontalIcon,
  FilterResetIcon,
  LockIcon,
  Location01Icon,
  LocationOffline01Icon,
  Search01Icon,
  StarAward01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type {
  StayFilterBounds,
  StaySearchParams,
} from "@/features/stays/schemas"
import { formatCurrency } from "@/lib/formatters"

const SEARCH_DEBOUNCE_MS = 320
const PRICE_STEP = 10
const RATING_STEP = 0.1

function areNumbersEqual(left: number, right: number) {
  return Math.abs(left - right) < 0.001
}

function normalizePriceRange(
  value: readonly number[],
  bounds: StayFilterBounds["price"]
): [number, number] {
  const nextMin = value[0] ?? bounds.min
  const nextMax = value[1] ?? bounds.max

  return [
    Math.max(bounds.min, Math.min(nextMin, nextMax)),
    Math.min(bounds.max, Math.max(nextMin, nextMax)),
  ]
}

function normalizeRatingRange(
  value: readonly number[],
  bounds: StayFilterBounds["rating"]
): [number, number] {
  const nextMin = value[0] ?? bounds.min
  const nextMax = value[1] ?? bounds.max

  return [
    Number(Math.max(bounds.min, Math.min(nextMin, nextMax)).toFixed(1)),
    Number(Math.min(bounds.max, Math.max(nextMin, nextMax)).toFixed(1)),
  ]
}

function getAppliedPriceRange(
  filters: StaySearchParams,
  bounds: StayFilterBounds["price"]
): [number, number] {
  return normalizePriceRange(
    [filters.minPrice ?? bounds.min, filters.maxPrice ?? bounds.max],
    bounds
  )
}

function getAppliedRatingRange(
  filters: StaySearchParams,
  bounds: StayFilterBounds["rating"]
): [number, number] {
  return normalizeRatingRange(
    [filters.minRating ?? bounds.min, filters.maxRating ?? bounds.max],
    bounds
  )
}

function countAppliedFilters(
  city: string | undefined,
  priceRange: [number, number],
  ratingRange: [number, number],
  bounds: StayFilterBounds
) {
  let count = 0

  if (city) {
    count += 1
  }

  if (
    !areNumbersEqual(priceRange[0], bounds.price.min) ||
    !areNumbersEqual(priceRange[1], bounds.price.max)
  ) {
    count += 1
  }

  if (
    !areNumbersEqual(ratingRange[0], bounds.rating.min) ||
    !areNumbersEqual(ratingRange[1], bounds.rating.max)
  ) {
    count += 1
  }

  return count
}

type StayFeedSearchBarProps = {
  availableCities: string[]
  filterBounds: StayFilterBounds
  filters: StaySearchParams
  onQueryDraftChange: (value: string) => void
  queryDraft: string
  searchParams: URLSearchParams
  setSearchParams: SetURLSearchParams
}

type CityOption = {
  label: string
  value: string
}

export function StayFeedSearchBar({
  availableCities,
  filterBounds,
  filters,
  onQueryDraftChange,
  queryDraft,
  searchParams,
  setSearchParams,
}: StayFeedSearchBarProps) {
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [draftCity, setDraftCity] = useState<string | undefined>(filters.city)
  const cityOptions = useMemo<CityOption[]>(
    () =>
      availableCities.map((city) => ({
        label: city,
        value: city,
      })),
    [availableCities]
  )
  const [draftPriceRange, setDraftPriceRange] = useState<[number, number]>(
    getAppliedPriceRange(filters, filterBounds.price)
  )
  const [draftRatingRange, setDraftRatingRange] = useState<[number, number]>(
    getAppliedRatingRange(filters, filterBounds.rating)
  )

  const appliedPriceRange = useMemo(
    () => getAppliedPriceRange(filters, filterBounds.price),
    [filters, filterBounds.price]
  )
  const appliedRatingRange = useMemo(
    () => getAppliedRatingRange(filters, filterBounds.rating),
    [filters, filterBounds.rating]
  )
  const appliedFilterCount = useMemo(
    () =>
      countAppliedFilters(
        filters.city,
        appliedPriceRange,
        appliedRatingRange,
        filterBounds
      ),
    [appliedPriceRange, appliedRatingRange, filterBounds, filters.city]
  )
  const draftFilterCount = useMemo(
    () =>
      countAppliedFilters(draftCity, draftPriceRange, draftRatingRange, filterBounds),
    [draftCity, draftPriceRange, draftRatingRange, filterBounds]
  )
  const selectedCityOption = useMemo(
    () => cityOptions.find((option) => option.value === draftCity),
    [cityOptions, draftCity]
  )
  const cityComboboxKey = useMemo(
    () =>
      `${draftCity ?? ""}::${cityOptions.map((option) => option.value).join("|")}`,
    [cityOptions, draftCity]
  )
  const hasAvailableCities = availableCities.length > 0

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmedQuery = queryDraft.trim()
      const currentQuery = filters.query ?? ""

      if (trimmedQuery === currentQuery) {
        return
      }

      const nextSearchParams = new URLSearchParams(searchParams)

      if (trimmedQuery.length > 0) {
        nextSearchParams.set("query", trimmedQuery)
      } else {
        nextSearchParams.delete("query")
      }

      setSearchParams(nextSearchParams)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [filters.query, queryDraft, searchParams, setSearchParams])

  return (
    <>
      <div className="flex w-full justify-center">
        <InputGroup className="h-13 w-full max-w-3xl rounded-2xl border-border/70 bg-background/92 shadow-[0_18px_40px_-30px_rgba(18,44,73,0.32)]">
          <InputGroupAddon align="inline-start" className="pl-4">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={Search01Icon}
              size={16}
              strokeWidth={1.9}
            />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search stays"
            className="h-full pr-2 text-sm"
            onChange={(event) => {
              onQueryDraftChange(event.target.value)
            }}
            placeholder="Search city, stay, or amenity"
            value={queryDraft}
          />
          <InputGroupAddon align="inline-end" className="pr-2">
            <Button
              aria-label="Open filters"
              className="h-10 rounded-xl px-3"
              onClick={() => {
                setDraftCity(filters.city)
                setDraftPriceRange(appliedPriceRange)
                setDraftRatingRange(appliedRatingRange)
                setIsFilterDialogOpen(true)
              }}
              type="button"
              variant="ghost"
            >
              <HugeiconsIcon
                icon={FilterHorizontalIcon}
                size={16}
                strokeWidth={1.9}
              />
              <span>Filters</span>
              {appliedFilterCount > 0 ? (
                <Badge className="ml-1 h-5 min-w-5 px-1.5" variant="secondary">
                  {appliedFilterCount}
                </Badge>
              ) : null}
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <Dialog
        onOpenChange={(open) => {
          setIsFilterDialogOpen(open)

          if (open) {
            setDraftCity(filters.city)
            setDraftPriceRange(appliedPriceRange)
            setDraftRatingRange(appliedRatingRange)
          }
        }}
        open={isFilterDialogOpen}
      >
        <DialogContent
          className="max-w-xl gap-0 overflow-hidden rounded-[28px] p-0"
          showCloseButton
        >
          <div className="space-y-6 p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Refine stays
              </DialogTitle>
              <DialogDescription>
                Narrow the feed by city, price, and rating. Changes apply only
                when you confirm them.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-2.5">
                <Label className="inline-flex items-center gap-2 text-sm font-medium">
                  <HugeiconsIcon
                    className="text-muted-foreground"
                    icon={Location01Icon}
                    size={16}
                    strokeWidth={1.9}
                  />
                  <span>City</span>
                </Label>
                {hasAvailableCities ? (
                  <Combobox<CityOption>
                    key={cityComboboxKey}
                    autoHighlight
                    defaultValue={selectedCityOption}
                    isItemEqualToValue={(item, value) => item.value === value.value}
                    items={cityOptions}
                    itemToStringLabel={(city) => city.label}
                    itemToStringValue={(city) => city.label}
                    onValueChange={(value) => {
                      setDraftCity(value?.value)
                    }}
                  >
                    <ComboboxInput
                      aria-label="Filter by city"
                      className="h-11 w-full rounded-2xl border-border/70 bg-background/90"
                      placeholder="Filter cities"
                      showClear={Boolean(draftCity)}
                    />
                    <ComboboxContent className="rounded-2xl border border-border/70 bg-background/98 shadow-[0_20px_48px_-28px_rgba(18,44,73,0.35)]">
                      <ComboboxEmpty>No cities match this search.</ComboboxEmpty>
                      <ComboboxList className="p-1.5">
                        {(city, index) => (
                          <Fragment key={city.value}>
                            {index > 0 ? <ComboboxSeparator /> : null}
                            <ComboboxItem value={city}>{city.label}</ComboboxItem>
                          </Fragment>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                ) : (
                  <InputGroup className="h-11 rounded-2xl border-border/60 bg-muted/30 text-muted-foreground">
                    <InputGroupAddon align="inline-start" className="pl-3.5">
                      <HugeiconsIcon
                        className="text-muted-foreground/80"
                        icon={LocationOffline01Icon}
                        size={16}
                        strokeWidth={1.9}
                      />
                    </InputGroupAddon>
                    <InputGroupInput
                      aria-label="No cities available"
                      className="h-full pr-2 text-sm placeholder:text-muted-foreground"
                      disabled
                      placeholder="No cities available"
                      value=""
                    />
                    <InputGroupAddon align="inline-end" className="pr-3.5">
                      <HugeiconsIcon
                        className="text-muted-foreground/70"
                        icon={LockIcon}
                        size={15}
                        strokeWidth={1.9}
                      />
                    </InputGroupAddon>
                  </InputGroup>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label className="inline-flex items-center gap-2 text-sm font-medium">
                    <HugeiconsIcon
                      className="text-muted-foreground"
                      icon={DollarCircleIcon}
                      size={16}
                      strokeWidth={1.9}
                    />
                    <span>Price per night</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(draftPriceRange[0])} -{" "}
                    {formatCurrency(draftPriceRange[1])}
                  </p>
                </div>
                <Slider
                  className="[&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-primary/40 [&_[data-slot=slider-track]]:h-1.5"
                  max={filterBounds.price.max}
                  min={filterBounds.price.min}
                  onValueChange={(value) => {
                    if (!Array.isArray(value)) {
                      return
                    }

                    setDraftPriceRange(
                      normalizePriceRange(value, filterBounds.price)
                    )
                  }}
                  step={PRICE_STEP}
                  value={draftPriceRange}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(filterBounds.price.min)}</span>
                  <span>{formatCurrency(filterBounds.price.max)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label className="inline-flex items-center gap-2 text-sm font-medium">
                    <HugeiconsIcon
                      className="text-muted-foreground"
                      icon={StarAward01Icon}
                      size={16}
                      strokeWidth={1.9}
                    />
                    <span>Rating</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {draftRatingRange[0].toFixed(1)} -{" "}
                    {draftRatingRange[1].toFixed(1)}
                  </p>
                </div>
                <Slider
                  className="[&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-primary/40 [&_[data-slot=slider-track]]:h-1.5"
                  max={filterBounds.rating.max}
                  min={filterBounds.rating.min}
                  onValueChange={(value) => {
                    if (!Array.isArray(value)) {
                      return
                    }

                    setDraftRatingRange(
                      normalizeRatingRange(value, filterBounds.rating)
                    )
                  }}
                  step={RATING_STEP}
                  value={draftRatingRange}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{filterBounds.rating.min.toFixed(1)}</span>
                  <span>{filterBounds.rating.max.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-b-[28px] border-t border-border/60 bg-background px-6 py-5">
            {draftFilterCount > 0 ? (
              <Button
                className="h-12 w-full rounded-2xl text-sm font-semibold"
                onClick={() => {
                  setDraftCity(undefined)
                  setDraftPriceRange([
                    filterBounds.price.min,
                    filterBounds.price.max,
                  ])
                  setDraftRatingRange([
                    filterBounds.rating.min,
                    filterBounds.rating.max,
                  ])
                  const nextSearchParams = new URLSearchParams(searchParams)

                  nextSearchParams.delete("city")
                  nextSearchParams.delete("minPrice")
                  nextSearchParams.delete("maxPrice")
                  nextSearchParams.delete("minRating")
                  nextSearchParams.delete("maxRating")

                  setSearchParams(nextSearchParams)
                  setIsFilterDialogOpen(false)
                }}
                type="button"
                variant="outline"
              >
                <HugeiconsIcon
                  icon={FilterResetIcon}
                  size={16}
                  strokeWidth={1.9}
                />
                Clear
              </Button>
            ) : (
              <DialogClose
                render={
                  <Button
                    className="h-12 w-full rounded-2xl text-sm font-semibold"
                    type="button"
                    variant="outline"
                  />
                }
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={16}
                  strokeWidth={1.9}
                />
                Cancel
              </DialogClose>
            )}

            <Button
              className="h-12 w-full rounded-2xl text-sm font-semibold"
              onClick={() => {
                const nextSearchParams = new URLSearchParams(searchParams)
                const trimmedQuery = queryDraft.trim()

                if (trimmedQuery.length > 0) {
                  nextSearchParams.set("query", trimmedQuery)
                } else {
                  nextSearchParams.delete("query")
                }

                if (draftCity) {
                  nextSearchParams.set("city", draftCity)
                } else {
                  nextSearchParams.delete("city")
                }

                if (!areNumbersEqual(draftPriceRange[0], filterBounds.price.min)) {
                  nextSearchParams.set("minPrice", String(draftPriceRange[0]))
                } else {
                  nextSearchParams.delete("minPrice")
                }

                if (!areNumbersEqual(draftPriceRange[1], filterBounds.price.max)) {
                  nextSearchParams.set("maxPrice", String(draftPriceRange[1]))
                } else {
                  nextSearchParams.delete("maxPrice")
                }

                if (
                  !areNumbersEqual(draftRatingRange[0], filterBounds.rating.min)
                ) {
                  nextSearchParams.set(
                    "minRating",
                    draftRatingRange[0].toFixed(1)
                  )
                } else {
                  nextSearchParams.delete("minRating")
                }

                if (
                  !areNumbersEqual(draftRatingRange[1], filterBounds.rating.max)
                ) {
                  nextSearchParams.set(
                    "maxRating",
                    draftRatingRange[1].toFixed(1)
                  )
                } else {
                  nextSearchParams.delete("maxRating")
                }

                setSearchParams(nextSearchParams)
                setIsFilterDialogOpen(false)
              }}
              type="button"
            >
              <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={1.9} />
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
