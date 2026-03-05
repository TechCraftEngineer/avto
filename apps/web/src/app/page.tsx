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
  RAGIntelligenceSection,
  DataFlowSection,
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

        {/* 3. Value Proposition + Target Audience - What & Who */}
        <div className="bg-muted/20">
          <ValuePropositionSection />
          <TargetAudienceSection />
        </div>

        {/* 4. How It Works + Data Flow - Path from HH to candidate */}
        <div className="bg-background">
          <HowItWorks />
          <DataFlowSection />
        </div>

        {/* 5. Features - All capabilities */}
        <FeaturesSection />

        {/* 6. RAG Intelligence - AI analytics */}
        <RAGIntelligenceSection />

        {/* 7. Testimonials - Social proof before numbers */}
        <TestimonialsSection />

        {/* 8. ROI Calculator - Justify the investment */}
        <ROICalculator />

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
