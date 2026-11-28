import { BookOpenText, Boxes, Brain, LayoutDashboard } from "lucide-react"
import { Card } from "@/components/ui/card"
import { EXISTING_SERVICES } from "../lib/landing-content"

const icons = [BookOpenText, Boxes, Brain, LayoutDashboard]

/** Shows the study tools currently available in Nerdos. */
export function ServicesSection() {
  return <section aria-labelledby="services-title" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
    <p className="text-sm font-semibold text-foreground">YOUR STUDY WORKSPACE</p>
    <h2 id="services-title" className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to study smarter</h2>
    <p className="mt-4 max-w-2xl text-muted-foreground">From your first note to your next review, keep your study routine in one place.</p>
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
      {EXISTING_SERVICES.map((service, index) => { const Icon = icons[index]; return <Card key={service.title} className="gap-4 border border-border p-6 shadow-none">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10"><Icon aria-hidden="true" className="h-5 w-5 text-primary" /></div>
        <h3 className="text-lg font-semibold">{service.title}</h3><p className="leading-relaxed text-muted-foreground">{service.description}</p>
      </Card> })}
    </div>
  </section>
}
