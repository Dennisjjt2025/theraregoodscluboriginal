import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { CountdownTimer } from '@/components/CountdownTimer';
import { toast } from 'sonner';
import { MapPin, Calendar, Sparkles, Lock } from 'lucide-react';

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
  is_public: boolean | null;
}

export default function Drop() {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [drop, setDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [memberLoading, setMemberLoading] = useState(true);

  // Check if user is a member
  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setIsMember(false);
        setMemberLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error) throw error;
        setIsMember(!!data);
      } catch (error) {
        console.error('Error checking membership:', error);
        setIsMember(false);
      } finally {
        setMemberLoading(false);
      }
    };

    if (!authLoading) {
      checkMembership();
    }
  }, [user, authLoading]);

  // Fetch drop for everyone
  useEffect(() => {
    fetchDrop();
  }, []);

  const fetchDrop = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('drops')
        .select('*')
        .eq('is_active', true)
        .lt('starts_at', now)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .maybeSingle();

      if (error) throw error;
      setDrop(data);
    } catch (error) {
      console.error('Error fetching drop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!drop?.shopify_product_id) {
      toast.error('Product not available');
      return;
    }

    setAddingToCart(true);
    try {
      toast.success('Redirecting to checkout...');
    } catch (error) {
      console.error('Cart error:', error);
      toast.error(t.common.error);
    } finally {
      setAddingToCart(false);
    }
  };

  // Can purchase if member OR drop is public
  const canPurchase = isMember || drop?.is_public === true;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-serif text-xl">{t.common.loading}</div>
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto text-center py-24">
            <h1 className="font-serif text-3xl mb-4">{t.dashboard.noDrop}</h1>
            <p className="text-muted-foreground">Check back soon for the next exclusive drop.</p>
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

  // Purchase section component
  const PurchaseSection = ({ mobile = false }: { mobile?: boolean }) => {
    if (memberLoading || authLoading) {
      return (
        <div className={mobile ? "fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border p-4 z-50" : "hidden md:block bg-card border border-border p-6"}>
          <div className="animate-pulse h-12 bg-muted rounded" />
        </div>
      );
    }

    if (!canPurchase) {
      return (
        <div className={mobile ? "fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border p-4 z-50" : "hidden md:block bg-card border border-border p-6"}>
          <div className="flex items-center gap-3 justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              {t.drop.membersOnlyMessage}
            </p>
          </div>
          <div className={`flex gap-3 ${mobile ? 'mt-3' : 'mt-4 justify-center'}`}>
            {user ? (
              <Link to="/auth" className="btn-outline-luxury text-sm">
                {t.drop.becomeMember}
              </Link>
            ) : (
              <>
                <Link to="/auth" className="btn-luxury text-sm">
                  {t.drop.loginToPurchase}
                </Link>
                <Link to="/auth" className="btn-outline-luxury text-sm">
                  {t.drop.becomeMember}
                </Link>
              </>
            )}
          </div>
        </div>
      );
    }

    // Can purchase - show buy section
    if (mobile) {
      return (
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border p-4 z-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-serif text-2xl">€{drop.price.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {drop.quantity_available - drop.quantity_sold} remaining
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={soldOut || addingToCart}
              className="btn-luxury flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {soldOut ? t.drop.soldOut : addingToCart ? t.common.loading : t.drop.addToCart}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="hidden md:flex items-center justify-between bg-card border border-border p-6">
        <div>
          <p className="font-serif text-3xl">€{drop.price.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">
            {drop.quantity_available - drop.quantity_sold} remaining
          </p>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={soldOut || addingToCart}
          className="btn-luxury disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {soldOut ? t.drop.soldOut : addingToCart ? t.common.loading : t.drop.addToCart}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <Header />
      <main className="pt-20 md:pt-24">
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
              {!drop.is_public && (
                <span className="bg-primary text-primary-foreground px-3 py-1 text-xs font-sans uppercase tracking-wider">
                  {t.drop.membersOnly}
                </span>
              )}
            </div>
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
            </div>
          ) : (
            <div className="bg-card border border-border p-6 mb-12 text-center">
              <p className="font-sans text-sm uppercase tracking-widest text-muted-foreground">
                {t.drop.whileSuppliesLast || 'While Supplies Last'}
              </p>
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
          <PurchaseSection />
        </div>

        {/* Sticky Buy Button (mobile) */}
        <PurchaseSection mobile />
      </main>
    </div>
  );
}
