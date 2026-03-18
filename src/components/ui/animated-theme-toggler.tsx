import { useCallback, useRef } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"

import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type AnimatedThemeTogglerProps = React.ComponentPropsWithoutRef<typeof Switch> & {
  duration?: number
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { resolvedTheme, setTheme } = useTheme()
  const containerRef = useRef<HTMLLabelElement>(null)
  const isDark = resolvedTheme === "dark"

  const toggleTheme = useCallback(
    (nextChecked: boolean) => {
      const container = containerRef.current
      if (!container) {
        setTheme(nextChecked ? "dark" : "light")
        return
      }

      const { top, left, width, height } = container.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight
    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    )

      const applyTheme = () => {
        setTheme(nextChecked ? "dark" : "light")
      }

      if (typeof document.startViewTransition !== "function") {
        applyTheme()
        return
      }

      const transition = document.startViewTransition(() => {
        flushSync(applyTheme)
      })

      const ready = transition?.ready
      if (ready && typeof ready.then === "function") {
        ready.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${maxRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            }
          )
        })
      }
    },
    [duration, setTheme]
  )

  return (
    <label
      ref={containerRef}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.45)]",
        className
      )}
    >
      <Sun
        className={cn(
          "size-4 transition-colors",
          isDark ? "text-muted-foreground" : "text-primary"
        )}
      />
      <Switch
        aria-label="Toggle theme"
        checked={isDark}
        onCheckedChange={toggleTheme}
        {...props}
      />
      <Moon
        className={cn(
          "size-4 transition-colors",
          isDark ? "text-primary" : "text-muted-foreground"
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </label>
  )
}
