import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { CountdownTimer } from '@/components/CountdownTimer';
import { MediaLightbox, MediaHero } from '@/components/drop/MediaLightbox';
import { StockIndicator } from '@/components/drop/StockIndicator';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { MapPin, Calendar, Sparkles, Lock, Bell, BellOff, Clock, ShoppingCart } from 'lucide-react';

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const [lightboxShowVideo, setLightboxShowVideo] = useState(false);
  
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
    if (id) {
      fetchDropById(id);
    } else {
      // If no ID, redirect to overview
      navigate('/drop');
    }
  }, [id, navigate]);

  // Subscribe to realtime stock updates
  useEffect(() => {
    if (!drop?.id) return;

    const channel = supabase
      .channel(`drops-stock-${drop.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drops',
          filter: `id=eq.${drop.id}`,
        },
        (payload) => {
          console.log('Realtime stock update:', payload);
          setDrop((prev) => prev ? { 
            ...prev, 
            quantity_sold: payload.new.quantity_sold 
          } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [drop?.id]);

  // Check if user is interested in this drop
  useEffect(() => {
    if (drop && user) {
      checkInterest();
    }
  }, [drop, user]);

  const fetchDropById = async (dropId: string) => {
    try {
      const now = new Date().toISOString();
      
      // Fetch specific drop by ID
      const { data: dropData, error: dropError } = await supabase
        .from('drops')
        .select('*')
        .eq('id', dropId)
        .eq('is_active', true)
        .maybeSingle();

      if (dropError) throw dropError;

      if (!dropData) {
        setDrop(null);
        setLoading(false);
        return;
      }

      // Check if upcoming or live
      const startsAt = new Date(dropData.starts_at);
      const endsAt = dropData.ends_at ? new Date(dropData.ends_at) : null;
      const isDropUpcoming = startsAt > new Date();
      const isDropEnded = endsAt && endsAt < new Date();

      if (isDropEnded) {
        // Drop has ended, redirect to archive
        navigate(`/archive/${dropId}`);
        return;
      }

      setIsUpcoming(isDropUpcoming);
      setDrop(dropData);

      // Fetch gallery images
      const { data: images, error: imagesError } = await supabase
        .from('drop_images')
        .select('id, image_url, alt_text, sort_order')
        .eq('drop_id', dropId)
        .order('sort_order', { ascending: true });

      if (imagesError) throw imagesError;
      setGalleryImages(images || []);
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
    setLightboxShowVideo(false);
    setLightboxOpen(true);
  };

  const openVideo = () => {
    setLightboxIndex(0);
    setLightboxShowVideo(true);
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
  const remaining = drop.quantity_available - drop.quantity_sold;
  const percentageClaimed = Math.round((drop.quantity_sold / drop.quantity_available) * 100);

  // Combine main image with gallery images
  const allImages: GalleryImage[] = [
    ...(galleryImages.length > 0
      ? galleryImages
      : drop.image_url
      ? [{ id: 'main', image_url: drop.image_url, alt_text: title, sort_order: 0 }]
      : []),
  ];

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

  // CTA Section Component - Conversion Optimized
  const CTASection = ({ mobile = false }: { mobile?: boolean }) => {
    if (memberLoading || authLoading) {
      return (
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-muted rounded" />
        </div>
      );
    }

    // Upcoming drop - Coming Soon
    if (isUpcoming) {
      return (
        <div className="space-y-4">
          <button
            disabled
            className="btn-luxury w-full opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            {language === 'nl' ? 'Komt Binnenkort' : 'Coming Soon'}
          </button>
          
          {/* Interest button for upcoming drops */}
          {user ? (
            <button
              onClick={handleToggleInterest}
              disabled={interestLoading}
              className={`btn-outline-luxury w-full flex items-center justify-center gap-2 ${isInterested ? 'bg-secondary/10' : ''}`}
            >
              {interestLoading ? (
                t.common.loading
              ) : isInterested ? (
                <>
                  <BellOff className="w-4 h-4" />
                  {language === 'nl' ? 'Interesse verwijderen' : 'Remove interest'}
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  {language === 'nl' ? 'Laat me weten wanneer live' : 'Notify me when live'}
                </>
              )}
            </button>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              <Link to="/auth" className="underline hover:text-foreground transition-colors">
                {language === 'nl' ? 'Log in om een notificatie te ontvangen' : 'Login to get notified'}
              </Link>
            </p>
          )}
        </div>
      );
    }

    // Not logged in - Show "Exclusief voor leden" box
    if (!user) {
      return (
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 text-center">
            <Lock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {language === 'nl' ? 'Deze drop is exclusief voor leden' : 'This drop is exclusive to members'}
            </p>
          </div>
          <Link to="/auth" className="btn-luxury w-full block text-center">
            {language === 'nl' ? 'Word Lid om te Kopen' : 'Become a Member to Buy'}
          </Link>
          <p className="text-sm text-center text-muted-foreground">
            {language === 'nl' ? 'Al lid? ' : 'Already a member? '}
            <Link to="/auth" className="underline hover:text-foreground transition-colors">
              {language === 'nl' ? 'Log in' : 'Log in'}
            </Link>
          </p>
        </div>
      );
    }

    // Logged in but not a member (and not public drop)
    if (!canPurchase) {
      return (
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 text-center">
            <Lock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {language === 'nl' ? 'Deze drop is exclusief voor leden' : 'This drop is exclusive to members'}
            </p>
          </div>
          <Link to="/membership" className="btn-luxury w-full block text-center">
            {t.drop.becomeMember}
          </Link>
        </div>
      );
    }

    // Can purchase - show Add to Cart
    return (
      <button
        onClick={handleAddToCart}
        disabled={soldOut || addingToCart}
        className="btn-luxury w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <ShoppingCart className="w-4 h-4" />
        {soldOut ? t.drop.soldOut : addingToCart ? t.common.loading : t.drop.addToCart}
      </button>
    );
  };

  // Mobile Sticky CTA
  const MobileCTA = () => {
    if (memberLoading || authLoading) {
      return (
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border p-4 z-50">
          <div className="animate-pulse h-12 bg-muted rounded" />
        </div>
      );
    }

    return (
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border p-4 z-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-shrink-0">
            <p className="font-serif text-2xl">€{drop.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {remaining} {t.drop.remaining}
            </p>
          </div>
          <div className="flex-1">
            {isUpcoming ? (
              <button
                disabled
                className="btn-luxury w-full opacity-50 cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                <Clock className="w-4 h-4" />
                {language === 'nl' ? 'Binnenkort' : 'Coming Soon'}
              </button>
            ) : !user ? (
              <Link to="/auth" className="btn-luxury w-full block text-center text-sm">
                {language === 'nl' ? 'Word Lid' : 'Become Member'}
              </Link>
            ) : !canPurchase ? (
              <Link to="/membership" className="btn-luxury w-full block text-center text-sm">
                {t.drop.becomeMember}
              </Link>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={soldOut || addingToCart}
                className="btn-luxury w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                {soldOut ? t.drop.soldOut : addingToCart ? '...' : t.drop.addToCart}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

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
        initialShowVideo={lightboxShowVideo}
      />

      <main className="pt-20 md:pt-24">
        {/* HERO SECTION - Split Screen on Desktop */}
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* LEFT: Product Media */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <MediaHero
                images={allImages}
                videoUrl={drop.video_url}
                title={title}
                onOpenLightbox={openLightbox}
                onOpenVideo={openVideo}
                badges={heroBadges}
                tapToEnlargeText={drop.video_url ? t.drop.playVideo : t.drop.tapToEnlarge}
                aspectRatio="square"
              />
            </div>

            {/* RIGHT: Product Info & CTA */}
            <div className="space-y-6">
              {/* Badges - Mobile only (desktop shows on image) */}
              <div className="flex flex-wrap gap-2 lg:hidden">
                {isUpcoming ? (
                  <span className="bg-accent text-accent-foreground px-3 py-1.5 text-xs font-sans uppercase tracking-wider">
                    {language === 'nl' ? 'Binnenkort' : 'Coming Soon'}
                  </span>
                ) : (
                  <span className="bg-muted text-foreground px-3 py-1.5 text-xs font-sans uppercase tracking-wider border border-border">
                    {t.drop.limited}
                  </span>
                )}
                {!drop.is_public && (
                  <span className="bg-accent text-accent-foreground px-3 py-1.5 text-xs font-sans uppercase tracking-wider">
                    {t.drop.membersOnly}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight">{title}</h1>
              
              {/* Description */}
              {description && (
                <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
              )}

              {/* Price & Stock - Always Visible */}
              <div className="border-t border-b border-border py-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-serif text-3xl md:text-4xl">€{drop.price.toFixed(2)}</p>
                  {isUpcoming && (
                    <span className="text-sm text-muted-foreground">
                      {language === 'nl' ? 'Nog niet beschikbaar' : 'Not available yet'}
                    </span>
                  )}
                </div>
                
                {/* Stock Indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      <span className="font-serif text-foreground font-medium">{remaining}</span> {t.drop.remaining}
                    </span>
                    <span className="text-muted-foreground">
                      {percentageClaimed}% {t.drop.claimed}
                    </span>
                  </div>
                  <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full bg-secondary transition-all duration-500"
                      style={{ width: `${percentageClaimed}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Countdown for Live/Upcoming drops */}
              {(isUpcoming || drop.ends_at) && (
                <div className="bg-card border border-border p-4">
                  <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-3 text-center">
                    {isUpcoming 
                      ? (language === 'nl' ? 'Drop begint over' : 'Drop starts in')
                      : t.drop.endsIn
                    }
                  </p>
                  <CountdownTimer 
                    targetDate={new Date(isUpcoming ? drop.starts_at : drop.ends_at!)} 
                    isLive={!isUpcoming} 
                  />
                </div>
              )}

              {/* CTA Section - Desktop */}
              <div className="hidden md:block">
                <CTASection />
              </div>
            </div>
          </div>
        </div>

        {/* BELOW THE FOLD - Full Width Sections */}
        <div className="container mx-auto max-w-4xl px-4 mt-16 space-y-12">
          
          {/* Story Section with Attribute Cards */}
          {story && (
            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-6">{t.drop.theStory}</h2>
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Story Text */}
                <div className="flex-1">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{story}</p>
                </div>
                
                {/* Attribute Cards - Next to story on desktop */}
                {hasAttributes && (
                  <div className="lg:w-64 flex-shrink-0 space-y-4">
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
              </div>
            </section>
          )}

          {/* Attribute Cards - If no story, show standalone */}
          {!story && hasAttributes && (
            <section>
              <div className="grid grid-cols-2 gap-4">
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
            </section>
          )}

          {/* Details Section */}
          {tastingNotes && (
            <section className="bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent" />
                <h2 className="font-serif text-xl">{t.drop.details}</h2>
              </div>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{tastingNotes}</p>
            </section>
          )}
        </div>

        {/* Mobile Sticky CTA */}
        <MobileCTA />
      </main>
    </div>
  );
}
