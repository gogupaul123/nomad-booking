import { Link } from "react-router-dom"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { formatCurrency } from "@/lib/formatters"
import type { StaySummary } from "@/features/stays/schemas"

export function StayCard({ stay }: { stay: StaySummary }) {
  return (
    <article className="h-full">
      <Card className="h-full border border-white/70 bg-white/90 py-0 shadow-[0_24px_80px_-40px_rgba(16,42,72,0.35)] dark:border-white/10 dark:bg-white/5">
        <div
          aria-hidden="true"
          className="relative flex aspect-[4/3] items-end overflow-hidden rounded-t-xl p-4"
          style={{ backgroundImage: stay.visual.gradient }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.48))]" />
          <div className="relative flex w-full items-end justify-between gap-3 text-white">
            <div>
              <p className="text-[0.7rem] font-black uppercase tracking-[0.36em] text-white/80">
                {stay.visual.eyebrow}
              </p>
              <p className="mt-2 max-w-[14rem] text-sm font-semibold">
                {stay.location.city}, {stay.location.country}
              </p>
            </div>
            <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              {stay.rating.toFixed(1)} / 5
            </div>
          </div>
        </div>
        <CardHeader className="gap-2">
          <CardTitle>{stay.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{stay.tagline}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {stay.tags.map((tag) => (
              <span
                className="rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground">
            {stay.remoteWorkPerks.map((perk) => (
              <div key={perk}>{perk}</div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="mt-auto justify-between gap-4 bg-muted/35">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              From
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(stay.nightlyRate)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / night
              </span>
            </p>
            <p className="text-xs text-muted-foreground">{stay.availabilityLabel}</p>
          </div>
          <Link
            className={buttonVariants({ size: "sm" })}
            to={`/stays/${stay.id}`}
          >
            View stay
          </Link>
        </CardFooter>
      </Card>
    </article>
  )
}
