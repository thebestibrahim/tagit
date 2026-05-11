import LenisInit from "@/components/landing/interactive/lenis-init";
import LandingNav from "@/components/landing/nav";
import Hero from "@/components/landing/hero";
import Stats from "@/components/landing/stats";
import Problem from "@/components/landing/problem";
import Pillars from "@/components/landing/pillars";
import HowItWorks from "@/components/landing/how-it-works";
import Industries from "@/components/landing/industries";
import WhyNow from "@/components/landing/why-now";
import Pricing from "@/components/landing/pricing";
import Quote from "@/components/landing/quote";
import CtaSection from "@/components/landing/cta";
import LandingFooter from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <LenisInit />
      <LandingNav />
      <main>
        <Hero />
        <Stats />
        <Problem />
        <Pillars />
        <HowItWorks />
        <Industries />
        <WhyNow />
        <Pricing />
        <Quote />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
