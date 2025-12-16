import { useEffect, useCallback } from 'react';
import { X, Play, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  videoUrl: string | null;
  title: string;
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

export function MediaLightbox({ isOpen, onClose, imageUrl, videoUrl, title }: MediaLightboxProps) {
  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const showVideo = videoUrl && isOpen;
  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;
  const isYouTube = videoUrl ? isYouTubeUrl(videoUrl) : false;

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
          {showVideo ? (
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
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="max-w-[90vw] max-h-[85vh] object-contain animate-scale-in"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Media Hero Component - the clickable hero that opens lightbox
interface MediaHeroProps {
  imageUrl: string | null;
  videoUrl: string | null;
  title: string;
  onOpenLightbox: () => void;
  badges?: React.ReactNode;
  tapToEnlargeText: string;
}

export function MediaHero({ imageUrl, videoUrl, title, onOpenLightbox, badges, tapToEnlargeText }: MediaHeroProps) {
  if (!imageUrl) return null;

  return (
    <div 
      className="relative h-[50vh] md:h-[60vh] overflow-hidden cursor-pointer group"
      onClick={onOpenLightbox}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpenLightbox()}
      aria-label={`${tapToEnlargeText}: ${title}`}
    >
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      
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
    </div>
  );
}
