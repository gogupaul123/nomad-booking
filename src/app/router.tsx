import { createBrowserRouter } from "react-router-dom"

import { AppShell } from "@/components/app-shell"
import { CheckoutPage } from "@/pages/checkout-page"
import { ConfirmationPage } from "@/pages/confirmation-page"
import { HomePage } from "@/pages/home-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { StayPage } from "@/pages/stay-page"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "stays/:stayId",
        element: <StayPage />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        path: "confirmation",
        element: <ConfirmationPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
])
