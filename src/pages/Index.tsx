import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { CountdownTimer } from '@/components/CountdownTimer';
import { WaitlistForm } from '@/components/WaitlistForm';
import { Wine, Globe, Award } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function Index() {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Next drop date - can be made dynamic from the database
  const nextDropDate = new Date();
  nextDropDate.setDate(nextDropDate.getDate() + 7);
  nextDropDate.setHours(20, 0, 0, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <main className="pt-20 md:pt-24">
        <section className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
          {/* Background texture overlay */}
          <div className="absolute inset-0 paper-texture pointer-events-none" />
          
          {/* Logo */}
          <div className="mb-8 animate-fade-in">
            <img 
              src={logo} 
              alt="The Rare Goods Club" 
              className="w-32 h-32 md:w-48 md:h-48 mx-auto opacity-90"
            />
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-medium tracking-tight mb-4 animate-slide-up">
            {t.landing.heroTitle}
          </h1>
          
          <p className="font-sans text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {t.landing.heroSubtitle}
          </p>

          {/* Countdown */}
          <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="font-sans text-sm uppercase tracking-widest text-muted-foreground mb-4">
              {t.landing.nextDrop}
            </p>
            <CountdownTimer targetDate={nextDropDate} />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {user ? (
              <Link to="/dashboard" className="btn-luxury">
                {t.nav.dashboard}
              </Link>
            ) : (
              <>
                <Link to="/auth" className="btn-luxury">
                  {t.landing.memberLogin}
                </Link>
                <a href="#waitlist" className="btn-outline-luxury">
                  {t.landing.joinWaitlist}
                </a>
              </>
            )}
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-muted-foreground/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 bg-card">
          <div className="container mx-auto max-w-4xl">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto flex items-center justify-center border border-border">
                  <Wine className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-serif text-xl">{t.landing.exclusiveAccess}</h3>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto flex items-center justify-center border border-border">
                  <Globe className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-serif text-xl">{t.landing.curatedDrops}</h3>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto flex items-center justify-center border border-border">
                  <Award className="w-8 h-8 text-gold" />
                </div>
                <h3 className="font-serif text-xl">{t.landing.limitedEditions}</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Waitlist Section */}
        <section id="waitlist" className="py-24 px-4">
          <div className="container mx-auto max-w-lg text-center">
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              {t.landing.waitlistTitle}
            </h2>
            <p className="text-muted-foreground mb-12">
              {t.landing.waitlistSubtitle}
            </p>
            <WaitlistForm />
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="container mx-auto text-center">
            <p className="font-sans text-sm text-muted-foreground">
              © {new Date().getFullYear()} The Rare Goods Club. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
