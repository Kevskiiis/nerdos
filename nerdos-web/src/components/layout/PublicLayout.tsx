import { Link, Outlet } from "react-router-dom"
import { useAuthSession } from "@/app/auth-session"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

/** Provides public navigation and a footer for marketing pages. */
export function PublicLayout() {
  const session = useAuthSession()
  return <div className="flex min-h-screen flex-col bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2">
        <Link to="/" className="flex min-h-11 items-center gap-2 font-bold">Nerdos <Badge variant="secondary">Beta</Badge></Link>
        <div className="flex items-center gap-1 sm:gap-3">
          {session.data ? <Link className={buttonVariants({ className: "min-h-11 px-3" })} to="/dashboard">Go to Dashboard</Link> : <>
            <Link className={buttonVariants({ variant: "ghost", className: "min-h-11 px-3" })} to="/login">Log in</Link>
            <Link className={buttonVariants({ className: "min-h-11 px-3" })} to="/register">Get started</Link>
          </>}
        </div>
      </nav>
    </header>
    <main className="flex-1"><Outlet /></main>
    <footer className="border-t"><div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between"><span className="font-semibold text-foreground">Nerdos</span><span>Currently in Beta</span><span>© {new Date().getFullYear()} Nerdos</span></div></footer>
  </div>
}
