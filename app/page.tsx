import LenisInit from "@/components/landing/interactive/lenis-init";
import { Grain, Vignette } from "@/components/landing/interactive/cinema";
import LandingNav from "@/components/landing/nav";
import Hero from "@/components/landing/hero";
import Stats from "@/components/landing/stats";
import LuxuryGallery from "@/components/landing/luxury-gallery";
import Problem from "@/components/landing/problem";
import Pillars from "@/components/landing/pillars";
import HowItWorks from "@/components/landing/how-it-works";
import Industries from "@/components/landing/industries";
import Pricing from "@/components/landing/pricing";
import CtaSection from "@/components/landing/cta";
import LandingFooter from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <LenisInit />
      {/* One lens over the whole reel: grain and edge falloff, above every
          section but below nothing the visitor can click. */}
      <Grain />
      <Vignette />
      <LandingNav />
      {/* Order is the argument: say what it is and how it works before asking
          anyone to care why. The scan sequence used to sit six sections down,
          after four sections of detail nobody had context for yet. */}
      <main style={{ backgroundColor: "#08080A" }}>
        <Hero />
        <HowItWorks />
        <Pillars />
        <LuxuryGallery />
        <Problem />
        <Stats />
        <Industries />
        <Pricing />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
