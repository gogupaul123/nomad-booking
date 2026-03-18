import { Fragment, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CloudAlertIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useSearchParams } from "react-router-dom"
import {
  CoinsDollarIcon,
  ComputerDesk01Icon,
  DollarCircleIcon,
  HomeWifiIcon,
  KitchenUtensilsIcon,
  Moon02Icon,
  Sorting01Icon,
  Search01Icon,
  StarAward01Icon,
  StarHalfIcon,
} from "@hugeicons/core-free-icons"

import { parseStaySearchParams } from "@/features/stays/api-client"
import { HorizontalStaysRow } from "@/features/stays/components/HorizontalStaysRow"
import { StayFeedSearchBar } from "@/features/stays/components/StayFeedSearchBar"
import { stayCardsQueryOptions } from "@/features/stays/query-options"
import type { FeedCollection, StayFilterBounds } from "@/features/stays/schemas"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const defaultFeedRows = [
  {
    key: "city-sprints",
    title: "City sprints",
    icon: StarAward01Icon,
  },
  {
    key: "quiet-corners",
    title: "Quiet corners",
    icon: Moon02Icon,
  },
  {
    key: "design-led-stays",
    title: "Design-led stays",
    icon: ComputerDesk01Icon,
  },
  {
    key: "long-stay-routines",
    title: "Long-stay routines",
    icon: KitchenUtensilsIcon,
  },
  {
    key: "always-online",
    title: "Always online",
    icon: HomeWifiIcon,
  },
] as const satisfies ReadonlyArray<{
  key: FeedCollection
  title: string
  icon: typeof Search01Icon
}>

const sortOptions = [
  {
    value: "rating-high",
    label: "Highest rated",
    icon: StarAward01Icon,
  },
  {
    value: "rating-low",
    label: "Lowest rated",
    icon: StarHalfIcon,
  },
  {
    value: "price-high",
    label: "Highest price",
    icon: DollarCircleIcon,
  },
  {
    value: "price-low",
    label: "Lowest price",
    icon: CoinsDollarIcon,
  },
] as const

const fallbackFilterBounds: StayFilterBounds = {
  price: {
    min: 1,
    max: 500,
  },
  rating: {
    min: 0,
    max: 5,
  },
}

type FeedStatusStateProps = {
  description: string
  icon: typeof Search01Icon
  title: string
}

