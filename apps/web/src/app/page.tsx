import { Header, Footer } from "@/components/layout"
import {
  HeroSection,
  FeaturesSection,
  SocialProof,
  ValuePropositionSection,
  HowItWorks,
  TargetAudienceSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  CTASection,
  RAGIntelligenceSection
} from "@/components/sections"
import { ROICalculator } from "@/components/interactive"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* 1. Hero - Grab attention */}
        <HeroSection />

        {/* 2. Social Proof - Build trust immediately */}
        <SocialProof />

        {/* 3. Value Proposition - Explain the value */}
        <ValuePropositionSection />

        {/* 4. Target Audience - Who is it for */}
        <TargetAudienceSection />

        {/* 5. How It Works - Simple 4-step process */}
        <HowItWorks />

        {/* 6. Features - All capabilities including Prequalification and White-label */}
        <FeaturesSection />

        {/* 6.5. RAG Intelligence - Show AI answering questions using real data */}
        <RAGIntelligenceSection />

        {/* 7. ROI Calculator - Justify the investment */}
        <ROICalculator />

        {/* 8. Testimonials - Social proof */}
        <TestimonialsSection />

        {/* 9. Pricing - Convert */}
        <PricingSection />

        {/* 10. FAQ + CTA - Remove objections and final push */}
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
