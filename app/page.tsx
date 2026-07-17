'use client';

import CTA from '@/components/cta.component';
import Features from '@/components/features.component';
import Footer from '@/components/footer.component';
import Hero from '@/components/hero.component';
import LandingaNavbar from '@/components/landing-navbar.component';
import Security from '@/components/security.component';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingaNavbar />
      <Hero />
      <Features />
      <Security />
      <CTA />
      <Footer />
    </div>
  );
}
