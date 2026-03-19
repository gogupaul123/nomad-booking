import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Building06Icon,
  Cancel01Icon,
  ComputerDesk01Icon,
  FavouriteIcon,
  Location01Icon,
  Message02Icon,
  Share01Icon,
  StarIcon,
  Tick02Icon,
  User03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  STAY_DETAILS_INTRO_ID,
  STAY_DETAILS_SECTION_IDS,
  useStayDetailsHeaderMerge,
  useStayDetailsHeaderState,
} from "@/components/stay-details-header-context"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { postReview } from "@/features/stays/api-client"
import { AmenityChip } from "@/features/stays/components/AmenityChip"
import {
  WebImageViewer,
  type WebImageViewerImage,
} from "@/features/stays/components/ImageViewer"
import { StayBookingRail } from "@/features/stays/components/StayBookingRail"
import {
  recordRecentlyViewedStay,
  toggleSavedStay,
  useIsStaySaved,
} from "@/features/stays/persistence"
import {
  stayDetailsQueryOptions,
  stayKeys,
  stayReviewsQueryOptions,
} from "@/features/stays/query-options"
import {
  reviewInputSchema,
  type Review,
  type ReviewInput,
  type StayDetails,
} from "@/features/stays/schemas"
import { ApiError } from "@/lib/fetch-json"
import { cn } from "@/lib/utils"

type HeadingIcon = typeof ArrowLeft01Icon

const favouriteHeartPath =
  "M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"

const reviewsChartConfig = {
  count: {
    color: "var(--color-chart-2)",
    label: "Reviews",
  },
} satisfies ChartConfig

type ReviewFieldErrors = Partial<Record<"name" | "rating" | "comment", string>>
const REVIEW_NAME_MIN_LENGTH = 2
const REVIEW_COMMENT_MIN_LENGTH = 20

