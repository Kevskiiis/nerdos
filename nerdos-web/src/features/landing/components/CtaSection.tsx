import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { FINAL_CTA_CONTENT } from "../lib/landing-content"

/** Invites visitors to join the Nerdos beta. */
export function CtaSection() {
  return <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
    <div className="rounded-2xl border bg-card p-6 text-center sm:p-10">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{FINAL_CTA_CONTENT.headline}</h2>
      <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{FINAL_CTA_CONTENT.description}</p>
      <Link to={FINAL_CTA_CONTENT.primary.href} className={buttonVariants({ size: "lg", className: "mt-7 min-h-11 w-full px-6 sm:w-auto" })}>{FINAL_CTA_CONTENT.primary.label}</Link>
      <p className="mt-4 text-sm text-muted-foreground">Currently in Beta</p>
    </div>
  </section>
}
