import { HeroSection } from "../components/HeroSection"
import { ServicesSection } from "../components/ServicesSection"
import { ComingSoonSection } from "../components/ComingSoonSection"
import { CtaSection } from "../components/CtaSection"

/** Renders the public landing page. */
export function LandingPage() {
  return <><HeroSection /><ServicesSection /><ComingSoonSection /><CtaSection /></>
}