function formatRating(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function buildReviewBreakdown(reviews: Array<{ rating: number }>) {
  return [5, 4, 3, 2, 1].map((value) => ({
    count: reviews.filter((review) => Math.round(review.rating) === value)
      .length,
    label: `${value}`,
  }))
}

function mapReviewFieldErrors(
  issues: ReadonlyArray<{ message: string; path: ReadonlyArray<PropertyKey> }>
) {
  return issues.reduce<ReviewFieldErrors>((errors, issue) => {
    const pathKey = issue.path[0]

    if (
      (pathKey === "name" || pathKey === "rating" || pathKey === "comment") &&
      !errors[pathKey]
    ) {
      errors[pathKey] = issue.message
    }

    return errors
  }, {})
}

function applyReviewSummary<T extends Pick<StayDetails, "rating" | "reviewCount">>(
  stay: T,
  review: Review
) {
  const nextReviewCount = stay.reviewCount + 1
  const nextRating =
    nextReviewCount === 1
      ? review.rating
      : (stay.rating * stay.reviewCount + review.rating) / nextReviewCount

  return {
    ...stay,
    rating: nextRating,
    reviewCount: nextReviewCount,
  }
}

function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: HeadingIcon
  title: string
  subtitle?: string
}) {
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2">
        <HugeiconsIcon
          className="text-foreground"
          icon={icon}
          size={18}
          strokeWidth={1.9}
        />
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      {subtitle ? (
        <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  )
}

function IconActionButton({
  ariaLabel,
  onClick,
  children,
  className,
}: {
  ariaLabel: string
  onClick?: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/55 bg-white/92 text-foreground shadow-[0_18px_42px_-28px_rgba(15,23,42,0.5)] backdrop-blur-sm transition-colors hover:text-primary dark:border-white/10 dark:bg-slate-950/85",
        className
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function StaySaveButton({
  saved,
  onToggle,
  className,
}: {
  saved: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <IconActionButton
      ariaLabel={saved ? "Remove from favourites" : "Add to favourites"}
      className={className}
      onClick={onToggle}
    >
      <span className="relative inline-flex items-center justify-center">
        <svg
          aria-hidden="true"
          className={cn(
            "absolute size-7 scale-[0.92] transition-all duration-150",
            saved ? "text-primary opacity-100" : "text-primary opacity-0"
          )}
          viewBox="0 0 24 24"
        >
          <path d={favouriteHeartPath} fill="currentColor" />
        </svg>
        <HugeiconsIcon
          className={cn(saved ? "text-primary" : "text-foreground")}
          icon={FavouriteIcon}
          size={26}
          strokeWidth={1.9}
        />
      </span>
    </IconActionButton>
  )
}

function StayPageSkeleton() {
  return (
    <div className="w-full space-y-8 pb-10">
      <div className="space-y-6">
        <Skeleton className="aspect-[1.2/1] w-full rounded-none md:hidden" />
        <Skeleton className="hidden aspect-[2.7/1] w-full rounded-[2rem] md:block" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-2/3 rounded-xl" />
          <Skeleton className="h-5 w-1/3 rounded-xl" />
          <Skeleton className="h-5 w-full rounded-xl" />
          <Skeleton className="h-5 w-5/6 rounded-xl" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-[2rem]" />
          <div className="grid gap-6 xl:grid-cols-2">
            <Skeleton className="h-56 rounded-[2rem]" />
            <Skeleton className="h-56 rounded-[2rem]" />
          </div>
          <Skeleton className="h-44 rounded-[2rem]" />
        </div>
        <Skeleton className="h-[32rem] rounded-[2rem]" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Skeleton className="h-80 rounded-[2rem]" />
        <Skeleton className="h-80 rounded-[2rem]" />
      </div>
    </div>
  )
}

export function StayPage() {
  const params = useParams()
  const stayId = params.stayId ?? ""
  const queryClient = useQueryClient()
  const [mobileCarouselApi, setMobileCarouselApi] = useState<CarouselApi>()
  const [mobileCarouselIndex, setMobileCarouselIndex] = useState(0)
  const [desktopCarouselApi, setDesktopCarouselApi] = useState<CarouselApi>()
  const [desktopCarouselIndex, setDesktopCarouselIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerStartIndex, setViewerStartIndex] = useState(0)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [reviewName, setReviewName] = useState("")
  const [reviewRating, setReviewRating] = useState(4)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewFieldErrors, setReviewFieldErrors] = useState<ReviewFieldErrors>(
    {}
  )
  const [reviewError, setReviewError] = useState<string | null>(null)
  const reviewsRowRef = useRef<HTMLDivElement | null>(null)
  const reviewsContentRef = useRef<HTMLDivElement | null>(null)
  const previousReviewsSignatureRef = useRef("")
  const [canScrollReviewsPrev, setCanScrollReviewsPrev] = useState(false)
  const [canScrollReviewsNext, setCanScrollReviewsNext] = useState(false)
  const [reviewsOverflowing, setReviewsOverflowing] = useState(false)
  const { setHeader } = useStayDetailsHeaderState()
  const stayQuery = useQuery(stayDetailsQueryOptions(stayId))
  const reviewsQuery = useQuery(stayReviewsQueryOptions(stayId))
  const isSaved = useIsStaySaved(stayId)
  const { isMobileViewport, mergeProgress } = useStayDetailsHeaderMerge(true)

  const resetReviewDraft = useCallback(() => {
    setReviewName("")
    setReviewRating(4)
    setReviewComment("")
    setReviewFieldErrors({})
    setReviewError(null)
  }, [])

  const clearReviewFieldError = useCallback(
    (field: keyof ReviewFieldErrors) => {
      setReviewFieldErrors((current) =>
        current[field]
          ? {
              ...current,
              [field]: undefined,
            }
          : current
      )
    },
    []
  )

  const reviewMutation = useMutation<Review, unknown, ReviewInput>({
    mutationFn: (input) => postReview(stayId, input),
    onSuccess: (review) => {
      queryClient.setQueryData<{ reviews: Review[] }>(
        stayKeys.reviews(stayId),
        (current) => ({
          reviews: [
            review,
            ...(current?.reviews ?? []).filter(
              (existingReview) => existingReview.id !== review.id
            ),
          ],
        })
      )

      queryClient.setQueryData<StayDetails>(
        stayKeys.detail(stayId),
        (current) => {
          if (!current) {
            return current
          }

          return applyReviewSummary(current, review)
        }
      )

      setIsReviewDialogOpen(false)
      resetReviewDraft()
      toast.success("Review posted", {
        description: "Your review is now visible on this stay.",
      })

      void queryClient.invalidateQueries({
        queryKey: stayKeys.lists(),
        refetchType: "none",
      })
    },
    onError: (error) => {
      setReviewError(
        error instanceof Error ? error.message : "Unable to post your review."
      )
    },
  })

  const stay = stayQuery.data
  const stayImages = useMemo(
    () => (stay ? (stay.images.length > 0 ? stay.images : [stay.image]) : []),
    [stay]
  )
  const reviews = useMemo(
    () =>
      [...(reviewsQuery.data?.reviews ?? [])].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt)
      ),
    [reviewsQuery.data?.reviews]
  )
  const reviewCount =
    reviews.length > 0 ? reviews.length : (stay?.reviewCount ?? 0)
  const reviewSignature = useMemo(
    () => reviews.map((review) => review.id).join("|"),
    [reviews]
  )
  const trimmedReviewNameLength = reviewName.trim().length
  const trimmedReviewCommentLength = reviewComment.trim().length
  const nameNeedsMoreCharacters =
    trimmedReviewNameLength < REVIEW_NAME_MIN_LENGTH
  const commentNeedsMoreCharacters =
    trimmedReviewCommentLength < REVIEW_COMMENT_MIN_LENGTH
  const nameFieldInvalid =
    Boolean(reviewFieldErrors.name) ||
    (reviewName.length > 0 && nameNeedsMoreCharacters)
  const commentFieldInvalid =
    Boolean(reviewFieldErrors.comment) ||
    (reviewComment.length > 0 && commentNeedsMoreCharacters)
  const nameFieldMessage =
    reviewFieldErrors.name ??
    (nameNeedsMoreCharacters
      ? `At least ${REVIEW_NAME_MIN_LENGTH} characters.`
      : null)
  const commentFieldMessage =
    reviewFieldErrors.comment ??
    (commentNeedsMoreCharacters
      ? `At least ${REVIEW_COMMENT_MIN_LENGTH} characters.`
      : null)
  const reviewAverage = useMemo(() => {
    if (reviews.length === 0) {
      return stay?.rating ?? 0
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0)
    return total / reviews.length
  }, [reviews, stay?.rating])
  const reviewBreakdown = useMemo(
    () => buildReviewBreakdown(reviews),
    [reviews]
  )
  const viewerImages = useMemo<WebImageViewerImage[]>(
    () =>
      stayImages.map((image, index) => ({
        alt: image.alt || `${stay?.name ?? "Stay"} ${index + 1}`,
        id: `${stay?.id ?? "stay"}-image-${index}`,
        src: image.src,
      })),
    [stay?.id, stay?.name, stayImages]
  )
  const openViewer = useCallback(
    (startIndex: number) => {
      if (viewerImages.length === 0) {
        return
      }

      setViewerStartIndex(
        Math.max(0, Math.min(startIndex, Math.max(viewerImages.length - 1, 0)))
      )
      setViewerOpen(true)
    },
    [viewerImages.length]
  )

  const handleShare = useCallback(async () => {
    if (!stay || typeof window === "undefined") {
      return
    }

    const sharePayload = {
      title: stay.name,
      text: stay.description,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(sharePayload)
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sharePayload.url)
      }
    } catch {
      return
    }
  }, [stay])

  const handleToggleSave = useCallback(() => {
    if (!stay) {
      return
    }

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
  }, [stay])

  const handleReviewSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const parsedInput = reviewInputSchema.safeParse({
        name: reviewName,
        rating: reviewRating,
        comment: reviewComment,
      })

      if (!parsedInput.success) {
        setReviewFieldErrors(mapReviewFieldErrors(parsedInput.error.issues))
        setReviewError(null)
        return
      }

      setReviewFieldErrors({})
      setReviewError(null)
      await reviewMutation.mutateAsync(parsedInput.data)
    },
    [reviewComment, reviewMutation, reviewName, reviewRating]
  )

  useEffect(() => {
    if (!stay) {
      return
    }

    recordRecentlyViewedStay(stay)
    document.title = `${stay.name} | Nomad Booking`
  }, [stay])

  useEffect(() => {
    if (!stay) {
      setHeader(null)
      return
    }

    setHeader({
      title: stay.name,
      subtitle: stay.hostType,
      isSaved,
      isMobileViewport,
      mergeProgress,
      onShare: handleShare,
      onToggleSave: handleToggleSave,
    })

    return () => {
      setHeader(null)
    }
  }, [
    handleShare,
    handleToggleSave,
    isMobileViewport,
    isSaved,
    mergeProgress,
    setHeader,
    stay,
  ])

  useEffect(() => {
    if (!mobileCarouselApi) return

    const syncSelectedIndex = () => {
      setMobileCarouselIndex(mobileCarouselApi.selectedScrollSnap())
    }

    syncSelectedIndex()
    mobileCarouselApi.on("select", syncSelectedIndex)
    mobileCarouselApi.on("reInit", syncSelectedIndex)

    return () => {
      mobileCarouselApi.off("select", syncSelectedIndex)
      mobileCarouselApi.off("reInit", syncSelectedIndex)
    }
  }, [mobileCarouselApi])

  useEffect(() => {
    if (!desktopCarouselApi) return

    const syncSelectedIndex = () => {
      setDesktopCarouselIndex(desktopCarouselApi.selectedScrollSnap())
    }

    syncSelectedIndex()
    desktopCarouselApi.on("select", syncSelectedIndex)
    desktopCarouselApi.on("reInit", syncSelectedIndex)

    return () => {
      desktopCarouselApi.off("select", syncSelectedIndex)
      desktopCarouselApi.off("reInit", syncSelectedIndex)
    }
  }, [desktopCarouselApi])

  const updateReviewsScrollControls = useCallback(() => {
    const element = reviewsRowRef.current
    if (!element) {
      setCanScrollReviewsPrev(false)
      setCanScrollReviewsNext(false)
      setReviewsOverflowing(false)
      return
    }

    const maxScrollLeft = element.scrollWidth - element.clientWidth
    const isOverflowing = maxScrollLeft > 4
    setReviewsOverflowing(isOverflowing)
    setCanScrollReviewsPrev(isOverflowing && element.scrollLeft > 4)
    setCanScrollReviewsNext(
      isOverflowing && maxScrollLeft - element.scrollLeft > 4
    )
  }, [])

  const scrollReviewsByCards = useCallback(
    (direction: -1 | 1) => {
      const element = reviewsRowRef.current
      if (!element) return

      const scrollDelta = Math.max(280, Math.floor(element.clientWidth * 0.82))
      element.scrollBy({
        left: direction * scrollDelta,
        behavior: "smooth",
      })

      window.requestAnimationFrame(() => {
        updateReviewsScrollControls()
      })
    },
    [updateReviewsScrollControls]
  )

  useEffect(() => {
    const element = reviewsRowRef.current
    if (!element) return
    const content = reviewsContentRef.current

    const onScroll = () => updateReviewsScrollControls()
    element.addEventListener("scroll", onScroll, { passive: true })

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            updateReviewsScrollControls()
          })
        : null

    resizeObserver?.observe(element)
    if (content) {
      resizeObserver?.observe(content)
    }
    const frameId = window.requestAnimationFrame(() => {
      updateReviewsScrollControls()
    })

    return () => {
      element.removeEventListener("scroll", onScroll)
      resizeObserver?.disconnect()
      window.cancelAnimationFrame(frameId)
    }
  }, [reviews.length, updateReviewsScrollControls])

  useEffect(() => {
    if (typeof window === "undefined") return
    const frameId = window.requestAnimationFrame(() => {
      updateReviewsScrollControls()
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [reviews.length, reviewsQuery.isPending, updateReviewsScrollControls])

  useEffect(() => {
    const element = reviewsRowRef.current
    if (!element) {
      previousReviewsSignatureRef.current = reviewSignature
      return
    }

    if (!reviewSignature) {
      previousReviewsSignatureRef.current = reviewSignature
      return
    }

    if (previousReviewsSignatureRef.current === reviewSignature) {
      return
    }

    previousReviewsSignatureRef.current = reviewSignature

    element.scrollTo({
      left: 0,
      behavior: "smooth",
    })

    const frameId = window.requestAnimationFrame(() => {
      updateReviewsScrollControls()
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [reviewSignature, updateReviewsScrollControls])

  if (stayQuery.isPending) {
    return <StayPageSkeleton />
  }

  if (stayQuery.isError || !stay) {
    const isMissingStay =
      stayQuery.error instanceof ApiError && stayQuery.error.status === 404

    return (
      <div className="w-full py-8">
        <Alert variant="destructive">
          <AlertTitle>
            {isMissingStay ? "Stay not found" : "Unable to load stay"}
          </AlertTitle>
          <AlertDescription>
            {isMissingStay
              ? "The details endpoint did not return a stay for this id."
              : "We couldn't load this stay right now. Try refreshing the page in a moment."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="w-full pb-10 md:pb-14">
      <div className="space-y-8">
        <div className="-mx-4 -mt-6 sm:-mx-6 md:hidden">
          <div className="relative">
            <Carousel
              className="w-full"
              opts={{ loop: stayImages.length > 1 }}
              setApi={setMobileCarouselApi}
            >
              <CarouselContent className="ml-0">
                {stayImages.map((image, index) => (
                  <CarouselItem className="pl-0" key={`${image.src}-${index}`}>
                    <button
                      aria-label={`Open ${stay.name} image ${index + 1}`}
                      className="block w-full cursor-pointer text-left"
                      onClick={() => openViewer(index)}
                      type="button"
                    >
                      <img
                        alt={image.alt}
                        className="aspect-[1.2/1] w-full object-cover"
                        src={image.src}
                      />
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {stayImages.length > 1 ? (
                <>
                  <CarouselPrevious
                    className="left-2 z-10 size-12 translate-y-0 border-0 bg-secondary text-foreground shadow-none hover:bg-secondary hover:text-primary active:translate-y-0 disabled:opacity-35 [&_svg]:size-9"
                    size="icon"
                    variant="secondary"
                  />
                  <CarouselNext
                    className="right-2 z-10 size-12 translate-y-0 border-0 bg-secondary text-foreground shadow-none hover:bg-secondary hover:text-primary active:translate-y-0 disabled:opacity-35 [&_svg]:size-9"
                    size="icon"
                    variant="secondary"
                  />
                </>
              ) : null}
            </Carousel>

            {stayImages.length > 0 ? (
              <div className="absolute right-4 bottom-4 inline-flex items-center justify-center rounded-md border border-white/50 bg-background/92 px-3 py-2 text-sm font-medium text-foreground shadow-[0_18px_42px_-28px_rgba(15,23,42,0.45)] backdrop-blur-sm">
                {mobileCarouselIndex + 1} / {stayImages.length}
              </div>
            ) : null}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="space-y-6">
            <Carousel
              className="w-full"
              opts={{ loop: stayImages.length > 1 }}
              setApi={setDesktopCarouselApi}
            >
              <div className="relative overflow-hidden rounded-[2rem]">
                <CarouselContent className="ml-0">
                  {stayImages.map((image, index) => (
                    <CarouselItem
                      className="pl-0"
                      key={`${image.src}-${index}`}
                    >
                      <button
                        aria-label={`Open ${stay.name} image ${index + 1}`}
                        className="block w-full cursor-pointer text-left"
                        onClick={() => openViewer(index)}
                        type="button"
                      >
                        <img
                          alt={image.alt}
                          className="aspect-[2.7/1] w-full object-cover"
                          src={image.src}
                        />
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>

                {stayImages.length > 0 ? (
                  <div className="absolute right-5 bottom-5 inline-flex items-center justify-center rounded-xl border border-white/45 bg-background/92 px-3.5 py-2 text-sm font-medium text-foreground shadow-[0_18px_42px_-28px_rgba(15,23,42,0.45)] backdrop-blur-sm">
                    {desktopCarouselIndex + 1} / {stayImages.length}
                  </div>
                ) : null}
              </div>

              {stayImages.length > 1 ? (
                <>
                  <CarouselPrevious
                    className="top-1/2 left-2 z-10 size-12 -translate-y-1/2 translate-y-0 border-0 bg-secondary text-foreground shadow-none hover:bg-secondary hover:text-primary active:translate-y-0 disabled:opacity-35 md:-left-20 md:size-14 [&_svg]:size-9"
                    size="icon"
                    variant="secondary"
                  />
                  <CarouselNext
                    className="top-1/2 right-2 z-10 size-12 -translate-y-1/2 translate-y-0 border-0 bg-secondary text-foreground shadow-none hover:bg-secondary hover:text-primary active:translate-y-0 disabled:opacity-35 md:-right-20 md:size-14 [&_svg]:size-9"
                    size="icon"
                    variant="secondary"
                  />
                </>
              ) : null}
            </Carousel>
          </div>
        </div>

        <div
          className="space-y-4 transition-[opacity,transform] duration-220 ease-out"
          id={STAY_DETAILS_INTRO_ID}
          style={{
            opacity: 1 - mergeProgress,
            transform: isMobileViewport
              ? `translateY(${-28 * mergeProgress}px) translateX(${-20 * mergeProgress}px) scale(${1 - 0.05 * mergeProgress})`
              : "none",
          }}
        >
          <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] md:items-start md:gap-6">
            <Link
              aria-label="Back to feed"
              className="inline-flex size-11 items-center justify-center text-foreground transition-colors hover:text-primary"
              to="/feed"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={24}
                strokeWidth={1.9}
              />
            </Link>

            <div className="space-y-3 text-center">
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                {stay.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={16}
                    strokeWidth={1.9}
                  />
                  {stay.location.city}, {stay.location.country}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Building06Icon}
                    size={16}
                    strokeWidth={1.9}
                  />
                  {stay.hostType}
                </span>
              </div>
              <p className="mx-auto max-w-3xl text-sm leading-7 text-muted-foreground">
                {stay.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <IconActionButton ariaLabel="Share stay" onClick={handleShare}>
                <HugeiconsIcon icon={Share01Icon} size={22} strokeWidth={1.9} />
              </IconActionButton>
              <StaySaveButton onToggle={handleToggleSave} saved={isSaved} />
            </div>
          </div>

          <div className="space-y-4 text-center md:hidden">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-foreground">
                {stay.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={16}
                    strokeWidth={1.9}
                  />
                  {stay.location.city}, {stay.location.country}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Building06Icon}
                    size={16}
                    strokeWidth={1.9}
                  />
                  {stay.hostType}
                </span>
              </div>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              {stay.description}
            </p>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start lg:gap-10">
          <div className="w-full">
            <div className="flex w-full flex-col gap-0 text-center md:text-left">
              <section className="w-full space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Availability
                    </p>
                    <p className="text-sm leading-6 text-foreground">
                      {stay.availabilityLabel}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Host type
                    </p>
                    <p className="text-sm leading-6 text-foreground">
                      {stay.hostType}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Cancellation
                    </p>
                    <p className="text-sm leading-6 text-foreground">
                      {stay.cancellationPolicy}
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              <section
                className="w-full scroll-mt-28 space-y-4"
                id={STAY_DETAILS_SECTION_IDS.amenities}
              >
                <SectionHeading
                  icon={Building06Icon}
                  subtitle="Everything currently included with the stay."
                  title="Amenities"
                />
                <div className="flex flex-wrap gap-2">
                  {stay.amenities.map((amenity) => (
                    <AmenityChip amenity={amenity} key={amenity} />
                  ))}
                </div>
              </section>

              <Separator />

              <section
                className="w-full scroll-mt-28 space-y-4"
                id={STAY_DETAILS_SECTION_IDS.workspace}
              >
                <SectionHeading
                  icon={ComputerDesk01Icon}
                  subtitle="The setup details that make the stay work for focused remote routines."
                  title="Workspace highlights"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  {stay.workspaceHighlights.map((highlight) => (
                    <div className="flex items-start gap-3" key={highlight}>
                      <HugeiconsIcon
                        className="mt-0.5 shrink-0 text-primary"
                        icon={ComputerDesk01Icon}
                        size={18}
                        strokeWidth={1.9}
                      />
                      <p className="text-sm leading-6 text-foreground">
                        {highlight}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <aside className="mx-auto mt-6 flex min-h-0 w-full max-w-xl lg:mt-2">
            <StayBookingRail
              isMobileViewport={isMobileViewport}
              key={stay.id}
              stay={stay}
            />
          </aside>
        </div>

        <Separator className="my-8" />

        <section
          className="scroll-mt-28 space-y-2"
          id={STAY_DETAILS_SECTION_IDS.reviews}
        >
          {reviewsQuery.isPending ? (
            <div className="space-y-3">
              <div className="grid gap-8 px-4 py-4 md:grid-cols-2 md:items-center">
                <div className="flex min-h-[220px] items-center justify-center">
                  <div className="flex w-full max-w-md flex-col items-center gap-3 py-4 text-center">
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-11 rounded-sm" />
                      <Skeleton className="h-12 w-24 rounded-sm" />
                    </div>
                    <Skeleton className="h-7 w-56 rounded-sm" />
                  </div>
                </div>
                <Skeleton className="h-[220px] rounded-[1.5rem]" />
              </div>

              <div className="relative px-3 py-3 sm:px-4">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-12 bg-gradient-to-r from-background via-background/90 to-transparent md:w-16" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-12 bg-gradient-to-l from-background via-background/90 to-transparent md:w-16" />

                <div className="no-scrollbar flex items-center gap-5 overflow-x-auto px-5 py-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card
                      className="w-full max-w-[400px] shrink-0 self-center rounded-[1.5rem] border border-border/70 bg-card/70 py-0"
                      key={`review-skeleton-${index}`}
                      size="sm"
                    >
                      <CardContent className="space-y-4 p-5">
                        <Skeleton className="h-5 w-28 rounded-sm" />
                        <Skeleton className="h-16 w-full rounded-sm" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full py-2">
              <div className="grid gap-8 px-4 py-4 md:grid-cols-2 md:items-center">
                <div className="flex min-h-[220px] items-center justify-center">
                  <div className="flex w-full max-w-md flex-col items-center justify-center gap-2 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <HugeiconsIcon
                        className="text-foreground"
                        icon={StarIcon}
                        size={60}
                        strokeWidth={1.9}
                      />
                      <span className="text-[56px] leading-none font-medium text-foreground">
                        {formatRating(reviewAverage)}
                      </span>
                    </div>
                    <p className="text-xl text-muted-foreground">
                      {reviewCount < 1
                        ? "No reviews available yet"
                        : `${reviewCount} review${reviewCount === 1 ? "" : "s"} available`}
                    </p>
                    <Button
                      className="mt-2 rounded-xl"
                      size="lg"
                      onClick={() => {
                        setReviewFieldErrors({})
                        setReviewError(null)
                        setIsReviewDialogOpen(true)
                      }}
                      type="button"
                    >
                      <HugeiconsIcon
                        icon={Message02Icon}
                        size={18}
                        strokeWidth={1.9}
                      />
                      <span>Add a review</span>
                    </Button>
                  </div>
                </div>

                <div className="h-[220px]">
                  {reviewsQuery.isError ? (
                    <div className="flex h-[220px] items-center justify-center text-sm leading-6 text-muted-foreground">
                      The rating breakdown could not be loaded right now.
                    </div>
                  ) : reviewCount > 0 ? (
                    <ChartContainer
                      className="aspect-auto h-[220px] w-full overflow-hidden [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-transparent"
                      config={reviewsChartConfig}
                    >
                      <BarChart
                        accessibilityLayer
                        data={reviewBreakdown}
                        margin={{ left: -8, right: 0, top: 10, bottom: 6 }}
                      >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          hide
                          tickLine={false}
                        />
                        <XAxis
                          axisLine={false}
                          dataKey="label"
                          tickLine={false}
                          tickMargin={10}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              hideIndicator
                              hideLabel
                              formatter={(value, _name, item) => (
                                <div className="flex w-full items-center justify-between gap-4">
                                  <span className="text-muted-foreground">
                                    {item.payload.label} stars
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {value} review
                                    {Number(value) === 1 ? "" : "s"}
                                  </span>
                                </div>
                              )}
                            />
                          }
                          cursor={{ fill: "transparent" }}
                        />
                        <Bar
                          barSize={32}
                          dataKey="count"
                          fill="var(--color-count)"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-sm leading-6 text-muted-foreground">
                      Ratings will appear here once guests start reviewing this
                      stay.
                    </div>
                  )}
                </div>
              </div>

              {reviewsQuery.isError ? (
                <div className="py-4 text-center">
                  <p className="text-lg font-medium text-foreground">
                    Reviews are unavailable right now
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try refreshing in a moment.
                  </p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="relative px-3 py-3 sm:px-4">
                  <div className="hidden md:inline-flex">
                    <button
                      aria-label="Scroll reviews left"
                      className="absolute top-1/2 left-0 z-10 inline-flex h-8 w-8 -translate-x-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-35"
                      disabled={!canScrollReviewsPrev}
                      onClick={() => scrollReviewsByCards(-1)}
                      type="button"
                    >
                      <HugeiconsIcon
                        icon={ArrowLeft01Icon}
                        size={18}
                        strokeWidth={1.9}
                      />
                    </button>
                    <button
                      aria-label="Scroll reviews right"
                      className="absolute top-1/2 right-0 z-10 inline-flex h-8 w-8 translate-x-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-35"
                      disabled={!canScrollReviewsNext}
                      onClick={() => scrollReviewsByCards(1)}
                      type="button"
                    >
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={18}
                        strokeWidth={1.9}
                      />
                    </button>
                  </div>

                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 left-0 z-[1] w-12 bg-gradient-to-r from-background via-background/90 to-transparent transition-opacity duration-200 md:w-16",
                      canScrollReviewsPrev ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 right-0 z-[1] w-12 bg-gradient-to-l from-background via-background/90 to-transparent transition-opacity duration-200 md:w-16",
                      canScrollReviewsNext ? "opacity-100" : "opacity-0"
                    )}
                  />

                  <div
                    className={cn(
                      "no-scrollbar overflow-x-auto"
                    )}
                    ref={reviewsRowRef}
                  >
                    <div
                      className={cn(
                        "flex min-w-full w-max items-center gap-5 px-5 py-4",
                        !reviewsOverflowing && "justify-center"
                      )}
                      ref={reviewsContentRef}
                    >
                      {reviews.map((review) => (
                        <Card
                          className="w-full max-w-[400px] shrink-0 self-center rounded-[1.5rem] border border-border/70 bg-card/70 py-0"
                          key={review.id}
                          size="sm"
                        >
                          <CardContent className="space-y-4 p-5">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-sm font-semibold text-foreground">
                                {review.name}
                              </p>
                              <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                                <HugeiconsIcon
                                  icon={StarIcon}
                                  size={14}
                                  strokeWidth={1.9}
                                />
                                {formatRating(review.rating)}
                              </div>
                            </div>
                            <p className="text-sm leading-7 text-muted-foreground">
                              {review.comment}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-lg font-medium text-foreground">
                    No reviews yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This stay is still waiting for its first guest review.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <Dialog
        onOpenChange={(nextOpen) => {
          setIsReviewDialogOpen(nextOpen)
          if (!nextOpen) {
            setReviewFieldErrors({})
            setReviewError(null)
          }
        }}
        open={isReviewDialogOpen}
      >
        <DialogContent
          className="max-w-xl gap-0 overflow-hidden rounded-[1.75rem] p-0"
          showCloseButton={false}
        >
          <div className="space-y-6 p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                Add a review
              </DialogTitle>
              <DialogDescription>
                Share how this stay felt once you settled into the setup,
                comfort, and day-to-day rhythm.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-5" onSubmit={handleReviewSubmit}>
              <div
                className="space-y-2.5"
                data-invalid={nameFieldInvalid ? true : undefined}
              >
                <Label
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
                  htmlFor="review-name"
                >
                  <HugeiconsIcon
                    icon={User03Icon}
                    size={16}
                    strokeWidth={1.9}
                  />
                  <span>Name</span>
                </Label>
                <Input
                  autoCapitalize="words"
                  autoComplete="off"
                  autoCorrect="off"
                  data-1p-ignore="true"
                  data-form-type="other"
                  data-lpignore="true"
                  id="review-name"
                  name="review_name"
                  onChange={(event) => {
                    clearReviewFieldError("name")
                    setReviewName(event.target.value)
                  }}
                  placeholder="Your name"
                  spellCheck={false}
                  type="text"
                  aria-invalid={nameFieldInvalid ? true : undefined}
                  value={reviewName}
                />
                {nameFieldMessage ? (
                  <p
                    className={cn(
                      "text-sm",
                      nameFieldInvalid
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                    role={nameFieldInvalid ? "alert" : undefined}
                  >
                    {nameFieldMessage}
                  </p>
                ) : null}
              </div>

              <Separator className="my-0" />

              <div
                className="space-y-3"
                data-invalid={reviewFieldErrors.rating ? true : undefined}
              >
                <div className="flex items-center justify-between gap-3">
                  <Label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <HugeiconsIcon
                      icon={StarIcon}
                      size={16}
                      strokeWidth={1.9}
                    />
                    <span>Rating</span>
                  </Label>
                  <span className="text-sm font-medium text-muted-foreground">
                    {reviewRating} / 5
                  </span>
                </div>
                <Slider
                  aria-invalid={reviewFieldErrors.rating ? true : undefined}
                  max={5}
                  min={1}
                  onValueChange={(value) => {
                    const nextRating = Array.isArray(value) ? value[0] : value
                    clearReviewFieldError("rating")
                    setReviewRating(nextRating ?? reviewRating)
                  }}
                  step={1}
                  value={[reviewRating]}
                />
                {reviewFieldErrors.rating ? (
                  <p className="text-sm text-destructive" role="alert">
                    {reviewFieldErrors.rating}
                  </p>
                ) : null}
              </div>

              <Separator className="my-0" />

              <div
                className="space-y-2.5"
                data-invalid={commentFieldInvalid ? true : undefined}
              >
                <Label
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
                  htmlFor="review-comment"
                >
                  <HugeiconsIcon
                    icon={Message02Icon}
                    size={16}
                    strokeWidth={1.9}
                  />
                  <span>Comment</span>
                </Label>
                <Textarea
                  autoComplete="off"
                  data-form-type="other"
                  data-lpignore="true"
                  id="review-comment"
                  name="review_comment"
                  onChange={(event) => {
                    clearReviewFieldError("comment")
                    setReviewComment(event.target.value)
                  }}
                  placeholder="Tell us how the stay felt once you started living and working there."
                  rows={5}
                  aria-invalid={commentFieldInvalid ? true : undefined}
                  value={reviewComment}
                />
                {commentFieldMessage ? (
                  <p
                    className={cn(
                      "text-sm",
                      commentFieldInvalid
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                    role={commentFieldInvalid ? "alert" : undefined}
                  >
                    {commentFieldMessage}
                  </p>
                ) : null}
              </div>

              {reviewError ? (
                <Alert variant="destructive">
                  <AlertTitle>Review not posted</AlertTitle>
                  <AlertDescription>{reviewError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="-mx-6 -mb-6 flex flex-col gap-3 border-t border-border/70 bg-muted/35 px-6 py-4 sm:flex-row sm:justify-end">
                <DialogClose
                  render={
                    <Button
                      className="h-12 w-full rounded-2xl text-sm font-semibold sm:w-auto sm:min-w-[124px]"
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
                  Close
                </DialogClose>

                <Button
                  className="h-12 w-full rounded-2xl text-sm font-semibold sm:w-auto sm:min-w-[124px]"
                  disabled={reviewMutation.isPending}
                  type="submit"
                >
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    size={16}
                    strokeWidth={1.9}
                  />
                  {reviewMutation.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <WebImageViewer
        images={viewerImages}
        onOpenChange={setViewerOpen}
        open={viewerOpen}
        startIndex={viewerStartIndex}
      />
    </div>
  )
}
