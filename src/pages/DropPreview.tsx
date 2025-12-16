import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { CountdownTimer } from '@/components/CountdownTimer';
import { toast } from 'sonner';
import { MapPin, Calendar, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Drop {
  id: string;
  title_en: string;
  title_nl: string;
  description_en: string | null;
  description_nl: string | null;
  story_en: string | null;
  story_nl: string | null;
  tasting_notes_en: string | null;
  tasting_notes_nl: string | null;
  origin: string | null;
  vintage: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  image_url: string | null;
  video_url: string | null;
  shopify_product_id: string | null;
  ends_at: string | null;
  starts_at: string;
  is_active: boolean;
  is_draft: boolean;
}

export default function DropPreview() {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [drop, setDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const dropId = searchParams.get('id');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      checkAdminAndFetchDrop();
    }
  }, [user, authLoading, dropId]);

  const checkAdminAndFetchDrop = async () => {
    try {
      // Check admin status
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) throw roleError;

      if (!roleData) {
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);

      // Fetch drop by ID
      if (dropId) {
        const { data, error } = await supabase
          .from('drops')
          .select('*')
          .eq('id', dropId)
          .single();

        if (error) throw error;
        setDrop(data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-serif text-xl">{t.common.loading}</div>
      </div>
    );
  }

  if (!isAdmin || !drop) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto text-center py-24">
            <h1 className="font-serif text-3xl mb-4">Drop not found</h1>
            <p className="text-muted-foreground">The drop you're looking for doesn't exist.</p>
          </div>
        </main>
      </div>
    );
  }

  const title = language === 'nl' ? drop.title_nl : drop.title_en;
  const description = language === 'nl' ? drop.description_nl : drop.description_en;
  const story = language === 'nl' ? drop.story_nl : drop.story_en;
  const tastingNotes = language === 'nl' ? drop.tasting_notes_nl : drop.tasting_notes_en;
  const soldOut = drop.quantity_sold >= drop.quantity_available;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <Header />
      
      {/* Preview Banner */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-amber-500 text-amber-950 py-2 px-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-center gap-2 text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          <span>PREVIEW MODE - This drop is {drop.is_active ? 'active' : 'not active'} {drop.is_draft ? '(Draft)' : ''}</span>
        </div>
      </div>

      <main className="pt-28 md:pt-32">
        {/* Hero Image */}
        {drop.image_url && (
          <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
            <img
              src={drop.image_url}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-accent text-accent-foreground px-3 py-1 text-xs font-sans uppercase tracking-wider">
                {t.drop.limited}
              </span>
              <span className="bg-primary text-primary-foreground px-3 py-1 text-xs font-sans uppercase tracking-wider">
                {t.drop.membersOnly}
              </span>
            </div>
          </div>
        )}

        {/* Video */}
        {drop.video_url && (
          <div className="container mx-auto max-w-4xl px-4 mt-8">
            <video
              src={drop.video_url}
              controls
              className="w-full rounded-lg"
            />
          </div>
        )}

        <div className="container mx-auto max-w-4xl px-4 -mt-20 relative z-10">
          {/* Title & Meta */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4">{title}</h1>
            {description && (
              <p className="text-lg text-muted-foreground max-w-2xl">{description}</p>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-6 mb-12 text-sm">
            {drop.origin && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.drop.origin}:</span>
                <span>{drop.origin}</span>
              </div>
            )}
            {drop.vintage && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.drop.vintage}:</span>
                <span>{drop.vintage}</span>
              </div>
            )}
          </div>

          {/* Countdown - only show if there's an end date */}
          {drop.ends_at ? (
            <div className="bg-card border border-border p-6 mb-12">
              <p className="font-sans text-sm uppercase tracking-widest text-muted-foreground mb-4 text-center">
                {t.drop.endsIn}
              </p>
              <CountdownTimer targetDate={new Date(drop.ends_at)} />
              <div className="mt-6 text-center">
                <Link
                  to="/drop"
                  className="btn-luxury inline-flex items-center gap-2"
                >
                  {language === 'nl' ? 'Ga naar drop' : 'Go to drop'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border p-6 mb-12 text-center">
              <p className="font-sans text-sm uppercase tracking-widest text-muted-foreground mb-4">
                {t.drop.whileSuppliesLast}
              </p>
              <Link
                to="/drop"
                className="btn-luxury inline-flex items-center gap-2"
              >
                {language === 'nl' ? 'Ga naar drop' : 'Go to drop'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Story Section */}
          {story && (
            <div className="mb-12">
              <h2 className="font-serif text-2xl md:text-3xl mb-6">{t.drop.theStory}</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{story}</p>
              </div>
            </div>
          )}

          {/* Tasting Notes */}
          {tastingNotes && (
            <div className="mb-12 bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-gold" />
                <h2 className="font-serif text-xl">{t.drop.tastingNotes}</h2>
              </div>
              <p className="text-muted-foreground whitespace-pre-line">{tastingNotes}</p>
            </div>
          )}

          {/* Price (desktop) */}
          <div className="hidden md:flex items-center justify-between bg-card border border-border p-6">
            <div>
              <p className="font-serif text-3xl">€{drop.price.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                {drop.quantity_available - drop.quantity_sold} remaining
              </p>
            </div>
            <button
              disabled
              className="btn-luxury disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {soldOut ? t.drop.soldOut : t.drop.addToCart} (Preview)
            </button>
          </div>
        </div>

        {/* Sticky Buy Button (mobile) */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border p-4 z-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-serif text-2xl">€{drop.price.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {drop.quantity_available - drop.quantity_sold} remaining
              </p>
            </div>
            <button
              disabled
              className="btn-luxury flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {soldOut ? t.drop.soldOut : t.drop.addToCart} (Preview)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
