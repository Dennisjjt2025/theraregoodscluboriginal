import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { CountdownTimer } from '@/components/CountdownTimer';
import { StockIndicator } from '@/components/drop/StockIndicator';
import { Wine, ArrowRight, Archive } from 'lucide-react';

interface Drop {
  id: string;
  title_en: string;
  title_nl: string;
  image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number | null;
  is_active: boolean;
}

interface SiteSetting {
  key: string;
  value_en: string | null;
  value_nl: string | null;
}

interface DropsTabProps {
  activeDrop: Drop | null;
  upcomingDrop: Drop | null;
  settings: SiteSetting[];
}

export function DropsTab({ activeDrop, upcomingDrop, settings }: DropsTabProps) {
  const { language } = useLanguage();

  const getSetting = (key: string): string => {
    const setting = settings.find(s => s.key === key);
    if (!setting) return '';
    return (language === 'nl' ? setting.value_nl : setting.value_en) || '';
  };

  // State 1: Active/Live Drop
  if (activeDrop) {
    const dropTitle = language === 'nl' ? activeDrop.title_nl : activeDrop.title_en;

    return (
      <div className="space-y-6">
        <div className="bg-card border border-border overflow-hidden">
          {/* Hero Section */}
          <div className="relative aspect-[16/9] md:aspect-[21/9] bg-muted">
            {activeDrop.image_url ? (
              <img
                src={activeDrop.image_url}
                alt={dropTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Wine className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            {/* Live Badge */}
            <div className="absolute top-4 left-4">
              <span className="bg-secondary text-secondary-foreground px-3 py-1 text-sm font-sans uppercase tracking-wider">
                {language === 'nl' ? 'Nu Live' : 'Live Now'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-3">
                <h2 className="font-serif text-2xl md:text-3xl">{dropTitle}</h2>
                <p className="text-xl font-medium">€{activeDrop.price}</p>
                <StockIndicator
                  quantityAvailable={activeDrop.quantity_available}
                  quantitySold={activeDrop.quantity_sold || 0}
                />
              </div>

              <div className="space-y-4">
                {/* Countdown or While Supplies Last */}
                {activeDrop.ends_at ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">
                      {language === 'nl' ? 'Eindigt over' : 'Ends in'}
                    </p>
                    <CountdownTimer targetDate={new Date(activeDrop.ends_at)} isLive={true} />
                  </div>
                ) : (
                  <p className="text-secondary font-medium text-center">
                    {language === 'nl' ? 'Zolang de voorraad strekt' : 'While Supplies Last'}
                  </p>
                )}
                
                <Link to="/drop" className="btn-luxury w-full flex items-center justify-center gap-2">
                  {language === 'nl' ? 'Bekijk Drop' : 'View Drop'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Upcoming Drop
  if (upcomingDrop) {
    const teaserTitle = getSetting('drop_teaser_title');
    const teaserMessage = getSetting('drop_teaser_message');
    
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border p-8 md:p-12 text-center">
          <div className="max-w-xl mx-auto space-y-6">
            <Wine className="w-12 h-12 mx-auto text-secondary" />
            
            <h2 className="font-serif text-2xl md:text-3xl">
              {teaserTitle || (language === 'nl' ? 'Er Komt Iets Bijzonders Aan' : 'Something Special is Coming')}
            </h2>
            
            <p className="text-muted-foreground">
              {teaserMessage || (language === 'nl' 
                ? 'Onze curatoren bereiden de volgende exclusieve release voor.' 
                : 'Our curators are preparing the next exclusive release.')}
            </p>

            <div className="py-6">
              <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider">
                {language === 'nl' ? 'Volgende drop over' : 'Next drop in'}
              </p>
              <CountdownTimer targetDate={new Date(upcomingDrop.starts_at)} />
            </div>

            <Link to="/archive" className="btn-outline-luxury inline-flex items-center gap-2">
              <Archive className="w-4 h-4" />
              {language === 'nl' ? 'Bekijk Archief' : 'Browse Archive'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 3: No Drops
  const noDropsTitle = getSetting('no_drops_title');
  const noDropsMessage = getSetting('no_drops_message');

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border p-8 md:p-12 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <Wine className="w-12 h-12 mx-auto text-muted-foreground" />
          
          <h2 className="font-serif text-2xl md:text-3xl">
            {noDropsTitle || (language === 'nl' ? 'Welkom bij The Rare Goods Club' : 'Welcome to The Rare Goods Club')}
          </h2>
          
          <p className="text-muted-foreground">
            {noDropsMessage || (language === 'nl' 
              ? 'Er zijn momenteel geen geplande drops. Bekijk ons archief om te zien wat je gemist hebt.' 
              : 'There are currently no scheduled drops. Explore our archive to see what you might have missed.')}
          </p>

          <Link to="/archive" className="btn-outline-luxury inline-flex items-center gap-2">
            <Archive className="w-4 h-4" />
            {language === 'nl' ? 'Bekijk Archief' : 'Browse Archive'}
          </Link>
        </div>
      </div>
    </div>
  );
}
