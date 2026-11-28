import { HeroSection } from "../components/HeroSection"
import { ServicesSection } from "../components/ServicesSection"
import { ComingSoonSection } from "../components/ComingSoonSection"
import { NoteDemoSection } from "../components/NoteDemoSection"
import { CtaSection } from "../components/CtaSection"

/** Renders the public landing page. */
export function LandingPage() {
  return <div className="motion-page"><HeroSection /><ServicesSection /><NoteDemoSection /><ComingSoonSection /><CtaSection /></div>
}
