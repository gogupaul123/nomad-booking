import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { AppProviders } from "@/app/providers"

const shouldEnableReactScan =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_REACT_SCAN === "true"

if (shouldEnableReactScan && !document.querySelector('script[data-react-scan="true"]')) {
  const reactScanScript = document.createElement("script")
  reactScanScript.async = true
  reactScanScript.crossOrigin = "anonymous"
  reactScanScript.dataset.reactScan = "true"
  reactScanScript.src = "//unpkg.com/react-scan/dist/auto.global.js"
  document.head.append(reactScanScript)
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
)
