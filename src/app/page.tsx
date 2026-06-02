import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LiveTicker from "@/components/landing/LiveTicker";
import AboutSection from "@/components/landing/AboutSection";
import StatsSection from "@/components/landing/StatsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import JoinSection from "@/components/landing/JoinSection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <LiveTicker />
      <AboutSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <JoinSection />
      <Footer />
    </main>
  );
}
