import { HugeiconsIcon } from "@hugeicons/react"
import {
  CalendarCheckIn01Icon,
  CalendarCheckOut01Icon,
  Call02Icon,
  Coffee03Icon,
  ComputerDesk01Icon,
  ComputerIcon,
  EquipmentGym01Icon,
  Fan01Icon,
  HomeWifiIcon,
  KitchenUtensilsIcon,
  Moon02Icon,
  OfficeChairIcon,
  PoolIcon,
  WashingMachineIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import type { Amenity } from "@/features/stays/schemas"

const amenityIcons: Record<Amenity, typeof HomeWifiIcon> = {
  "Fast Wi-Fi": HomeWifiIcon,
  "Dedicated desk": ComputerDesk01Icon,
  Monitor: ComputerIcon,
  "Ergonomic chair": OfficeChairIcon,
  "Phone booth": Call02Icon,
  "Standing desk": ComputerDesk01Icon,
  "Self check-in": CalendarCheckIn01Icon,
  "Breakfast included": Coffee03Icon,
  "Coffee station": Coffee03Icon,
  "Air conditioning": Fan01Icon,
  Kitchen: KitchenUtensilsIcon,
  "Laundry machine": WashingMachineIcon,
  "Gym access": EquipmentGym01Icon,
  "Late check-out": CalendarCheckOut01Icon,
  "Quiet hours": Moon02Icon,
  "Swimming pool": PoolIcon,
  Takeout: KitchenUtensilsIcon,
}

type AmenityChipProps = {
  amenity: Amenity
  className?: string
  suffix?: string
}

export function AmenityChip({ amenity, className, suffix }: AmenityChipProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-white/70 bg-white/92 px-2.5 py-1 leading-none font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-950/92 dark:text-slate-100",
        className
      )}
    >
      <span className="inline-flex items-center justify-center leading-none">
        <HugeiconsIcon
          className="shrink-0 text-slate-500 dark:text-slate-300"
          icon={amenityIcons[amenity]}
          size={14}
          strokeWidth={1.9}
        />
      </span>
      <span className="min-w-0 truncate text-[10px] leading-none">
        {amenity}
      </span>
      {suffix ? (
        <span className="shrink-0 text-[10px] leading-none">{suffix}</span>
      ) : null}
    </span>
  )
}
