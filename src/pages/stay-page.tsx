import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { postReview } from "@/features/stays/api-client"
import {
  stayDetailQueryOptions,
  stayKeys,
  stayReviewsQueryOptions,
} from "@/features/stays/query-options"
import { reviewInputSchema } from "@/features/stays/schemas"
import {
  formatCurrency,
  formatDateTime,
  formatSlotRange,
} from "@/lib/formatters"
import { cn } from "@/lib/utils"

export function StayPage() {
  const params = useParams()
  const stayId = params.stayId ?? ""
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const stayQuery = useQuery(stayDetailQueryOptions(stayId))
  const reviewsQuery = useQuery(stayReviewsQueryOptions(stayId))

  const reviewMutation = useMutation({
    mutationFn: (input: unknown) =>
      postReview(stayId, reviewInputSchema.parse(input)),
    onSuccess: () => {
      setFormError(null)
      void queryClient.invalidateQueries({ queryKey: stayKeys.detail(stayId) })
      void queryClient.invalidateQueries({ queryKey: stayKeys.reviews(stayId) })
      void queryClient.invalidateQueries({ queryKey: stayKeys.lists() })
    },
  })

  if (stayQuery.isPending) {
    return <Skeleton className="h-[32rem] rounded-[28px]" />
  }

  if (stayQuery.isError || !stayQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Stay not found</AlertTitle>
        <AlertDescription>
          The details endpoint did not return a stay for this id.
        </AlertDescription>
      </Alert>
    )
  }

  const stay = stayQuery.data

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6 rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_28px_90px_-44px_rgba(18,44,73,0.38)] dark:border-white/10 dark:bg-white/5">
          <Link
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              "w-fit px-0 text-muted-foreground"
            )}
            to="/"
          >
            Back to stays
          </Link>
          <div
            aria-hidden="true"
            className="relative aspect-[16/10] overflow-hidden rounded-[28px] border border-border/60"
            style={{ backgroundImage: stay.visual.gradient }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.55))]" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 text-white">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.42em] text-white/75">
                {stay.visual.eyebrow}
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {stay.name}
              </h1>
              <p className="max-w-2xl text-sm text-white/80 sm:text-base">
                {stay.tagline}
              </p>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
                  Overview
                </p>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {stay.description}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="border border-border/70 bg-muted/35 py-0">
                  <CardHeader>
                    <CardTitle>Remote-work perks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-4">
                    {stay.remoteWorkPerks.map((perk) => (
                      <p className="text-sm text-muted-foreground" key={perk}>
                        {perk}
                      </p>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border border-border/70 bg-muted/35 py-0">
                  <CardHeader>
                    <CardTitle>Stay notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-4">
                    <p className="text-sm text-muted-foreground">
                      Host type: {stay.hostType}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stay.cancellationPolicy}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stay.rating.toFixed(1)} rating across {stay.reviewCount} reviews
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
                  Workspace highlights
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {stay.workspaceHighlights.map((item) => (
                    <span
                      className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-sm"
                      key={item}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Card className="border border-border/70 bg-background/85 py-0">
              <CardHeader>
                <CardTitle>Availability and price</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose one of the mocked booking windows below.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pb-4">
                {stay.availabilitySlots.map((slot) => (
                  <div
                    className="rounded-[20px] border border-border/70 bg-muted/25 p-4"
                    key={slot.id}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">{slot.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatSlotRange(slot.checkIn, slot.checkOut)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {slot.isAvailable
                            ? `${slot.remainingUnits} room${slot.remainingUnits === 1 ? "" : "s"} left`
                            : "Currently sold out"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <p className="text-lg font-semibold">
                          {formatCurrency(slot.totalPrice)}
                        </p>
                        <Link
                          className={buttonVariants({
                            size: "sm",
                            variant: slot.isAvailable ? "default" : "outline",
                          })}
                          to={`/checkout?stayId=${stay.id}&slotId=${slot.id}`}
                        >
                          {slot.isAvailable ? "Reserve this stay" : "Sold out"}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border border-white/70 bg-white/90 py-0 shadow-[0_24px_72px_-40px_rgba(16,42,72,0.38)] dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle>Guest reviews</CardTitle>
              <p className="text-sm text-muted-foreground">
                Moderation is intentionally simple for the challenge scope.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
              {reviewsQuery.isPending ? (
                <Skeleton className="h-32 rounded-[24px]" />
              ) : null}

              {reviewsQuery.data?.reviews.map((review, index) => (
                <div className="space-y-3" key={review.id}>
                  {index > 0 ? <Separator /> : null}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{review.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(review.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                      {review.rating}/5
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {review.comment}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-background/85 py-0">
            <CardHeader>
              <CardTitle>Add a review</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault()
                  const form = event.currentTarget
                  const formData = new FormData(form)

                  const parsedInput = reviewInputSchema.safeParse({
                    author: formData.get("author"),
                    rating: formData.get("rating"),
                    comment: formData.get("comment"),
                  })

                  if (!parsedInput.success) {
                    setFormError(parsedInput.error.issues[0]?.message ?? "Invalid review.")
                    return
                  }

                  try {
                    await reviewMutation.mutateAsync(parsedInput.data)
                    form.reset()
                  } catch (error) {
                    setFormError(
                      error instanceof Error
                        ? error.message
                        : "Unable to save your review."
                    )
                  }
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <Label htmlFor="author">Name</Label>
                    <Input id="author" name="author" placeholder="Alex" />
                  </label>
                  <label className="space-y-2">
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Input id="rating" max={5} min={1} name="rating" type="number" />
                  </label>
                </div>
                <label className="space-y-2">
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    name="comment"
                    placeholder="Share what the work setup and stay experience felt like."
                  />
                </label>
                {formError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Review not submitted</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                ) : null}
                <button
                  className={buttonVariants({
                    size: "lg",
                  })}
                  disabled={reviewMutation.isPending}
                  type="submit"
                >
                  {reviewMutation.isPending ? "Saving review..." : "Submit review"}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
