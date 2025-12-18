import { useState, useEffect, useCallback } from 'react';
import { X, Play, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text?: string | null;
  sort_order: number;
}

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  videoUrl: string | null;
  title: string;
  initialIndex?: number;
}

// Helper to convert YouTube URL to embed URL
const getYouTubeEmbedUrl = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
  }
  return null;
};

// Helper to check if URL is a YouTube video
const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

export function MediaLightbox({ isOpen, onClose, images, videoUrl, title, initialIndex = 0 }: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showVideo, setShowVideo] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setShowVideo(false);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      setShowVideo(false);
    } else if (e.key === 'ArrowRight') {
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      setShowVideo(false);
    }
  }, [onClose, images.length]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const currentImage = images[currentIndex];
  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;
  const isYouTube = videoUrl ? isYouTubeUrl(videoUrl) : false;
  const hasMultipleImages = images.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setShowVideo(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setShowVideo(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-background/95 backdrop-blur-md border-border overflow-hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-background/80 hover:bg-background border border-border rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative flex items-center justify-center min-h-[50vh]">
          {/* Navigation arrows */}
          {hasMultipleImages && !showVideo && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 z-50 p-3 bg-background/80 hover:bg-background border border-border rounded-full transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 z-50 p-3 bg-background/80 hover:bg-background border border-border rounded-full transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {showVideo && videoUrl ? (
            isYouTube && embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-[90vw] h-[80vh] max-w-5xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
              />
            ) : (
              <video
                src={videoUrl}
                className="max-w-[90vw] max-h-[80vh] object-contain"
                controls
                autoPlay
              />
            )
          ) : currentImage ? (
            <img
              src={currentImage.image_url}
              alt={currentImage.alt_text || title}
              className="max-w-[90vw] max-h-[85vh] object-contain animate-scale-in"
            />
          ) : null}
        </div>

        {/* Thumbnail strip & video button */}
        {(hasMultipleImages || videoUrl) && !showVideo && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg border border-border">
            {images.map((img, index) => (
              <button
                key={img.id}
                onClick={() => {
                  setCurrentIndex(index);
                  setShowVideo(false);
                }}
                className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                  currentIndex === index && !showVideo
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-transparent hover:border-border'
                }`}
              >
                <img
                  src={img.image_url}
                  alt={img.alt_text || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {videoUrl && (
              <button
                onClick={() => setShowVideo(true)}
                className={`w-12 h-12 rounded overflow-hidden border-2 transition-all flex items-center justify-center bg-muted ${
                  showVideo
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-transparent hover:border-border'
                }`}
              >
                <Play className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Image counter */}
        {hasMultipleImages && !showVideo && (
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium border border-border">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Media Hero Component - the clickable hero that opens lightbox
interface MediaHeroProps {
  images: GalleryImage[];
  videoUrl: string | null;
  title: string;
  onOpenLightbox: (index?: number) => void;
  badges?: React.ReactNode;
  tapToEnlargeText: string;
  aspectRatio?: 'hero' | 'square';
}

export function MediaHero({ images, videoUrl, title, onOpenLightbox, badges, tapToEnlargeText, aspectRatio = 'hero' }: MediaHeroProps) {
  const mainImage = images[0];
  
  if (!mainImage) return null;

  const hasMultipleImages = images.length > 1;
  
  // Aspect ratio classes
  const aspectClasses = aspectRatio === 'square' 
    ? 'aspect-square' 
    : 'h-[50vh] md:h-[60vh]';

  return (
    <div className="relative">
      {/* Main hero image */}
      <div 
        className={`relative ${aspectClasses} overflow-hidden cursor-pointer group`}
        onClick={() => onOpenLightbox(0)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpenLightbox(0)}
        aria-label={`${tapToEnlargeText}: ${title}`}
      >
        <img
          src={mainImage.image_url}
          alt={mainImage.alt_text || title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Gradient overlay - only for hero aspect */}
        {aspectRatio === 'hero' && (
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        )}
        
        {/* Media indicator overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-background/80 backdrop-blur-sm rounded-full p-4 border border-border">
            {videoUrl ? (
              <Play className="w-8 h-8 text-foreground" />
            ) : (
              <ZoomIn className="w-8 h-8 text-foreground" />
            )}
          </div>
        </div>
        
        {/* Tap to enlarge hint */}
        <div className="absolute bottom-4 right-4 bg-background/70 backdrop-blur-sm px-3 py-1.5 text-xs font-sans tracking-wide flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity border border-border/50">
          {videoUrl ? <Play className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
          {tapToEnlargeText}
        </div>
        
        {/* Badges */}
        {badges && (
          <div className="absolute top-4 left-4 flex gap-2">
            {badges}
          </div>
        )}

        {/* Image count indicator */}
        {hasMultipleImages && (
          <div className="absolute bottom-4 left-4 bg-background/70 backdrop-blur-sm px-3 py-1.5 text-xs font-sans tracking-wide border border-border/50">
            1 / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip below hero */}
      {hasMultipleImages && (
        <div className="container mx-auto max-w-4xl px-4 -mt-8 relative z-20">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {images.map((img, index) => (
              <button
                key={img.id}
                onClick={() => onOpenLightbox(index)}
                className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded overflow-hidden border-2 transition-all ${
                  index === 0
                    ? 'border-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <img
                  src={img.image_url}
                  alt={img.alt_text || `${title} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {videoUrl && (
              <button
                onClick={() => onOpenLightbox(0)}
                className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded overflow-hidden border-2 border-border hover:border-primary/50 flex items-center justify-center bg-muted"
              >
                <Play className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
