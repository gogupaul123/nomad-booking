import { Link } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function NotFoundPage() {
  return (
    <Card className="border border-border/70 bg-background/85 py-0">
      <CardHeader>
        <CardTitle>Page not found</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        <p className="text-sm text-muted-foreground">
          The route does not exist in this challenge app.
        </p>
        <Link className={buttonVariants()} to="/feed">
          Back to home
        </Link>
      </CardContent>
    </Card>
  )
}
