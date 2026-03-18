import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { StayCard } from "@/features/stays/components/StayCard"
import type { StayCard as StayCardData } from "@/features/stays/schemas"
import { cn } from "@/lib/utils"

type HorizontalStaysRowProps = {
  title: string
  stays: StayCardData[]
  icon?: typeof ArrowLeft01Icon
  isLoading?: boolean
  emptyState?: {
    icon: typeof ArrowLeft01Icon
    title: string
    description: string
  }
}

const rowCardWidthClass =
  "w-[calc((100%_-_1rem)_/_2)] shrink-0 snap-start sm:w-[calc((100%_-_2rem)_/_3)] lg:w-[calc((100%_-_3rem)_/_4)] xl:w-[calc((100%_-_4rem)_/_5)] 2xl:w-[calc((100%_-_5rem)_/_6)]"

function getVisibleRowCardCount() {
  if (typeof window === "undefined") {
    return 4
  }

  const viewportWidth = window.visualViewport?.width ?? window.innerWidth

  if (viewportWidth >= 1536) return 6
  if (viewportWidth >= 1280) return 5
  if (viewportWidth >= 1024) return 4
  if (viewportWidth >= 640) return 3

  return 2
}

export function HorizontalStaysRow({
  title,
  stays,
  icon,
  isLoading = false,
  emptyState,
}: HorizontalStaysRowProps) {
  const rowScrollRef = useRef<HTMLDivElement | null>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const loadingIndexes = useMemo(
    () => Array.from({ length: getVisibleRowCardCount() }, (_, index) => index),
    []
  )
  const cardsSignature = useMemo(
    () => stays.map((stay) => stay.id).join("|"),
    [stays]
  )

  const updateScrollControls = useCallback(() => {
    const element = rowScrollRef.current
    if (!element) return

    const maxScrollLeft = element.scrollWidth - element.clientWidth
    setCanScrollPrev(element.scrollLeft > 4)
    setCanScrollNext(element.scrollLeft < maxScrollLeft - 4)
  }, [])

  const scrollByCards = useCallback((direction: -1 | 1) => {
    const element = rowScrollRef.current
    if (!element) return

    const scrollDelta = Math.max(240, Math.floor(element.clientWidth * 0.9))
    element.scrollBy({
      left: direction * scrollDelta,
      behavior: "smooth",
    })
  }, [])

  useEffect(() => {
    const element = rowScrollRef.current
    if (!element) return

    const onScroll = () => updateScrollControls()
    element.addEventListener("scroll", onScroll, { passive: true })

    let resizeObserver: ResizeObserver | null = null

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateScrollControls())
      resizeObserver.observe(element)
    } else {
      window.addEventListener("resize", updateScrollControls)
    }

    updateScrollControls()

    return () => {
      element.removeEventListener("scroll", onScroll)
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else {
        window.removeEventListener("resize", updateScrollControls)
      }
    }
  }, [updateScrollControls])

  useEffect(() => {
    const element = rowScrollRef.current
    if (!element) return

    const frameId = window.requestAnimationFrame(() => {
      if (typeof element.scrollTo === "function") {
        element.scrollTo({ left: 0, behavior: "auto" })
      } else {
        element.scrollLeft = 0
      }
      updateScrollControls()
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [cardsSignature, isLoading, updateScrollControls])

  if (!isLoading && stays.length === 0 && !emptyState) {
    return null
  }

  return (
    <section className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          {icon ? <HugeiconsIcon icon={icon} size={18} strokeWidth={1.9} /> : null}
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>

        <div className="hidden items-center gap-2 md:inline-flex">
          <Button
            aria-label={`Scroll ${title} left`}
            className="size-8 rounded-full border-border bg-background shadow-none"
            disabled={!canScrollPrev}
            onClick={() => scrollByCards(-1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.9} />
          </Button>
          <Button
            aria-label={`Scroll ${title} right`}
            className="size-8 rounded-full border-border bg-background shadow-none"
            disabled={!canScrollNext}
            onClick={() => scrollByCards(1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={1.9} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div
          ref={rowScrollRef}
          className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loadingIndexes.map((index) => (
            <div
              className={cn(rowCardWidthClass, "min-w-0")}
              key={`skeleton-${title}-${index}`}
            >
              <StayCard className="max-w-none" isLoading />
            </div>
          ))}
        </div>
      ) : stays.length > 0 ? (
        <div
          ref={rowScrollRef}
          className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {stays.map((stay) => (
            <div
              className={cn(rowCardWidthClass, "min-w-0")}
              key={stay.id}
            >
              <StayCard stay={stay} className="max-w-none" />
            </div>
          ))}
        </div>
      ) : emptyState ? (
        <div className="flex min-h-[20rem] w-full items-center justify-center px-6 py-8">
          <div className="flex max-w-xl flex-col items-center gap-5 text-center">
            <HugeiconsIcon
              className="text-muted-foreground/70"
              icon={emptyState.icon}
              size={120}
              strokeWidth={1.6}
            />
            <div className="space-y-2">
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {emptyState.title}
              </p>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                {emptyState.description}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
