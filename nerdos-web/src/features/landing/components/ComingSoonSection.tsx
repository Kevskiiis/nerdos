import { Bot, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { COMING_SOON_SERVICES } from "../lib/landing-content"

const icons = [Sparkles, Bot]

/** Previews planned AI capabilities separately from available tools. */
export function ComingSoonSection() {
  return <section aria-labelledby="coming-soon-title" className="border-y bg-muted/40">
    <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <p className="text-sm font-semibold text-primary">WHAT'S NEXT</p>
      <h2 id="coming-soon-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">More ways to learn, on the way</h2>
      <p className="mt-4 max-w-2xl text-muted-foreground">We're exploring AI tools to help you turn your materials into meaningful practice.</p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
        {COMING_SOON_SERVICES.map((service, index) => { const Icon = icons[index]; return <Card key={service.title} className="gap-4 border border-border p-6 shadow-none">
          <div className="flex items-center justify-between gap-3"><Icon aria-hidden="true" className="h-5 w-5 text-primary" /><Badge variant="outline">Coming Soon</Badge></div>
          <h3 className="text-lg font-semibold">{service.title}</h3><p className="leading-relaxed text-muted-foreground">{service.description}</p>
        </Card> })}
      </div>
    </div>
  </section>
}
