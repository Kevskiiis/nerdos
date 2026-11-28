import { useState } from "react"
import { ArrowRight, RotateCw, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HERO_CONTENT } from "../lib/landing-content"

/** Introduces Nerdos and lets visitors try a sample flashcard. */
export function HeroSection() {
  const [flipped, setFlipped] = useState(false)
  const { flashcard } = HERO_CONTENT
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-12 sm:pt-16 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-24">
      <div className="max-w-xl">
        <Badge variant="secondary" className="h-7 gap-1.5 px-3"><Sparkles className="size-3.5" />{HERO_CONTENT.announcement}</Badge>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">{HERO_CONTENT.headline}</h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">{HERO_CONTENT.description}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to={HERO_CONTENT.primary.href} className={buttonVariants({ size: "lg", className: "min-h-11 w-full gap-2 px-6 sm:w-auto" })}>{HERO_CONTENT.primary.label}<ArrowRight className="size-4" /></Link>
          <Link to={HERO_CONTENT.secondary.href} className={buttonVariants({ variant: "outline", size: "lg", className: "min-h-11 w-full px-6 sm:w-auto" })}>{HERO_CONTENT.secondary.label}</Link>
        </div>
      </div>
      <div className="rounded-4xl bg-muted/50 p-4 sm:p-7">
        <div className="mb-3 flex items-center justify-between px-1 text-xs font-medium text-muted-foreground"><span>YOUR STUDY PREVIEW</span><span>01 / 01</span></div>
        <Card className="min-h-64 p-0">
          <button type="button" aria-pressed={flipped} onClick={() => setFlipped(!flipped)} className="flex min-h-64 w-full flex-1 flex-col items-center justify-between gap-6 rounded-4xl p-7 text-center outline-none focus-visible:ring-4 focus-visible:ring-ring/50">
            <span className="self-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">{flipped ? "Answer" : "Question"}</span>
            <span key={flipped ? "back" : "front"} className="motion-feedback max-w-sm text-xl font-semibold leading-snug sm:text-2xl">{flipped ? flashcard.back : flashcard.front}</span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCw className="size-4" />{flashcard.hint}</span>
          </button>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">A little practice goes a long way.</p>
      </div>
    </section>
  )
}
