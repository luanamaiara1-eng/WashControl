import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { AnimatedSection } from "@/components/landing/AnimatedSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      
      <AnimatedSection>
        <PainPointsSection />
      </AnimatedSection>
      
      <AnimatedSection>
        <SolutionSection />
      </AnimatedSection>
      
      <AnimatedSection>
        <FeaturesSection />
      </AnimatedSection>
      
      <AnimatedSection>
        <ComparisonSection />
      </AnimatedSection>
      
      <AnimatedSection>
        <SecuritySection />
      </AnimatedSection>
      
      <AnimatedSection>
        <TestimonialsSection />
      </AnimatedSection>
      
      <AnimatedSection>
        <PricingSection />
      </AnimatedSection>

      <AnimatedSection>
        <FAQSection />
      </AnimatedSection>
      
      <AnimatedSection>
        <CTASection />
      </AnimatedSection>
      
      <Footer />
    </div>
  );
};

export default Index;
