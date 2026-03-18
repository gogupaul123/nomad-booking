import { useSyncExternalStore } from "react"

import {
  stayActivityStorageSchema,
  stayCardSchema,
  type StayActivityStorage,
} from "@/features/stays/schemas"

const STAY_ACTIVITY_STORAGE_KEY = "nomad-cafe.stay-activity.v1"
const EMPTY_STAY_ACTIVITY: StayActivityStorage = {
  version: 1,
  recentlyViewed: [],
  saved: [],
}
const MAX_RECENTLY_VIEWED_STAYS = 12

let cachedStayActivity: StayActivityStorage | null = null
const storeListeners = new Set<() => void>()
let hasRegisteredStorageListener = false

function emitStoreChange() {
  for (const listener of storeListeners) {
    listener()
  }
}

function parseStoredStayActivity(value: string | null) {
  if (!value) {
    return EMPTY_STAY_ACTIVITY
  }

  let parsedValue: unknown

  try {
    parsedValue = JSON.parse(value)
  } catch {
    return EMPTY_STAY_ACTIVITY
  }

  const parsed = stayActivityStorageSchema.safeParse(parsedValue)
  if (!parsed.success) {
    return EMPTY_STAY_ACTIVITY
  }

  return parsed.data
}

function readStoredStayActivity() {
  if (typeof window === "undefined") {
    return EMPTY_STAY_ACTIVITY
  }

  if (cachedStayActivity) {
    return cachedStayActivity
  }

  cachedStayActivity = parseStoredStayActivity(
    window.localStorage.getItem(STAY_ACTIVITY_STORAGE_KEY)
  )

  return cachedStayActivity
}

function persistStayActivity(nextState: StayActivityStorage) {
  cachedStayActivity = nextState

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STAY_ACTIVITY_STORAGE_KEY,
      JSON.stringify(nextState)
    )
  }

  emitStoreChange()
}

function subscribeToStayActivity(listener: () => void) {
  storeListeners.add(listener)

  if (!hasRegisteredStorageListener && typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (
        event.storageArea !== window.localStorage ||
        event.key !== STAY_ACTIVITY_STORAGE_KEY
      ) {
        return
      }

      cachedStayActivity = parseStoredStayActivity(event.newValue)
      emitStoreChange()
    })

    hasRegisteredStorageListener = true
  }

  return () => {
    storeListeners.delete(listener)
  }
}

function createEntry(stay: unknown) {
  return {
    stay: stayCardSchema.parse(stay),
    updatedAt: new Date().toISOString(),
  }
}

export function getStoredStayActivity() {
  return readStoredStayActivity()
}

export function clearStoredStayActivity() {
  cachedStayActivity = EMPTY_STAY_ACTIVITY

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STAY_ACTIVITY_STORAGE_KEY)
  }

  emitStoreChange()
}

export function recordRecentlyViewedStay(stay: unknown) {
  const entry = createEntry(stay)
  const currentState = readStoredStayActivity()

  persistStayActivity({
    ...currentState,
    recentlyViewed: [
      entry,
      ...currentState.recentlyViewed.filter(
        (currentEntry) => currentEntry.stay.id !== entry.stay.id
      ),
    ].slice(0, MAX_RECENTLY_VIEWED_STAYS),
  })
}

export function toggleSavedStay(stay: unknown) {
  const entry = createEntry(stay)
  const currentState = readStoredStayActivity()
  const alreadySaved = currentState.saved.some(
    (currentEntry) => currentEntry.stay.id === entry.stay.id
  )

  persistStayActivity({
    ...currentState,
    saved: alreadySaved
      ? currentState.saved.filter(
          (currentEntry) => currentEntry.stay.id !== entry.stay.id
        )
      : [
          entry,
          ...currentState.saved.filter(
            (currentEntry) => currentEntry.stay.id !== entry.stay.id
          ),
        ],
  })

  return !alreadySaved
}

export function isStaySaved(stayId: string) {
  return readStoredStayActivity().saved.some((entry) => entry.stay.id === stayId)
}

export function useStayActivity() {
  return useSyncExternalStore(
    subscribeToStayActivity,
    getStoredStayActivity,
    () => EMPTY_STAY_ACTIVITY
  )
}

export function useIsStaySaved(stayId: string) {
  return useSyncExternalStore(
    subscribeToStayActivity,
    () => isStaySaved(stayId),
    () => false
  )
}

export function getSavedStayCards() {
  return readStoredStayActivity().saved.map((entry) => entry.stay)
}

export function getRecentlyViewedStayCards() {
  return readStoredStayActivity().recentlyViewed.map((entry) => entry.stay)
}

export function getSavedStayIds() {
  return new Set(readStoredStayActivity().saved.map((entry) => entry.stay.id))
}
