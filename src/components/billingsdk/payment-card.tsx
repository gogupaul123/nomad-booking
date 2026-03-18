"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowRight } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

export interface finalTextProps {
  text: string
}

export interface PaymentCardProps {
  title: string
  description: string
  price: string
  feature?: string
  featuredescription?: string
  feature2?: string
  feature2description?: string
  finalText?: finalTextProps[]
  onPay?: (data: {
    cardNumber: string
    expiry: string
    cvc: string
  }) => Promise<void> | void
  className?: string
  footerNote?: string
  embedded?: boolean
}

export function PaymentCard({
  title,
  description,
  price,
  finalText = [],
  onPay,
  className,
  footerNote,
  embedded = false,
}: PaymentCardProps) {
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [index, setIndex] = useState(0)
  const [errors, setErrors] = useState<{
    card?: string
    expiry?: string
    cvc?: string
  }>({})

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!/^[0-9 ]{16,19}$/.test(cardNumber)) {
      newErrors.card = "Card number must be 16 digits and only numbers."
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      newErrors.expiry = "Enter a valid expiry date (MM/YY)."
    } else {
      const [month, year] = expiry.split("/").map(Number)
      const now = new Date()
      const expDate = new Date(2000 + year, month - 1)
      if (expDate < now) {
        newErrors.expiry = "Expiry date cannot be in the past."
      }
    }

    if (!/^[0-9]{3,4}$/.test(cvc)) {
      newErrors.cvc = "CVC must be 3 or 4 digits."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePay = () => {
    if (validate()) {
      if (onPay) {
        onPay({ cardNumber, expiry, cvc })
      }
    }
  }

  useEffect(() => {
    if (!finalText || finalText.length === 0) return

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % finalText.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [finalText])

  const content = (
    <div className="flex h-full flex-col">
      <div className="space-y-1">
        <div className="text-xl font-semibold">
          {title || "Payment details"}
        </div>
        <div className="text-sm text-muted-foreground">
          {description || "Enter card details to continue."}
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card number</Label>
            <div className="relative">
              <div className="absolute top-1/2 left-3 z-10 flex h-6 w-8 -translate-y-1/2 items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={index}
                    src={
                      [
                        "https://img.icons8.com/color/48/visa.png",
                        "https://img.icons8.com/color/48/mastercard-logo.png",
                        "https://img.icons8.com/color/48/amex.png",
                        "https://img.icons8.com/color/48/rupay.png",
                      ][index % 4]
                    }
                    alt="card"
                    className="h-6 w-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  />
                </AnimatePresence>
              </div>
              <Input
                id="cardNumber"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="pl-14 font-mono tracking-wider"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>
            {errors.card && (
              <p className="text-sm text-destructive">{errors.card}</p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry date</Label>
              <Input
                id="expiry"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="font-mono"
                placeholder="MM/YY"
                maxLength={5}
              />
              {errors.expiry && (
                <p className="text-sm text-destructive">{errors.expiry}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                type="password"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                className="font-mono"
                placeholder="123"
                maxLength={4}
              />
              {errors.cvc && (
                <p className="text-sm text-destructive">{errors.cvc}</p>
              )}
            </div>
          </div>

          <Separator className="my-2" />

          <div className="space-y-2">
            <Label htmlFor="discount">Discount code (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="discount"
                placeholder="Enter code"
                maxLength={12}
                className="flex-1"
              />
              <Button variant="secondary" type="button">
                Apply
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-4 pt-6">
          <Button className="w-full" onClick={handlePay}>
            Pay ${price || "320"}.00
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {footerNote ? (
            <p className="text-center text-sm text-muted-foreground">
              {footerNote}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (embedded) {
    return (
      <div className={cn("flex h-full flex-col", className)}>
        <div className="flex flex-1 flex-col">{content}</div>
      </div>
    )
  }

  return (
    <div className={cn("mx-auto w-full max-w-4xl", className)}>
      <Card>
        <CardHeader>
          <CardTitle>{title || "Payment details"}</CardTitle>
          <CardDescription>
            {description || "Enter card details to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    </div>
  )
}