function FeedStatusState({ description, icon, title }: FeedStatusStateProps) {
  return (
    <div className="flex min-h-[58vh] w-full items-center justify-center px-6 py-8">
      <div className="flex max-w-xl flex-col items-center gap-5 text-center">
        <HugeiconsIcon
          className="text-muted-foreground/70"
          icon={icon}
          size={120}
          strokeWidth={1.6}
        />
        <div className="space-y-2">
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </p>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseStaySearchParams(searchParams)
  const [queryDraft, setQueryDraft] = useState(filters.query ?? "")
  const staysQuery = useQuery(stayCardsQueryOptions(filters))
  const normalizedQueryDraft = queryDraft.trim()
  const hasSearchQuery = normalizedQueryDraft.length > 0
  const hasAppliedFilters = Boolean(
    filters.city ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minRating !== undefined ||
    filters.maxRating !== undefined
  )
  const isQuerySyncPending = normalizedQueryDraft !== (filters.query ?? "")
  const isFeedLoading =
    staysQuery.isPending || staysQuery.isFetching || isQuerySyncPending
  const availableCities = staysQuery.data?.availableCities ?? []
  const filterBounds = staysQuery.data?.filterBounds ?? fallbackFilterBounds

  const rows = useMemo(() => {
    if (!staysQuery.data) return []

    const stays = staysQuery.data.stays

    if (hasSearchQuery) {
      return [
        {
          key: "search-results",
          title: "Search results",
          icon: Search01Icon,
          stays,
        },
      ]
    }

    return defaultFeedRows
      .map((row) => ({
        key: row.key,
        title: row.title,
        icon: row.icon,
        stays: stays.filter((stay) => stay.feedCollection === row.key),
      }))
      .filter((row) => row.stays.length > 0)
  }, [hasSearchQuery, staysQuery.data])
  const loadingRows = hasSearchQuery
    ? [
        {
          title: "Search results",
          icon: Search01Icon,
        },
      ]
    : defaultFeedRows.map(({ title, icon }) => ({ title, icon }))
  const selectedSortOption =
    sortOptions.find((option) => option.value === filters.sort) ??
    sortOptions[0]
  const shouldShowSearchEmptyState =
    !staysQuery.isError &&
    !isFeedLoading &&
    (staysQuery.data?.stays.length ?? 0) === 0 &&
    (hasSearchQuery || hasAppliedFilters)
  const shouldShowFeedErrorState =
    staysQuery.isError ||
    (!hasSearchQuery &&
      !hasAppliedFilters &&
      !isFeedLoading &&
      Boolean(staysQuery.data) &&
      rows.length === 0)

  return (
    <div className="w-full space-y-10">
      <section className="w-full space-y-8">
        <StayFeedSearchBar
          availableCities={availableCities}
          filterBounds={filterBounds}
          filters={filters}
          onQueryDraftChange={setQueryDraft}
          queryDraft={queryDraft}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-col">
            <p className="text-md text-base font-semibold tracking-tight text-foreground">
              Suggested results
            </p>
            <p className="text-sm text-muted-foreground">
              Showing international stays results
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              <HugeiconsIcon
                className="text-muted-foreground"
                icon={Sorting01Icon}
                size={14}
                strokeWidth={1.9}
              />
              Sort
            </p>
            <Select
              onValueChange={(
                nextSort:
                  | "rating-high"
                  | "rating-low"
                  | "price-high"
                  | "price-low"
                  | null
              ) => {
                if (!nextSort) {
                  return
                }

                const nextSearchParams = new URLSearchParams(searchParams)

                if (nextSort === "rating-high") {
                  nextSearchParams.delete("sort")
                } else {
                  nextSearchParams.set("sort", nextSort)
                }

                setSearchParams(nextSearchParams)
              }}
              value={filters.sort}
            >
              <SelectTrigger className="h-11 w-full min-w-60 rounded-2xl border-border/70 bg-background/90 px-4 md:w-[15.5rem]">
                <SelectValue>
                  <span className="inline-flex items-center gap-2">
                    <HugeiconsIcon
                      icon={selectedSortOption.icon}
                      size={16}
                      strokeWidth={1.9}
                    />
                    <span>{selectedSortOption.label}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {sortOptions.map((option, index) => (
                  <Fragment key={option.value}>
                    <SelectItem showIndicator value={option.value}>
                      <span className="inline-flex items-center gap-2">
                        <HugeiconsIcon
                          icon={option.icon}
                          size={16}
                          strokeWidth={1.9}
                        />
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                    {index < sortOptions.length - 1 ? (
                      <SelectSeparator />
                    ) : null}
                  </Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isFeedLoading ? (
          <div className="flex flex-col gap-8">
            {loadingRows.map((row, index) => (
              <Fragment key={row.title}>
                <HorizontalStaysRow
                  icon={row.icon}
                  isLoading
                  stays={[]}
                  title={row.title}
                />
                {index < loadingRows.length - 1 ? (
                  <Separator className="self-center data-horizontal:w-4/5" />
                ) : null}
              </Fragment>
            ))}
          </div>
        ) : null}

        {shouldShowFeedErrorState ? (
          <FeedStatusState
            description="We couldn't load stays for the feed right now. Try refreshing the page or coming back in a moment."
            icon={CloudAlertIcon}
            title="Something went wrong"
          />
        ) : null}

        {shouldShowSearchEmptyState ? (
          <FeedStatusState
            description="Try a different city, widen the filters, or search with a broader term to see more stays."
            icon={Search01Icon}
            title="No results found"
          />
        ) : null}

        {!isFeedLoading &&
        !shouldShowFeedErrorState &&
        !shouldShowSearchEmptyState &&
        rows.length > 0 ? (
          <div className="flex flex-col">
            {rows.map((row, index) => (
              <Fragment key={row.key}>
                <HorizontalStaysRow
                  stays={row.stays}
                  icon={row.icon}
                  title={row.title}
                />
                {index < rows.length - 1 ? (
                  <Separator className="self-center data-horizontal:w-4/5" />
                ) : null}
              </Fragment>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
