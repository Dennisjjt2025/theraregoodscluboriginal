import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { CountdownTimer } from '@/components/CountdownTimer';
import { StockIndicator } from '@/components/drop/StockIndicator';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { Wine, ArrowRight, Clock } from 'lucide-react';

interface Drop {
  id: string;
  title_en: string;
  title_nl: string;
  description_en: string | null;
  description_nl: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  is_public: boolean | null;
}

export default function DropsOverview() {
  const { t, language } = useLanguage();
  const [activeDrops, setActiveDrops] = useState<Drop[]>([]);
  const [upcomingDrops, setUpcomingDrops] = useState<Drop[]>([]);
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
        .select('*')
        .eq('is_active', true)
        .lt('starts_at', now)
        .order('starts_at', { ascending: false });

      if (activeError) throw activeError;

      // Filter out ended drops
      const currentlyActive = (activeData || []).filter(
        (drop) => !drop.ends_at || new Date(drop.ends_at) > new Date()
      );
      setActiveDrops(currentlyActive);

      // Fetch upcoming drops
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('drops')
        .select('*')
        .eq('is_active', true)
        .gt('starts_at', now)
        .order('starts_at', { ascending: true });

      if (upcomingError) throw upcomingError;
      setUpcomingDrops(upcomingData || []);
    } catch (error) {
      console.error('Error fetching drops:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-serif text-xl">{t.common.loading}</div>
      </div>
    );
  }

  const hasNoDrops = activeDrops.length === 0 && upcomingDrops.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl mb-4">
              {language === 'nl' ? 'Alle Drops' : 'All Drops'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {language === 'nl'
                ? 'Ontdek onze exclusieve releases'
                : 'Discover our exclusive releases'}
            </p>
          </div>

          {/* No Drops State */}
          {hasNoDrops && (
            <div className="text-center py-24">
              <Wine className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
              <h2 className="font-serif text-2xl mb-4">{t.dashboard.noDrop}</h2>
              <p className="text-muted-foreground mb-8">
                {language === 'nl'
                  ? 'Er zijn momenteel geen drops beschikbaar. Bekijk het archief.'
                  : 'No drops are currently available. Check out the archive.'}
              </p>
              <Link to="/archive" className="btn-outline-luxury">
                {language === 'nl' ? 'Bekijk Archief' : 'View Archive'}
              </Link>
            </div>
          )}

          {/* Active Drops Section */}
          {activeDrops.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <span className="bg-secondary text-secondary-foreground px-3 py-1 text-sm font-sans uppercase tracking-wider">
                  {language === 'nl' ? 'Nu Live' : 'Live Now'}
                </span>
                <h2 className="font-serif text-2xl">
                  {activeDrops.length === 1
                    ? language === 'nl'
                      ? '1 Drop beschikbaar'
                      : '1 Drop available'
                    : language === 'nl'
                    ? `${activeDrops.length} Drops beschikbaar`
                    : `${activeDrops.length} Drops available`}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeDrops.map((drop) => (
                  <DropCard key={drop.id} drop={drop} isUpcoming={false} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Drops Section */}
          {upcomingDrops.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-8">
                <span className="bg-accent text-accent-foreground px-3 py-1 text-sm font-sans uppercase tracking-wider">
                  {language === 'nl' ? 'Binnenkort' : 'Coming Soon'}
                </span>
                <h2 className="font-serif text-2xl">
                  {upcomingDrops.length === 1
                    ? language === 'nl'
                      ? '1 Aankomende Drop'
                      : '1 Upcoming Drop'
                    : language === 'nl'
                    ? `${upcomingDrops.length} Aankomende Drops`
                    : `${upcomingDrops.length} Upcoming Drops`}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingDrops.map((drop) => (
                  <DropCard key={drop.id} drop={drop} isUpcoming={true} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

// Drop Card Component
function DropCard({ drop, isUpcoming }: { drop: Drop; isUpcoming: boolean }) {
  const { t, language } = useLanguage();
  const title = language === 'nl' ? drop.title_nl : drop.title_en;
  const remaining = drop.quantity_available - (drop.quantity_sold || 0);

  return (
    <Link
      to={`/drop/${drop.id}`}
      className="group bg-card border border-border overflow-hidden hover:border-secondary/50 transition-colors"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted">
        {drop.image_url ? (
          <img
            src={getOptimizedImageUrl(drop.image_url, { width: 600, quality: 80 })}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Wine className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isUpcoming ? (
            <span className="bg-accent/90 backdrop-blur-sm text-accent-foreground px-2 py-1 text-xs font-sans uppercase tracking-wider">
              {language === 'nl' ? 'Binnenkort' : 'Coming Soon'}
            </span>
          ) : (
            <span className="bg-secondary/90 backdrop-blur-sm text-secondary-foreground px-2 py-1 text-xs font-sans uppercase tracking-wider">
              Live
            </span>
          )}
          {!drop.is_public && (
            <span className="bg-background/90 backdrop-blur-sm text-foreground px-2 py-1 text-xs font-sans uppercase tracking-wider border border-border/50">
              {t.drop.membersOnly}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="font-serif text-xl line-clamp-2 group-hover:text-secondary transition-colors">
          {title}
        </h3>

        <div className="flex items-center justify-between">
          <p className="font-serif text-xl">€{drop.price.toFixed(2)}</p>
          {!isUpcoming && (
            <p className="text-sm text-muted-foreground">
              {remaining} {t.drop.remaining}
            </p>
          )}
        </div>

        {/* Stock Indicator for live drops */}
        {!isUpcoming && (
          <StockIndicator
            quantityAvailable={drop.quantity_available}
            quantitySold={drop.quantity_sold || 0}
          />
        )}

        {/* Countdown for upcoming or ending drops */}
        {(isUpcoming || drop.ends_at) && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Clock className="w-3 h-3" />
              <span>
                {isUpcoming
                  ? language === 'nl'
                    ? 'Start over'
                    : 'Starts in'
                  : language === 'nl'
                  ? 'Eindigt over'
                  : 'Ends in'}
              </span>
            </div>
            <CountdownTimer
              targetDate={new Date(isUpcoming ? drop.starts_at : drop.ends_at!)}
              isLive={!isUpcoming}
            />
          </div>
        )}

        {/* CTA */}
        <div className="pt-3">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-secondary group-hover:gap-3 transition-all">
            {isUpcoming
              ? language === 'nl'
                ? 'Bekijk Preview'
                : 'View Preview'
              : language === 'nl'
              ? 'Bekijk Drop'
              : 'View Drop'}
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
