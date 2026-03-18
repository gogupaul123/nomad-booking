import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Tick02Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"

function Select<Value, Multiple extends boolean | undefined = false>({
  modal = false,
  ...props
}: SelectPrimitive.Root.Props<Value, Multiple>) {
  return <SelectPrimitive.Root modal={modal} {...props} />
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = "default",
  iconMode = "unfold",
  iconClassName,
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
  iconMode?: "unfold" | "none"
  iconClassName?: string
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit cursor-pointer items-center justify-between gap-1.5 rounded-lg border-2 border-border/80 bg-background/95 py-1 pr-2.5 pl-3 text-sm whitespace-nowrap text-foreground transition-[border-color,box-shadow,background-color,transform] duration-200 ease-out outline-none select-none hover:border-primary/45 hover:bg-primary/5 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/18 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground data-[popup-open]:border-primary data-[popup-open]:bg-background data-[popup-open]:shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-primary)_42%,transparent),0_18px_38px_-24px_color-mix(in_oklch,var(--color-primary)_55%,transparent)] data-[size=default]:h-10 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:border-white/12 dark:bg-white/6 dark:hover:border-primary/60 dark:hover:bg-primary/10 dark:data-[popup-open]:border-primary/80 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      {iconMode !== "none" ? (
        <SelectPrimitive.Icon
          className={cn(
            "pointer-events-none shrink-0 text-muted-foreground transition-transform duration-200 ease-out data-[popup-open]:rotate-180",
            iconClassName
          )}
          render={
            <HugeiconsIcon
              className="size-4"
              icon={UnfoldMoreIcon}
              strokeWidth={2}
            />
          }
        />
      ) : null}
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = false,
  matchTriggerWidth = true,
  collisionAvoidance,
  ...props
}: SelectPrimitive.Popup.Props &
  ({
    matchTriggerWidth?: boolean
  } & Pick<
    SelectPrimitive.Positioner.Props,
    | "align"
    | "alignOffset"
    | "side"
    | "sideOffset"
    | "alignItemWithTrigger"
    | "collisionAvoidance"
  >)) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        collisionAvoidance={collisionAvoidance}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "relative isolate z-50 max-h-(--available-height) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-2xl bg-background/98 text-popover-foreground shadow-[0_22px_52px_-28px_rgba(18,44,73,0.35)] ring-1 ring-primary/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-white/10 dark:bg-slate-950/96 dark:shadow-[0_26px_60px_-30px_rgba(2,8,23,0.82)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            matchTriggerWidth ? "w-(--anchor-width)" : "w-auto",
            className
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List className="p-1.5">
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  showIndicator = false,
  children,
  ...props
}: SelectPrimitive.Item.Props & {
  showIndicator?: boolean
}) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-1.5 rounded-xl py-2 pr-8 pl-2.5 text-sm text-foreground outline-hidden transition-colors duration-150 select-none hover:bg-primary/9 focus:bg-primary/9 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-primary/9 data-[selected]:bg-primary/10 data-[selected]:font-semibold data-[selected]:text-primary [&_svg]:pointer-events-none [&_svg]:shrink-0 data-[selected]:[&_svg]:text-primary [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText
        data-slot="select-item-text"
        className="flex flex-1 shrink-0 items-center gap-2 whitespace-nowrap"
      >
        {children}
      </SelectPrimitive.ItemText>
      {showIndicator ? (
        <SelectPrimitive.ItemIndicator
          render={
            <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
          }
        >
          <HugeiconsIcon
            className="pointer-events-none size-4"
            icon={Tick02Icon}
            strokeWidth={2}
          />
        </SelectPrimitive.ItemIndicator>
      ) : null}
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none mx-auto my-3 block h-px w-4/5 bg-border/70",
        className
      )}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-background/98 py-1 text-muted-foreground dark:bg-slate-950/96 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-background/98 py-1 text-muted-foreground dark:bg-slate-950/96 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
