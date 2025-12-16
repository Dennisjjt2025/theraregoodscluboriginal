import { useLanguage } from '@/contexts/LanguageContext';
import { DropFormData } from './DropEditorForm';
import { MediaHero } from '@/components/drop/MediaLightbox';
import { StockIndicator } from '@/components/drop/StockIndicator';
import { CollapsibleStory } from '@/components/drop/CollapsibleStory';
import { CountdownTimer } from '@/components/CountdownTimer';
import { MapPin, Calendar, Sparkles, Eye } from 'lucide-react';

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

interface DropEditorPreviewProps {
  form: DropFormData;
  previewLang: 'en' | 'nl';
  previewMode: 'mobile' | 'desktop';
  galleryImages: GalleryImage[];
}

export function DropEditorPreview({ form, previewLang, previewMode, galleryImages }: DropEditorPreviewProps) {
  const { t } = useLanguage();

  // Get content based on preview language
  const title = previewLang === 'nl' ? form.title_nl : form.title_en;
  const description = previewLang === 'nl' ? form.description_nl : form.description_en;
  const story = previewLang === 'nl' ? form.story_nl : form.story_en;
  const tastingNotes = previewLang === 'nl' ? form.tasting_notes_nl : form.tasting_notes_en;

  const hasAttributes = form.origin || form.vintage;
  const quantityAvailable = parseInt(form.quantity_available) || 0;
  const quantitySold = form.quantity_sold || 0;
  const price = parseFloat(form.price) || 0;

  // Build images array
  const allImages: GalleryImage[] = galleryImages.length > 0
    ? galleryImages
    : form.image_url
      ? [{ id: 'preview', image_url: form.image_url, alt_text: title || 'Product image', sort_order: 0 }]
      : [];

  // Badges for hero
  const heroBadges = (
    <>
      <span className="bg-background/90 backdrop-blur-sm text-foreground px-3 py-1.5 text-xs font-sans uppercase tracking-wider border border-border/50">
        {t.drop.limited}
      </span>
      <span className="bg-accent/90 backdrop-blur-sm text-accent-foreground px-3 py-1.5 text-xs font-sans uppercase tracking-wider">
        {t.drop.membersOnly}
      </span>
    </>
  );

  // Check if form has enough content
  const isEmpty = !title && !description && !form.image_url && galleryImages.length === 0;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Preview Banner */}
      <div className="sticky top-0 z-10 bg-accent/10 border-b border-accent/20 px-4 py-2 flex items-center justify-center gap-2">
        <Eye className="w-4 h-4 text-accent" />
        <span className="text-xs font-medium text-accent uppercase tracking-wider">
          Live Preview ({previewLang.toUpperCase()})
        </span>
      </div>

      {/* Preview Container */}
      <div className={`mx-auto ${previewMode === 'mobile' ? 'max-w-sm' : 'max-w-none'}`}>
        {isEmpty ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm">Start filling in the form to see a live preview</p>
            </div>
          </div>
        ) : (
          <div className="bg-background min-h-full">
            {/* Hero Image */}
            {allImages.length > 0 ? (
              <MediaHero
                images={allImages}
                videoUrl={form.video_url}
                title={title || 'Product Preview'}
                onOpenLightbox={() => {}}
                badges={heroBadges}
                tapToEnlargeText={form.video_url ? t.drop.playVideo : t.drop.tapToEnlarge}
              />
            ) : (
              <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
                <div className="absolute top-4 left-4 flex gap-2">{heroBadges}</div>
                <span className="text-muted-foreground text-sm">No image</span>
              </div>
            )}

            <div className={`${allImages.length > 1 ? 'mt-4' : '-mt-16'} relative z-10 px-4 pb-8`}>
              {/* Title & Description */}
              <div className="mb-6">
                <h1 className={`font-serif ${previewMode === 'mobile' ? 'text-2xl' : 'text-3xl md:text-4xl'} mb-2`}>
                  {title || <span className="text-muted-foreground italic">Untitled</span>}
                </h1>
                {description && (
                  <p className="text-muted-foreground">{description}</p>
                )}
              </div>

              {/* Product Attributes */}
              {hasAttributes && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {form.origin && (
                    <div className="flex items-center gap-2 p-3 bg-card border border-border">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.drop.origin}</p>
                        <p className="text-sm font-medium">{form.origin}</p>
                      </div>
                    </div>
                  )}
                  {form.vintage && (
                    <div className="flex items-center gap-2 p-3 bg-card border border-border">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.drop.vintage}</p>
                        <p className="text-sm font-medium">{form.vintage}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stock Indicator */}
              <div className="bg-card border border-border p-4 mb-6">
                {form.ends_at && !form.noEndDate ? (
                  <>
                    <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-3 text-center">
                      {t.drop.endsIn}
                    </p>
                    <CountdownTimer targetDate={new Date(form.ends_at)} />
                    <div className="mt-4 pt-4 border-t border-border">
                      <StockIndicator 
                        quantityAvailable={quantityAvailable} 
                        quantitySold={quantitySold} 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-3 text-center">
                      {t.drop.whileSuppliesLast}
                    </p>
                    <StockIndicator 
                      quantityAvailable={quantityAvailable} 
                      quantitySold={quantitySold} 
                    />
                  </>
                )}
              </div>

              {/* Story Section */}
              {story && (
                <div className="mb-6">
                  <CollapsibleStory story={story} title={t.drop.theStory} />
                </div>
              )}

              {/* Details Section */}
              {tastingNotes && (
                <div className="mb-6 bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <h2 className="font-serif text-lg">{t.drop.details}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{tastingNotes}</p>
                </div>
              )}

              {/* Price Section */}
              <div className="flex items-center justify-between bg-card border border-border p-4">
                <div>
                  <p className="font-serif text-2xl">€{price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {quantityAvailable - quantitySold} {t.drop.remaining}
                  </p>
                </div>
                <button
                  disabled
                  className="btn-luxury opacity-50 cursor-not-allowed text-sm"
                >
                  {t.drop.addToCart}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
