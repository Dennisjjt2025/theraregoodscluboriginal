import { useLanguage } from '@/contexts/LanguageContext';

interface StockIndicatorProps {
  quantityAvailable: number;
  quantitySold: number;
}

export function StockIndicator({ quantityAvailable, quantitySold }: StockIndicatorProps) {
  const { t } = useLanguage();
  
  const remaining = quantityAvailable - quantitySold;
  const percentageSold = Math.round((quantitySold / quantityAvailable) * 100);
  const isLowStock = remaining <= Math.ceil(quantityAvailable * 0.2); // 20% or less
  const isAlmostGone = remaining <= 3;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
            isAlmostGone 
              ? 'bg-destructive' 
              : isLowStock 
                ? 'bg-accent' 
                : 'bg-secondary'
          }`}
          style={{ width: `${percentageSold}%` }}
        />
      </div>
      
      {/* Label */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${isAlmostGone ? 'text-destructive' : isLowStock ? 'text-accent' : 'text-muted-foreground'}`}>
          {isAlmostGone ? (
            t.drop.almostSoldOut || 'Almost sold out!'
          ) : (
            <>
              <span className="font-serif text-foreground">{remaining}</span>
              {' '}{t.drop.remaining || 'remaining'}
            </>
          )}
        </span>
        <span className="text-muted-foreground">
          {percentageSold}% {t.drop.claimed || 'claimed'}
        </span>
      </div>
    </div>
  );
}
