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
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { MapPin, Calendar, Sparkles, Lock, Bell, BellOff, Clock } from 'lucide-react';

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
  starts_at: string;
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
  
  // Upcoming drop states
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [interestLoading, setInterestLoading] = useState(false);

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

  // Check if user is interested in this drop
  useEffect(() => {
    if (drop && user) {
      checkInterest();
    }
  }, [drop, user]);

  const fetchDrop = async () => {
    try {
      const now = new Date().toISOString();
      
      // First try to get active/live drop
      let { data: activeDrop } = await supabase
        .from('drops')
        .select('*')
        .eq('is_active', true)
        .lt('starts_at', now)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .maybeSingle();

      // If no active drop, try to get upcoming drop
      if (!activeDrop) {
        const { data: upcomingDrop } = await supabase
          .from('drops')
          .select('*')
          .eq('is_active', true)
          .gt('starts_at', now)
          .order('starts_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (upcomingDrop) {
          activeDrop = upcomingDrop;
          setIsUpcoming(true);
        }
      } else {
        setIsUpcoming(false);
      }

      setDrop(activeDrop);

      // Fetch gallery images if drop exists
      if (activeDrop) {
        const { data: images, error: imagesError } = await supabase
          .from('drop_images')
          .select('id, image_url, alt_text, sort_order')
          .eq('drop_id', activeDrop.id)
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

  const checkInterest = async () => {
    if (!drop || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('drop_interests')
        .select('id')
        .eq('drop_id', drop.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsInterested(!!data);
    } catch (error) {
      console.error('Error checking interest:', error);
    }
  };

  const handleToggleInterest = async () => {
    if (!drop || !user) return;

    setInterestLoading(true);
    try {
      if (isInterested) {
        // Remove interest
        const { error } = await supabase
          .from('drop_interests')
          .delete()
          .eq('drop_id', drop.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsInterested(false);
        toast.success(
          language === 'nl' 
            ? 'Interesse verwijderd' 
            : 'Interest removed'
        );
      } else {
        // Add interest
        // First get member_id if exists
        const { data: memberData } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        const { error } = await supabase
          .from('drop_interests')
          .insert({
            drop_id: drop.id,
            user_id: user.id,
            member_id: memberData?.id || null,
            email: user.email || '',
          });

        if (error) throw error;
        setIsInterested(true);
        toast.success(
          language === 'nl' 
            ? 'Interesse geregistreerd! We sturen je een notificatie.' 
            : 'Interest registered! We will notify you.',
          {
            description: language === 'nl'
              ? 'Je ontvangt een melding zodra de drop live gaat.'
              : 'You will receive a notification when the drop goes live.',
          }
        );
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
      toast.error(t.common.error);
    } finally {
      setInterestLoading(false);
    }
  };

  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = async () => {
    if (!drop?.shopify_product_id) {
      toast.error('Product not available');
      return;
    }

    setAddingToCart(true);
    try {
      const title = language === 'nl' ? drop.title_nl : drop.title_en;
      
      addItem({
        dropId: drop.id,
        variantId: drop.shopify_product_id,
        title,
        price: drop.price,
        imageUrl: drop.image_url,
      });

      toast.success(
        language === 'nl' 
          ? 'Toegevoegd aan winkelwagen!' 
          : 'Added to cart!',
        {
          description: language === 'nl'
            ? 'Klik op het winkelwagen icoon om af te rekenen.'
            : 'Click the cart icon to checkout.',
        }
      );
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
    ...(galleryImages.length > 0
      ? galleryImages
      : drop.image_url
      ? [{ id: 'main', image_url: drop.image_url, alt_text: title, sort_order: 0 }]
      : []),
  ];

  // Interest Section for upcoming drops
  const InterestSection = () => {
    if (!isUpcoming) return null;
    
    return (
      <div className="bg-secondary/10 border border-secondary/30 p-6 mb-8 text-center">
        <Bell className="w-8 h-8 mx-auto mb-3 text-secondary" />
        <h3 className="font-serif text-xl mb-2">
          {language === 'nl' ? 'Wil je deze drop niet missen?' : "Don't want to miss this drop?"}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          {language === 'nl' 
            ? 'Klik op geïnteresseerd en ontvang een notificatie zodra de drop live gaat.'
            : 'Click interested and receive a notification when this drop goes live.'}
        </p>
        {user ? (
          <button
            onClick={handleToggleInterest}
            disabled={interestLoading}
            className={`btn-luxury flex items-center gap-2 mx-auto ${isInterested ? 'bg-secondary hover:bg-secondary/90' : ''}`}
          >
            {interestLoading ? (
              t.common.loading
            ) : isInterested ? (
              <>
                <BellOff className="w-4 h-4" />
                {language === 'nl' ? 'Niet meer geïnteresseerd' : 'Remove interest'}
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                {language === 'nl' ? 'Ik ben geïnteresseerd' : "I'm interested"}
              </>
            )}
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link to="/auth" className="underline hover:text-foreground transition-colors">
              {language === 'nl' ? 'Log in om interesse te registreren' : 'Login to register interest'}
            </Link>
          </p>
        )}
      </div>
    );
  };

  // Purchase section component
  const PurchaseSection = ({ mobile = false }: { mobile?: boolean }) => {
    if (memberLoading || authLoading) {
      return (
        <div className={mobile ? "fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border p-4 z-50" : "hidden md:block bg-card border border-border p-6"}>
          <div className="animate-pulse h-12 bg-muted rounded" />
        </div>
      );
    }

    // Show "Coming Soon" for upcoming drops
    if (isUpcoming) {
      if (mobile) {
        return (
          <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border p-4 z-50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-serif text-2xl">€{drop.price.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'nl' ? 'Nog niet beschikbaar' : 'Not available yet'}
                </p>
              </div>
              <button
                disabled
                className="btn-luxury flex-1 opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                {language === 'nl' ? 'Komt Binnenkort' : 'Coming Soon'}
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
              {language === 'nl' ? 'Nog niet beschikbaar' : 'Not available yet'}
            </p>
          </div>
          <button
            disabled
            className="btn-luxury opacity-50 cursor-not-allowed flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            {language === 'nl' ? 'Komt Binnenkort' : 'Coming Soon'}
          </button>
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
      {isUpcoming ? (
        <span className="bg-accent/90 backdrop-blur-sm text-accent-foreground px-3 py-1.5 text-xs font-sans uppercase tracking-wider">
          {language === 'nl' ? 'Binnenkort' : 'Coming Soon'}
        </span>
      ) : (
        <span className="bg-background/90 backdrop-blur-sm text-foreground px-3 py-1.5 text-xs font-sans uppercase tracking-wider border border-border/50">
          {t.drop.limited}
        </span>
      )}
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

          {/* Interest Section for upcoming drops */}
          <InterestSection />

          {/* Stock/Countdown Section */}
          <div className="bg-card border border-border p-6 mb-8">
            {isUpcoming ? (
              <>
                <p className="font-sans text-sm uppercase tracking-widest text-muted-foreground mb-4 text-center">
                  {language === 'nl' ? 'Drop begint over' : 'Drop starts in'}
                </p>
                <CountdownTimer targetDate={new Date(drop.starts_at)} />
                <div className="mt-6 pt-6 border-t border-border">
                  <StockIndicator 
                    quantityAvailable={drop.quantity_available} 
                    quantitySold={drop.quantity_sold} 
                  />
                </div>
              </>
            ) : drop.ends_at ? (
              <>
                <p className="font-sans text-sm uppercase tracking-widest text-muted-foreground mb-4 text-center">
                  {t.drop.endsIn}
                </p>
                <CountdownTimer targetDate={new Date(drop.ends_at)} isLive={true} />
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
