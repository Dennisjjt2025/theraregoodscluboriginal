import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { CountdownTimer } from '@/components/CountdownTimer';
import { MediaLightbox, MediaHero } from '@/components/drop/MediaLightbox';
import { StockIndicator } from '@/components/drop/StockIndicator';
import { CollapsibleStory } from '@/components/drop/CollapsibleStory';
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

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

export default function Drop() {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const [drop, setDrop] = useState<Drop | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [memberLoading, setMemberLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

      // Fetch gallery images if drop exists
      if (data) {
        const { data: images, error: imagesError } = await supabase
          .from('drop_images')
          .select('id, image_url, alt_text, sort_order')
          .eq('drop_id', data.id)
          .order('sort_order', { ascending: true });

        if (imagesError) throw imagesError;
        setGalleryImages(images || []);
      }
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

  const openLightbox = (index: number = 0) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
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
  const hasAttributes = drop.origin || drop.vintage;

  // Combine main image with gallery images
  const allImages: GalleryImage[] = [
    // If there are gallery images, use them; otherwise fall back to main image_url
    ...(galleryImages.length > 0
      ? galleryImages
      : drop.image_url
      ? [{ id: 'main', image_url: drop.image_url, alt_text: title, sort_order: 0 }]
      : []),
  ];

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
                {drop.quantity_available - drop.quantity_sold} {t.drop.remaining}
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
            {drop.quantity_available - drop.quantity_sold} {t.drop.remaining}
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

  // Badges for hero
  const heroBadges = (
    <>
      <span className="bg-background/90 backdrop-blur-sm text-foreground px-3 py-1.5 text-xs font-sans uppercase tracking-wider border border-border/50">
        {t.drop.limited}
      </span>
      {!drop.is_public && (
        <span className="bg-accent/90 backdrop-blur-sm text-accent-foreground px-3 py-1.5 text-xs font-sans uppercase tracking-wider">
          {t.drop.membersOnly}
        </span>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <Header />
      
      {/* Media Lightbox */}
      <MediaLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={allImages}
        videoUrl={drop.video_url}
        title={title}
        initialIndex={lightboxIndex}
      />

      <main className="pt-20 md:pt-24">
        {/* Hero Image with Gallery */}
        <MediaHero
          images={allImages}
          videoUrl={drop.video_url}
          title={title}
          onOpenLightbox={openLightbox}
          badges={heroBadges}
          tapToEnlargeText={drop.video_url ? t.drop.playVideo : t.drop.tapToEnlarge}
        />

        <div className={`container mx-auto max-w-4xl px-4 ${allImages.length > 1 ? 'mt-4' : '-mt-20'} relative z-10`}>
          {/* Title & Description */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4">{title}</h1>
            {description && (
              <p className="text-lg text-muted-foreground max-w-2xl">{description}</p>
            )}
          </div>

          {/* Product Attributes - Only show if data exists */}
          {hasAttributes && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              {drop.origin && (
                <div className="flex items-center gap-3 p-4 bg-card border border-border">
                  <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.drop.origin}</p>
                    <p className="font-medium">{drop.origin}</p>
                  </div>
                </div>
              )}
              {drop.vintage && (
                <div className="flex items-center gap-3 p-4 bg-card border border-border">
                  <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.drop.vintage}</p>
                    <p className="font-medium">{drop.vintage}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stock Indicator */}
          <div className="bg-card border border-border p-6 mb-8">
            {drop.ends_at ? (
              <>
                <p className="font-sans text-sm uppercase tracking-widest text-muted-foreground mb-4 text-center">
                  {t.drop.endsIn}
                </p>
                <CountdownTimer targetDate={new Date(drop.ends_at)} />
                <div className="mt-6 pt-6 border-t border-border">
                  <StockIndicator 
                    quantityAvailable={drop.quantity_available} 
                    quantitySold={drop.quantity_sold} 
                  />
                </div>
              </>
            ) : (
              <>
                <p className="font-sans text-sm uppercase tracking-widest text-muted-foreground mb-4 text-center">
                  {t.drop.whileSuppliesLast}
                </p>
                <StockIndicator 
                  quantityAvailable={drop.quantity_available} 
                  quantitySold={drop.quantity_sold} 
                />
              </>
            )}
          </div>

          {/* Story Section - Collapsible on mobile */}
          {story && (
            <div className="mb-8">
              <CollapsibleStory story={story} title={t.drop.theStory} />
            </div>
          )}

          {/* Details Section (formerly Tasting Notes) - Only show if content exists */}
          {tastingNotes && (
            <div className="mb-8 bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent" />
                <h2 className="font-serif text-xl">{t.drop.details}</h2>
              </div>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{tastingNotes}</p>
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
