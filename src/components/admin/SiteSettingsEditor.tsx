import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Save, Globe } from 'lucide-react';

interface SiteSetting {
  id: string;
  key: string;
  value_en: string | null;
  value_nl: string | null;
}

export function SiteSettingsEditor() {
  const { t, language: currentLang } = useLanguage();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editLang, setEditLang] = useState<'en' | 'nl'>('en');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            value_en: setting.value_en,
            value_nl: setting.value_nl,
          })
          .eq('id', setting.id);

        if (error) throw error;
      }
      toast.success(currentLang === 'nl' ? 'Instellingen opgeslagen' : 'Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, field: 'value_en' | 'value_nl', value: string) => {
    setSettings(prev => 
      prev.map(s => s.key === key ? { ...s, [field]: value } : s)
    );
  };

  const getSettingLabel = (key: string): { label: string; description: string } => {
    const labels: Record<string, { label: string; description: string }> = {
      drop_teaser_title: {
        label: currentLang === 'nl' ? 'Teaser Titel' : 'Teaser Title',
        description: currentLang === 'nl' 
          ? 'Titel getoond wanneer een drop gepland is maar nog niet actief' 
          : 'Title shown when a drop is scheduled but not yet active',
      },
      drop_teaser_message: {
        label: currentLang === 'nl' ? 'Teaser Bericht' : 'Teaser Message',
        description: currentLang === 'nl' 
          ? 'Bericht getoond onder de countdown timer' 
          : 'Message shown below the countdown timer',
      },
      no_drops_title: {
        label: currentLang === 'nl' ? 'Geen Drops Titel' : 'No Drops Title',
        description: currentLang === 'nl' 
          ? 'Titel getoond wanneer er geen drops gepland zijn' 
          : 'Title shown when no drops are scheduled',
      },
      no_drops_message: {
        label: currentLang === 'nl' ? 'Geen Drops Bericht' : 'No Drops Message',
        description: currentLang === 'nl' 
          ? 'Welkomstbericht voor leden wanneer er geen drops zijn' 
          : 'Welcome message for members when there are no drops',
      },
    };
    return labels[key] || { label: key, description: '' };
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse font-serif">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl">
            {currentLang === 'nl' ? 'Site Instellingen' : 'Site Settings'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {currentLang === 'nl' 
              ? 'Configureer berichten die leden zien op hun dashboard' 
              : 'Configure messages that members see on their dashboard'}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-luxury flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? t.common.loading : t.common.save}
        </button>
      </div>

      {/* Language Toggle */}
      <div className="flex items-center gap-2 border border-border p-1 w-fit bg-card">
        <button
          onClick={() => setEditLang('en')}
          className={`px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
            editLang === 'en' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          <Globe className="w-4 h-4" />
          English
        </button>
        <button
          onClick={() => setEditLang('nl')}
          className={`px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
            editLang === 'nl' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          <Globe className="w-4 h-4" />
          Nederlands
        </button>
      </div>

      {/* Settings Form */}
      <div className="bg-card border border-border divide-y divide-border">
        {settings.map((setting) => {
          const { label, description } = getSettingLabel(setting.key);
          const value = editLang === 'en' ? setting.value_en : setting.value_nl;
          const field = editLang === 'en' ? 'value_en' : 'value_nl';
          const isTextArea = setting.key.includes('message');

          return (
            <div key={setting.id} className="p-6">
              <label className="block">
                <span className="font-medium">{label}</span>
                <span className="block text-sm text-muted-foreground mb-3">{description}</span>
                {isTextArea ? (
                  <textarea
                    value={value || ''}
                    onChange={(e) => updateSetting(setting.key, field, e.target.value)}
                    className="input-luxury w-full min-h-[100px] resize-y"
                    placeholder={`${label} (${editLang.toUpperCase()})`}
                  />
                ) : (
                  <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => updateSetting(setting.key, field, e.target.value)}
                    className="input-luxury w-full"
                    placeholder={`${label} (${editLang.toUpperCase()})`}
                  />
                )}
              </label>
            </div>
          );
        })}
      </div>

      {/* Preview Section */}
      <div className="bg-muted/30 border border-border p-6">
        <h3 className="font-serif text-lg mb-4">
          {currentLang === 'nl' ? 'Voorbeeld' : 'Preview'}
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {currentLang === 'nl' ? 'Komende Drop' : 'Upcoming Drop'}
            </p>
            <h4 className="font-serif text-lg mb-2">
              {(editLang === 'en' 
                ? settings.find(s => s.key === 'drop_teaser_title')?.value_en 
                : settings.find(s => s.key === 'drop_teaser_title')?.value_nl) || 'Title'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {(editLang === 'en'
                ? settings.find(s => s.key === 'drop_teaser_message')?.value_en
                : settings.find(s => s.key === 'drop_teaser_message')?.value_nl) || 'Message'}
            </p>
          </div>
          <div className="bg-card border border-border p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {currentLang === 'nl' ? 'Geen Drops' : 'No Drops'}
            </p>
            <h4 className="font-serif text-lg mb-2">
              {(editLang === 'en'
                ? settings.find(s => s.key === 'no_drops_title')?.value_en
                : settings.find(s => s.key === 'no_drops_title')?.value_nl) || 'Title'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {(editLang === 'en'
                ? settings.find(s => s.key === 'no_drops_message')?.value_en
                : settings.find(s => s.key === 'no_drops_message')?.value_nl) || 'Message'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
