import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CollapsibleStoryProps {
  story: string;
  title: string;
  /** Number of characters before truncating on mobile */
  mobileThreshold?: number;
}

export function CollapsibleStory({ story, title, mobileThreshold = 300 }: CollapsibleStoryProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shouldTruncate = story.length > mobileThreshold;
  const displayText = !isExpanded && shouldTruncate 
    ? story.slice(0, mobileThreshold) + '...' 
    : story;

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl md:text-3xl">{title}</h2>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
          {displayText}
        </p>
      </div>
      
      {/* Show More/Less button - only on mobile when content is long */}
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              {t.drop.showLess || 'Show less'}
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              {t.drop.readMore || 'Read more'}
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
