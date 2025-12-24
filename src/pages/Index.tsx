import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { CountdownTimer } from '@/components/CountdownTimer';
import { WaitlistForm } from '@/components/WaitlistForm';
import { Wine, Globe, Award, ArrowRight, Eye } from 'lucide-react';
import logo from '@/assets/logo.png';
import { ScrollIndicator } from '@/components/ScrollIndicator';

interface DropInfo {
  id: string;
  title_en: string;
  title_nl: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
}

export default function Index() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  const [activeDrops, setActiveDrops] = useState<DropInfo[]>([]);
  const [nextDrop, setNextDrop] = useState<DropInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrops();
  }, []);

  const fetchDrops = async () => {
    try {
      const now = new Date().toISOString();

      // Fetch all active drops (started and not ended)
      const { data: activeData, error: activeError } = await supabase
        .from('drops')
        .select('id, title_en, title_nl, starts_at, ends_at, is_active')
        .eq('is_active', true)
        .lte('starts_at', now)
        .order('starts_at', { ascending: false });

      if (activeError) {
        console.error('Error fetching active drops:', activeError);
      }

      // Filter for drops that haven't ended yet
      const currentlyActive = (activeData || []).filter((drop) =>
        !drop.ends_at || new Date(drop.ends_at) > new Date()
      );

      setActiveDrops(currentlyActive);

      // If no active drops, look for upcoming drop
      if (currentlyActive.length === 0) {
        const { data: upcomingData, error: upcomingError } = await supabase
          .from('drops')
          .select('id, title_en, title_nl, starts_at, ends_at, is_active')
          .gt('starts_at', now)
          .eq('is_active', true)
          .order('starts_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (upcomingError) {
          console.error('Error fetching upcoming drops:', upcomingError);
        }

        if (upcomingData) {
          setNextDrop(upcomingData);
        } else {
          setNextDrop(null);
        }
      } else {
        setNextDrop(null);
      }
    } catch (error) {
      console.error('Error fetching drops:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine what to show
  const hasLiveDrops = activeDrops.length > 0;
  const hasMultipleLiveDrops = activeDrops.length > 1;
  const singleLiveDrop = activeDrops.length === 1 ? activeDrops[0] : null;
  
  // For countdown: if single active drop has end date, count down to end.
  // If multiple drops, show generic message.
  // If upcoming, count down to start.
  const countdownDate = singleLiveDrop
    ? singleLiveDrop.ends_at ? new Date(singleLiveDrop.ends_at) : null
    : nextDrop?.starts_at
      ? new Date(nextDrop.starts_at)
      : null;

  const dropTitle = singleLiveDrop 
    ? (language === 'nl' ? singleLiveDrop.title_nl : singleLiveDrop.title_en)
    : null;

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

          {/* Countdown / Live Status */}
          <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {loading ? (
              <div className="animate-pulse h-24 w-64 bg-muted rounded" />
            ) : hasMultipleLiveDrops ? (
              <>
                <p className="font-sans text-sm uppercase tracking-widest text-muted-foreground mb-2">
                  {language === 'nl' ? 'Nu beschikbaar' : 'Now available'}
                </p>
                <p className="font-serif text-2xl text-secondary mb-4">
                  {language === 'nl' 
                    ? `${activeDrops.length} drops nu live!` 
                    : `${activeDrops.length} drops live now!`}
                </p>
                <div className="mt-6">
                  <Link
                    to="/drop"
                    className="btn-luxury inline-flex items-center gap-2"
                  >
                    {language === 'nl' ? 'Bekijk Alle Drops' : 'View All Drops'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : singleLiveDrop ? (
              <>
                <p className="font-sans text-sm uppercase tracking-widest text-muted-foreground mb-2">
                  {dropTitle || 'Drop'}
                </p>
                <p className="font-serif text-lg text-secondary mb-4">
                  {language === 'nl' ? 'Nu beschikbaar!' : 'Now available!'}
                </p>
                {countdownDate && (
                  <CountdownTimer 
                    targetDate={countdownDate} 
                    isLive={true}
                  />
                )}
                <div className="mt-6">
                  <Link
                    to={`/drop/${singleLiveDrop.id}`}
                    className="btn-luxury inline-flex items-center gap-2"
                  >
                    {t.drop.goToDrop}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : countdownDate ? (
              <>
                <p className="font-sans text-sm uppercase tracking-widest text-muted-foreground mb-2">
                  {t.landing.nextDrop}
                </p>
                <CountdownTimer 
                  targetDate={countdownDate} 
                  isLive={false}
                />
              </>
            ) : (
              <p className="font-sans text-muted-foreground">
                {language === 'nl' ? 'Geen aankomende drops gepland' : 'No upcoming drops scheduled'}
              </p>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up mb-24 md:mb-28" style={{ animationDelay: '0.3s' }}>
            {user ? (
              <Link to="/dashboard" className="btn-luxury">
                {t.nav.dashboard}
              </Link>
            ) : (
              <>
                {/* Sneak Peek button - only show when there's an upcoming (not live) drop */}
                {nextDrop && !hasLiveDrops && (
                  <Link to={`/drop/${nextDrop.id}`} className="btn-luxury flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {t.landing.sneakPeek}
                  </Link>
                )}
                <Link to="/auth" className={nextDrop && !hasLiveDrops ? "btn-outline-luxury" : "btn-luxury"}>
                  {t.landing.memberLogin}
                </Link>
                <a href="#waitlist" className="btn-outline-luxury">
                  {t.landing.joinWaitlist}
                </a>
              </>
            )}
          </div>

          {/* Scroll indicator */}
          <ScrollIndicator />
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
