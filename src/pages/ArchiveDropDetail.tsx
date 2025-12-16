import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CollapsibleStory } from '@/components/drop/CollapsibleStory';
import { MediaLightbox } from '@/components/drop/MediaLightbox';
import { ArrowLeft, Calendar, MapPin, Clock, CheckCircle, XCircle, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';

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
  price: number;
  image_url: string | null;
  video_url: string | null;
  ends_at: string | null;
  starts_at: string;
  origin: string | null;
  vintage: string | null;
  quantity_sold: number | null;
  quantity_available: number;
}

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

export default function ArchiveDropDetail() {
  const { dropId } = useParams<{ dropId: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [drop, setDrop] = useState<Drop | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Fetch drop
  useEffect(() => {
    const fetchDrop = async () => {
      if (!dropId) return;
      setLoading(true);
      
      const { data: dropData, error } = await supabase
        .from('drops')
        .select('*')
        .eq('id', dropId)
        .maybeSingle();

      if (!error && dropData) {
        setDrop(dropData);
        
        // Fetch gallery images
        const { data: images } = await supabase
          .from('drop_images')
          .select('*')
          .eq('drop_id', dropId)
          .order('sort_order', { ascending: true });
        
        if (images) setGalleryImages(images);
      }
      setLoading(false);
    };
    fetchDrop();
  }, [dropId]);

  // Check if user purchased this drop
  useEffect(() => {
    const checkPurchase = async () => {
      if (!user || !dropId) return;
      
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (member) {
        const { data: participation } = await supabase
          .from('drop_participation')
          .select('purchased')
          .eq('member_id', member.id)
          .eq('drop_id', dropId)
          .maybeSingle();
        
        if (participation?.purchased) {
          setPurchased(true);
        }
      }
    };
    checkPurchase();
  }, [user, dropId]);

  const dateLocale = language === 'nl' ? nl : enUS;

  const archiveDetailTranslations = {
    en: {
      dropEnded: 'This drop has ended',
      endedOn: 'Ended on',
      youPurchased: 'You purchased this drop',
      youMissed: 'You missed this drop',
      backToArchive: 'Back to Archive',
      soldUnits: 'units sold',
      details: 'Details',
      theStory: 'The Story',
    },
    nl: {
      dropEnded: 'Deze drop is afgelopen',
      endedOn: 'Geëindigd op',
      youPurchased: 'Je hebt deze drop gekocht',
      youMissed: 'Je hebt deze drop gemist',
      backToArchive: 'Terug naar Archief',
      soldUnits: 'stuks verkocht',
      details: 'Details',
      theStory: 'Het Verhaal',
    },
  };

  const at = archiveDetailTranslations[language];

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 text-center">
          <Archive className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">Drop not found</p>
          <Link to="/archive">
            <Button variant="outline">{at.backToArchive}</Button>
          </Link>
        </main>
      </div>
    );
  }

  const title = language === 'nl' ? drop.title_nl : drop.title_en;
  const description = language === 'nl' ? drop.description_nl : drop.description_en;
  const story = language === 'nl' ? drop.story_nl : drop.story_en;
  const tastingNotes = language === 'nl' ? drop.tasting_notes_nl : drop.tasting_notes_en;
  const endDate = drop.ends_at ? format(new Date(drop.ends_at), 'PPP', { locale: dateLocale }) : null;

  // Convert images to GalleryImage format for MediaLightbox
  const allImages = [
    ...(drop.image_url ? [{ 
      id: 'main', 
      image_url: drop.image_url, 
      alt_text: title, 
      sort_order: 0 
    }] : []),
    ...galleryImages,
  ];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Lightbox */}
      <MediaLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={allImages}
        videoUrl={drop.video_url}
        title={title}
        initialIndex={lightboxIndex}
      />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Back button */}
        <Link
          to="/archive"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {at.backToArchive}
        </Link>

        {/* Ended banner */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-8 flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{at.dropEnded}</p>
            {endDate && (
              <p className="text-sm text-muted-foreground">{at.endedOn} {endDate}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            {/* Main image */}
            {allImages.length > 0 && (
              <div
                className="aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer"
                onClick={() => openLightbox(0)}
              >
                <img
                  src={allImages[0].image_url}
                  alt={allImages[0].alt_text || title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.slice(1, 5).map((img, idx) => (
                  <div
                    key={img.id}
                    className="aspect-square overflow-hidden rounded-md bg-muted cursor-pointer"
                    onClick={() => openLightbox(idx + 1)}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Purchase status */}
            {purchased ? (
              <Badge className="bg-primary text-primary-foreground flex items-center gap-1 w-fit">
                <CheckCircle className="h-3 w-3" />
                {at.youPurchased}
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                <XCircle className="h-3 w-3" />
                {at.youMissed}
              </Badge>
            )}

            <div>
              <h1 className="font-serif text-3xl md:text-4xl mb-2">{title}</h1>
              <p className="text-2xl font-medium text-primary">€{drop.price}</p>
            </div>

            {description && (
              <p className="text-muted-foreground leading-relaxed">{description}</p>
            )}

            {/* Attributes */}
            <div className="flex flex-wrap gap-4 text-sm">
              {drop.origin && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{drop.origin}</span>
                </div>
              )}
              {drop.vintage && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{drop.vintage}</span>
                </div>
              )}
            </div>

            {/* Sold info */}
            {drop.quantity_sold !== null && drop.quantity_sold > 0 && (
              <p className="text-sm text-muted-foreground">
                {drop.quantity_sold} / {drop.quantity_available} {at.soldUnits}
              </p>
            )}

            {/* Story */}
            {story && (
              <div>
                <CollapsibleStory story={story} title={at.theStory} />
              </div>
            )}

            {/* Tasting Notes / Details */}
            {tastingNotes && (
              <div>
                <h2 className="font-serif text-xl mb-3">{at.details}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{tastingNotes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
