import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { BarChart3 } from 'lucide-react';

interface PreferenceStats {
  key: string;
  count: number;
  percentage: number;
}

const PREFERENCE_LABELS: Record<string, { en: string; nl: string }> = {
  wine_spirits: { en: 'Wine & Spirits', nl: 'Wijn & Gedistilleerd' },
  art_prints: { en: 'Art & Prints', nl: 'Kunst & Prints' },
  regional_products: { en: 'Regional Products', nl: 'Streekproducten' },
  farm_local: { en: 'Farm Fresh & Local', nl: 'Lokale Producten van de Boer' },
  food_delicatessen: { en: 'Food & Delicatessen', nl: 'Delicatessen & Specialiteiten' },
  fashion_accessories: { en: 'Fashion & Accessories', nl: 'Mode & Accessoires' },
  home_design: { en: 'Home & Design', nl: 'Wonen & Design' },
  collectibles: { en: 'Collectibles', nl: 'Verzamelobjecten' },
};

export function PreferencesOverview() {
  const { language } = useLanguage();
  const [stats, setStats] = useState<PreferenceStats[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [membersWithPrefs, setMembersWithPrefs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all profiles with preferences
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, preferences');

      // Fetch all members to get total count
      const { data: members } = await supabase
        .from('members')
        .select('user_id')
        .eq('status', 'active');

      const memberUserIds = new Set(members?.map(m => m.user_id) || []);
      const memberProfiles = profiles?.filter(p => memberUserIds.has(p.id)) || [];
      
      setTotalMembers(memberProfiles.length);

      // Count preferences
      const prefCounts: Record<string, number> = {};
      let withPrefs = 0;

      memberProfiles.forEach(profile => {
        const prefs = profile.preferences || [];
        if (prefs.length > 0) withPrefs++;
        prefs.forEach((pref: string) => {
          prefCounts[pref] = (prefCounts[pref] || 0) + 1;
        });
      });

      setMembersWithPrefs(withPrefs);

      // Convert to stats array
      const statsArray: PreferenceStats[] = Object.keys(PREFERENCE_LABELS).map(key => ({
        key,
        count: prefCounts[key] || 0,
        percentage: memberProfiles.length > 0 
          ? Math.round((prefCounts[key] || 0) / memberProfiles.length * 100) 
          : 0,
      }));

      // Sort by count descending
      statsArray.sort((a, b) => b.count - a.count);
      setStats(statsArray);
    } catch (error) {
      console.error('Error fetching preference stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-5 h-5 text-secondary" />
        <h2 className="font-serif text-xl">
          {language === 'nl' ? 'Voorkeuren Overzicht' : 'Preferences Overview'}
        </h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-muted/30 p-4 rounded">
          <p className="text-2xl font-serif">{membersWithPrefs}</p>
          <p className="text-sm text-muted-foreground">
            {language === 'nl' ? 'Leden met voorkeuren' : 'Members with preferences'}
          </p>
        </div>
        <div className="bg-muted/30 p-4 rounded">
          <p className="text-2xl font-serif">
            {totalMembers > 0 ? Math.round(membersWithPrefs / totalMembers * 100) : 0}%
          </p>
          <p className="text-sm text-muted-foreground">
            {language === 'nl' ? 'Van alle leden' : 'Of all members'}
          </p>
        </div>
      </div>

      {/* Stats bars */}
      <div className="space-y-3">
        {stats.map(stat => (
          <div key={stat.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{PREFERENCE_LABELS[stat.key]?.[language] || stat.key}</span>
              <span className="text-muted-foreground">
                {stat.count} ({stat.percentage}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary transition-all duration-500"
                style={{ width: `${stat.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {totalMembers === 0 && (
        <p className="text-center text-muted-foreground py-8">
          {language === 'nl' ? 'Nog geen leden' : 'No members yet'}
        </p>
      )}
    </div>
  );
}
