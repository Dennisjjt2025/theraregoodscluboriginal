import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={cn('flex items-center gap-1 font-sans text-sm', className)}>
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          'px-2 py-1 transition-all duration-200',
          language === 'en'
            ? 'text-foreground font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        EN
      </button>
      <span className="text-border">|</span>
      <button
        onClick={() => setLanguage('nl')}
        className={cn(
          'px-2 py-1 transition-all duration-200',
          language === 'nl'
            ? 'text-foreground font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        NL
      </button>
    </div>
  );
}
