import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Clock, Archive as ArchiveIcon } from 'lucide-react';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';

interface PastDrop {
  id: string;
  title_en: string;
  title_nl: string;
  description_en: string | null;
  description_nl: string | null;
  price: number;
  image_url: string | null;
  ends_at: string | null;
  starts_at: string;
  origin: string | null;
  vintage: string | null;
  quantity_sold: number | null;
  quantity_available: number;
}

interface Participation {
  drop_id: string;
  purchased: boolean | null;
}

export default function Archive() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drops, setDrops] = useState<PastDrop[]>([]);
  const [participation, setParticipation] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'purchased'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [memberId, setMemberId] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Fetch member ID
  useEffect(() => {
    const fetchMemberId = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setMemberId(data.id);
    };
    fetchMemberId();
  }, [user]);

  // Fetch past drops
  useEffect(() => {
    const fetchPastDrops = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('drops')
        .select('*')
        .eq('is_draft', false)
        .eq('is_active', false)
        .order('ends_at', { ascending: false, nullsFirst: false });

      if (!error && data) {
        setDrops(data);
      }
      setLoading(false);
    };
    fetchPastDrops();
  }, []);

  // Fetch participation
  useEffect(() => {
    const fetchParticipation = async () => {
      if (!memberId) return;
      const { data } = await supabase
        .from('drop_participation')
        .select('drop_id, purchased')
        .eq('member_id', memberId);
      if (data) setParticipation(data);
    };
    fetchParticipation();
  }, [memberId]);

  const hasPurchased = (dropId: string) => {
    return participation.some(p => p.drop_id === dropId && p.purchased);
  };

  const filteredDrops = drops
    .filter(drop => {
      if (filter === 'purchased') return hasPurchased(drop.id);
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.ends_at || a.starts_at).getTime();
      const dateB = new Date(b.ends_at || b.starts_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const dateLocale = language === 'nl' ? nl : enUS;

  const archiveTranslations = {
    en: {
      title: 'Previous Drops',
      subtitle: 'Browse our past releases',
      endedOn: 'Ended',
      youPurchased: 'Purchased',
      noDropsYet: 'No previous drops yet',
      filterAll: 'All drops',
      filterPurchased: 'Purchased only',
      sortNewest: 'Newest first',
      sortOldest: 'Oldest first',
      viewDetails: 'View details',
    },
    nl: {
      title: 'Eerdere Drops',
      subtitle: 'Bekijk onze eerdere releases',
      endedOn: 'Geëindigd',
      youPurchased: 'Gekocht',
      noDropsYet: 'Nog geen eerdere drops',
      filterAll: 'Alle drops',
      filterPurchased: 'Alleen gekocht',
      sortNewest: 'Nieuwste eerst',
      sortOldest: 'Oudste eerst',
      viewDetails: 'Details bekijken',
    },
  };

  const at = archiveTranslations[language];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <ArchiveIcon className="h-6 w-6 text-primary" />
            <h1 className="font-serif text-3xl md:text-4xl">{at.title}</h1>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">{at.subtitle}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <Select value={filter} onValueChange={(v: 'all' | 'purchased') => setFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{at.filterAll}</SelectItem>
              <SelectItem value="purchased">{at.filterPurchased}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(v: 'newest' | 'oldest') => setSortOrder(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{at.sortNewest}</SelectItem>
              <SelectItem value="oldest">{at.sortOldest}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredDrops.length === 0 ? (
          <div className="text-center py-16">
            <ArchiveIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{at.noDropsYet}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrops.map((drop) => {
              const title = language === 'nl' ? drop.title_nl : drop.title_en;
              const purchased = hasPurchased(drop.id);
              const endDate = drop.ends_at ? format(new Date(drop.ends_at), 'PP', { locale: dateLocale }) : null;

              return (
                <Link
                  key={drop.id}
                  to={`/archive/${drop.id}`}
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-3">
                    {drop.image_url ? (
                      <img
                        src={drop.image_url}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ArchiveIcon className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {purchased && (
                        <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {at.youPurchased}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif text-lg group-hover:text-primary transition-colors line-clamp-1">
                      {title}
                    </h3>
                    <p className="text-primary font-medium">€{drop.price}</p>
                    {endDate && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {at.endedOn} {endDate}
                      </p>
                    )}
                    {drop.origin && (
                      <p className="text-sm text-muted-foreground">{drop.origin}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
