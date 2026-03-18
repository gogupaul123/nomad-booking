"use client"

import { motion } from "motion/react"
import {
  cloneElement,
  isValidElement,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"

export type WebImageViewerImage = {
  src?: string
  alt: string
  id?: string
}

type WebImageViewerHeaderContext = {
  close: () => void
  currentImage?: WebImageViewerImage
  currentIndex: number
  total: number
}

type WebImageViewerProps = {
  images: WebImageViewerImage[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  startIndex?: number
  trigger?: ReactNode
  triggerStartIndex?: number
  triggerAriaLabel?: string
  headerComponents?:
    | ReactNode
    | ((context: WebImageViewerHeaderContext) => ReactNode)
}

export function WebImageViewer({
  images,
  open,
  onOpenChange,
  startIndex = 0,
  trigger,
  triggerStartIndex = 0,
  triggerAriaLabel,
  headerComponents,
}: WebImageViewerProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [carouselIndex, setCarouselIndex] = useState(startIndex)
  const [internalOpen, setInternalOpen] = useState(false)
  const [internalStartIndex, setInternalStartIndex] = useState(startIndex)
  const isOpen = open ?? internalOpen
  const effectiveStartIndex =
    open !== undefined ? startIndex : internalStartIndex
  const viewerImages = useMemo(
    () => (images.length > 0 ? images : [{ alt: "", src: undefined }]),
    [images]
  )
  const displayedIndex = Math.max(
    0,
    Math.min(
      carouselApi ? carouselIndex : effectiveStartIndex,
      Math.max(viewerImages.length - 1, 0)
    )
  )

  const closeViewer = useCallback(() => {
    if (open === undefined) {
      setInternalOpen(false)
    }
    onOpenChange?.(false)
  }, [onOpenChange, open])

  const openViewer = useCallback(
    (nextStartIndex: number) => {
      const clampedIndex = Math.max(
        0,
        Math.min(nextStartIndex, Math.max(viewerImages.length - 1, 0))
      )
      if (open === undefined) {
        setInternalStartIndex(clampedIndex)
        setInternalOpen(true)
      }
      setCarouselIndex(clampedIndex)
      onOpenChange?.(true)
    },
    [onOpenChange, open, viewerImages.length]
  )

  useEffect(() => {
    if (!carouselApi) return

    const syncSelectedIndex = () => {
      setCarouselIndex(carouselApi.selectedScrollSnap())
    }

    syncSelectedIndex()
    carouselApi.on("select", syncSelectedIndex)
    carouselApi.on("reInit", syncSelectedIndex)

    return () => {
      carouselApi.off("select", syncSelectedIndex)
      carouselApi.off("reInit", syncSelectedIndex)
    }
  }, [carouselApi])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeViewer()
        return
      }

      if (!carouselApi || viewerImages.length <= 1) return

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        carouselApi.scrollPrev()
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        carouselApi.scrollNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown as never)

    return () => {
      window.removeEventListener("keydown", handleKeyDown as never)
    }
  }, [carouselApi, closeViewer, isOpen, viewerImages.length])

  useEffect(() => {
    if (!isOpen || !carouselApi) return
    carouselApi.scrollTo(effectiveStartIndex, true)
  }, [carouselApi, effectiveStartIndex, isOpen])

  const resolvedHeaderComponents =
    typeof headerComponents === "function"
      ? headerComponents({
          close: closeViewer,
          currentImage: viewerImages[displayedIndex],
          currentIndex: displayedIndex,
          total: viewerImages.length,
        })
      : headerComponents

  const renderTrigger = () => {
    if (!trigger) return null

    const handleTriggerClick = (event: MouseEvent<HTMLElement>) => {
      const existingOnClick = (
        trigger as ReactElement<{
          onClick?: (nextEvent: MouseEvent<HTMLElement>) => void
        }>
      ).props?.onClick
      existingOnClick?.(event)
      if (event.defaultPrevented) return
      openViewer(triggerStartIndex)
    }

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      const existingOnKeyDown = (
        trigger as ReactElement<{
          onKeyDown?: (nextEvent: KeyboardEvent<HTMLElement>) => void
        }>
      ).props?.onKeyDown
      existingOnKeyDown?.(event)
      if (event.defaultPrevented) return
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        openViewer(triggerStartIndex)
      }
    }

    if (isValidElement(trigger)) {
      const triggerElement = trigger as ReactElement<{
        className?: string
        onClick?: (event: MouseEvent<HTMLElement>) => void
        onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
      }>

      return cloneElement(triggerElement, {
        className: cn(triggerElement.props.className, "cursor-pointer"),
        onClick: handleTriggerClick,
        onKeyDown: handleTriggerKeyDown,
      })
    }

    return (
      <span
        role="button"
        tabIndex={0}
        aria-label={triggerAriaLabel}
        className="inline-flex cursor-pointer"
        onClick={() => openViewer(triggerStartIndex)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openViewer(triggerStartIndex)
          }
        }}
      >
        {trigger}
      </span>
    )
  }

  return (
    <>
      {renderTrigger()}

      <Dialog
        open={isOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeViewer()
            return
          }

          if (open === undefined) {
            setInternalOpen(true)
          }
          onOpenChange?.(true)
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="inset-0 top-0 left-0 z-[120] h-dvh min-h-dvh w-screen max-w-none -translate-x-0 -translate-y-0 rounded-none border-0 bg-background p-0 text-foreground shadow-none ring-0 sm:max-w-none"
        >
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 px-4 pt-4 text-foreground md:px-8 md:pt-6">
            <button
              type="button"
              onClick={closeViewer}
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted/80"
              aria-label={"Close"}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={24} strokeWidth={2} />
            </button>

            <div className="text-md font-medium text-foreground tabular-nums md:text-lg">
              {displayedIndex + 1} / {viewerImages.length}
            </div>

            <div className="flex min-w-0 items-center justify-end">
              {resolvedHeaderComponents ?? <div className="size-11" />}
            </div>
          </div>

          <div className="flex h-full items-center justify-center pt-16 pb-0 md:px-16 md:pt-24 md:pb-0">
            <div className="relative w-full max-w-[1400px]">
              <Carousel
                setApi={setCarouselApi}
                opts={{
                  loop: viewerImages.length > 1,
                  startIndex: effectiveStartIndex,
                }}
                className="w-full"
              >
                <CarouselContent className="ml-0">
                  {viewerImages.map((image, index) => (
                    <CarouselItem
                      key={`${image.id ?? image.src ?? "image-viewer-fallback"}-${index}`}
                      className="pl-0"
                    >
                      <div className="flex h-[calc(100vh-6.5rem)] items-center justify-center md:h-[calc(100vh-10rem)]">
                        {image.src ? (
                          <motion.img
                            src={image.src}
                            alt={image.alt}
                            initial={{ scale: 1.04, opacity: 0.78 }}
                            animate={{
                              scale: index === displayedIndex ? 1 : 0.985,
                              opacity: index === displayedIndex ? 1 : 0.78,
                            }}
                            transition={{ duration: 0.38, ease: "easeOut" }}
                            className="block max-h-full max-w-full cursor-grab object-contain active:cursor-grabbing"
                          />
                        ) : (
                          <div className="h-full w-full bg-secondary md:rounded-2xl" />
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>

          {viewerImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => carouselApi?.scrollPrev()}
                aria-label="Back"
                className="bg-overlay/70 hover:bg-overlay/80 fixed top-1/2 left-2 z-[130] inline-flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors md:left-8 md:size-14 md:bg-secondary md:hover:bg-secondary md:hover:text-primary"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={28} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => carouselApi?.scrollNext()}
                aria-label="Next image"
                className="bg-overlay/70 hover:bg-overlay/80 fixed top-1/2 right-2 z-[130] inline-flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors md:right-8 md:size-14 md:bg-secondary md:hover:bg-secondary md:hover:text-primary"
              >
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={28}
                  strokeWidth={2}
                />
              </button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
