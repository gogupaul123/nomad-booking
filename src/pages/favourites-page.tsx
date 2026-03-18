import { Link } from "react-router-dom"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function FavouritesPage() {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <p className="text-[0.72rem] font-black tracking-[0.42em] text-primary uppercase">
          Favourites
        </p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Shortlist stays you want to come back to.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          This route is in place as part of the app shell and navigation
          foundation. Saved-booking behavior can plug into this screen next.
        </p>
      </div>

      <Alert className="border-border/70 bg-card/80">
        <AlertTitle>No favourites yet</AlertTitle>
        <AlertDescription className="mt-2 space-y-4">
          <p>
            Browse the feed and start saving the stays that fit your shortlist.
          </p>
          <Link
            className={cn(buttonVariants({ size: "sm" }), "w-fit")}
            to="/feed"
          >
            Explore the feed
          </Link>
        </AlertDescription>
      </Alert>
    </div>
  )
}
