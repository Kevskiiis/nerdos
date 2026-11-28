import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthCardLayoutProps {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

/** Provides a centered, responsive authentication card with a home link and beta badge. */
export function AuthCardLayout({ title, description, children, footer }: AuthCardLayoutProps) {
  return (
    <main className="motion-page flex min-h-dvh w-full min-w-0 flex-1 flex-col items-center justify-center bg-background px-4 py-8 text-foreground">
      <Link to="/" className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span>Nerdos</span>
        <Badge variant="secondary">Beta</Badge>
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle><h1 className="text-xl font-semibold">{title}</h1></CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {children}
          <div className="text-center text-sm text-muted-foreground">{footer}</div>
        </CardContent>
      </Card>
    </main>
  )
}
