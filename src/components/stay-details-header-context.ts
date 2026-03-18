import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"

export const STAY_DETAILS_INTRO_ID = "stay-details-intro"
export const STAY_DETAILS_SECTION_IDS = {
  amenities: "stay-details-amenities",
  workspace: "stay-details-workspace",
  reviews: "stay-details-reviews",
} as const

const MOBILE_BREAKPOINT = 768
const MOBILE_HEADER_OFFSET = 72
const DESKTOP_HEADER_OFFSET = 92
const MOBILE_MERGE_DISTANCE = 76
const DESKTOP_MERGE_DISTANCE = 88

export type StayDetailsHeaderState = {
  title: string
  subtitle: string
  isSaved: boolean
  isMobileViewport: boolean
  mergeProgress: number
  onShare: () => void
  onToggleSave: () => void
}

type StayDetailsHeaderContextValue = {
  header: StayDetailsHeaderState | null
  setHeader: Dispatch<SetStateAction<StayDetailsHeaderState | null>>
}

export const StayDetailsHeaderContext =
  createContext<StayDetailsHeaderContextValue>({
    header: null,
    setHeader: () => undefined,
  })

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function useStayDetailsHeaderState() {
  return useContext(StayDetailsHeaderContext)
}

export function useStayDetailsHeaderMerge(enabled: boolean) {
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }

    return window.innerWidth < MOBILE_BREAKPOINT
  })
  const [mergeProgress, setMergeProgress] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    )
    const updateViewport = () => {
      setIsMobileViewport(mediaQuery.matches)
    }

    updateViewport()
    mediaQuery.addEventListener?.("change", updateViewport)
    mediaQuery.addListener?.(updateViewport)

    return () => {
      mediaQuery.removeEventListener?.("change", updateViewport)
      mediaQuery.removeListener?.(updateViewport)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) {
      return
    }

    let frameId = 0

    const updateProgress = () => {
      const introElement = document.getElementById(STAY_DETAILS_INTRO_ID)

      if (!introElement) {
        setMergeProgress(0)
        return
      }

      const rect = introElement.getBoundingClientRect()
      const headerOffset = isMobileViewport
        ? MOBILE_HEADER_OFFSET
        : DESKTOP_HEADER_OFFSET
      const mergeDistance = isMobileViewport
        ? MOBILE_MERGE_DISTANCE
        : DESKTOP_MERGE_DISTANCE
      const nextProgress = clamp(
        (headerOffset - rect.top) / mergeDistance,
        0,
        1
      )

      setMergeProgress(nextProgress)
    }

    const requestUpdate = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(updateProgress)
    }

    requestUpdate()
    window.addEventListener("scroll", requestUpdate, { passive: true })
    window.addEventListener("resize", requestUpdate)
    window.addEventListener("orientationchange", requestUpdate)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener("scroll", requestUpdate)
      window.removeEventListener("resize", requestUpdate)
      window.removeEventListener("orientationchange", requestUpdate)
    }
  }, [enabled, isMobileViewport])

  return useMemo(
    () => ({
      isMobileViewport,
      mergeProgress: enabled ? mergeProgress : 0,
    }),
    [enabled, isMobileViewport, mergeProgress]
  )
}
