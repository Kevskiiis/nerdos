import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Providers } from "@/app/providers.tsx"
import { Router } from "@/app/router.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <Providers>
        <Router />
      </Providers>
    </ThemeProvider>
  </StrictMode>
)
