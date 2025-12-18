import { useState, useEffect, useCallback, useRef } from 'react';
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
  initialShowVideo?: boolean;
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

// Swipe hook for touch gestures
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) onSwipeLeft();
    if (isRightSwipe) onSwipeRight();
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

export function MediaLightbox({ 
  isOpen, 
  onClose, 
  images, 
  videoUrl, 
  title, 
  initialIndex = 0,
  initialShowVideo = false 
}: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showVideo, setShowVideo] = useState(initialShowVideo);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setShowVideo(initialShowVideo);
    }
  }, [isOpen, initialIndex, initialShowVideo]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setShowVideo(false);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setShowVideo(false);
  }, [images.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  }, [onClose, goToPrevious, goToNext]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Swipe handlers
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe(goToNext, goToPrevious);

  const currentImage = images[currentIndex];
  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;
  const isYouTube = videoUrl ? isYouTubeUrl(videoUrl) : false;
  const hasMultipleImages = images.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-background/95 backdrop-blur-md border-border overflow-hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        
        {/* Close button - larger touch target */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-3 bg-background/80 hover:bg-background border border-border rounded-full transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div 
          className="relative flex items-center justify-center min-h-[50vh]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Navigation arrows - larger touch targets */}
          {hasMultipleImages && !showVideo && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 md:left-4 z-50 p-3 md:p-4 bg-background/80 hover:bg-background border border-border rounded-full transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 md:right-4 z-50 p-3 md:p-4 bg-background/80 hover:bg-background border border-border rounded-full transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
              </button>
            </>
          )}

          {showVideo && videoUrl ? (
            <div className="animate-fade-in">
              {isYouTube && embedUrl ? (
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
                  playsInline
                />
              )}
            </div>
          ) : currentImage ? (
            <img
              key={`${currentImage.id}-${currentIndex}`}
              src={currentImage.image_url}
              alt={currentImage.alt_text || title}
              className="max-w-[90vw] max-h-[85vh] object-contain animate-fade-in"
            />
          ) : null}
        </div>

        {/* Thumbnail strip & video button - larger touch targets */}
        {(hasMultipleImages || videoUrl) && !showVideo && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 bg-background/80 backdrop-blur-sm p-2 md:p-3 rounded-lg border border-border max-w-[90vw] overflow-x-auto">
            {images.map((img, index) => (
              <button
                key={img.id}
                onClick={() => {
                  setCurrentIndex(index);
                  setShowVideo(false);
                }}
                className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded overflow-hidden border-2 transition-all ${
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
                className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded overflow-hidden border-2 transition-all flex items-center justify-center bg-muted ${
                  showVideo
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-transparent hover:border-border'
                }`}
              >
                <Play className="w-6 h-6" />
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
  onOpenVideo?: () => void;
  badges?: React.ReactNode;
  tapToEnlargeText: string;
  aspectRatio?: 'hero' | 'square';
}

export function MediaHero({ 
  images, 
  videoUrl, 
  title, 
  onOpenLightbox, 
  onOpenVideo,
  badges, 
  tapToEnlargeText, 
  aspectRatio = 'hero' 
}: MediaHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const mainImage = images[currentIndex] || images[0];
  
  if (!mainImage) return null;

  const hasMultipleImages = images.length > 1;
  
  // Aspect ratio classes
  const aspectClasses = aspectRatio === 'square' 
    ? 'aspect-square' 
    : 'h-[50vh] md:h-[60vh]';

  // Swipe to navigate through images in hero
  const goToNext = () => {
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }
  };

  const goToPrevious = () => {
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }
  };

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe(goToNext, goToPrevious);

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenVideo) {
      onOpenVideo();
    } else {
      onOpenLightbox(0);
    }
  };

  return (
    <div className="relative">
      {/* Main hero image with swipe support */}
      <div 
        className={`relative ${aspectClasses} overflow-hidden cursor-pointer group`}
        onClick={() => onOpenLightbox(currentIndex)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpenLightbox(currentIndex)}
        aria-label={`${tapToEnlargeText}: ${title}`}
      >
        <img
          key={mainImage.id}
          src={mainImage.image_url}
          alt={mainImage.alt_text || title}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
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
            {currentIndex + 1} / {images.length}
          </div>
        )}

      </div>

      {/* Thumbnail strip below hero */}
      {(hasMultipleImages || videoUrl) && (
        <div className="flex justify-center gap-2 px-4 mt-4">
          {images.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded overflow-hidden border-2 transition-all ${
                currentIndex === index
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
              onClick={handleVideoClick}
              className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded overflow-hidden border-2 border-border hover:border-primary/50 flex items-center justify-center bg-muted"
            >
              <Play className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
