import { useMemo, useState, type ReactNode } from "react"

import {
  StayDetailsHeaderContext,
  type StayDetailsHeaderState,
} from "@/components/stay-details-header-context"

export function StayDetailsHeaderProvider({
  children,
}: {
  children: ReactNode
}) {
  const [header, setHeader] = useState<StayDetailsHeaderState | null>(null)

  const value = useMemo(
    () => ({
      header,
      setHeader,
    }),
    [header]
  )

  return (
    <StayDetailsHeaderContext.Provider value={value}>
      {children}
    </StayDetailsHeaderContext.Provider>
  )
}
