import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Security } from "@/components/landing/Security";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <HowItWorks />
      <Features />
      <Security />
      <Footer />
    </div>
  );
};

export default Index;
