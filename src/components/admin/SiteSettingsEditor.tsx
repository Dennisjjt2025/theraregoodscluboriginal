import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Save, Globe, MessageSquare, UserPlus, Mail, LogOut, ChevronDown, ChevronRight, LayoutDashboard, Eye } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SiteSetting {
  id: string;
  key: string;
  value_en: string | null;
  value_nl: string | null;
}

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  keys: string[];
  placeholders?: Record<string, string>;
  isEmail?: boolean;
}

// Email preview component
function EmailPreview({ subject, message }: { subject: string; message: string }) {
  const replacePlaceholders = (text: string) => {
    return text
      .replace(/\{\{firstName\}\}/g, 'Jan')
      .replace(/\{\{name\}\}/g, 'Jan de Vries')
      .replace(/\{\{email\}\}/g, 'jan@example.com')
      .replace(/\{\{verifyLink\}\}/g, '#');
  };

  const processedSubject = replacePlaceholders(subject || 'Subject');
  const processedMessage = replacePlaceholders(message || 'Message content...');

  return (
    <div className="bg-[#FAF9F6] p-6 rounded-lg">
      {/* Email container */}
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center pb-6">
          <h1 className="text-foreground text-xl tracking-widest font-serif">
            THE RARE GOODS CLUB
          </h1>
        </div>
        
        {/* Subject line indicator */}
        <div className="mb-4 pb-2 border-b border-border">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Subject:</span>
          <p className="font-medium">{processedSubject}</p>
        </div>
        
        {/* Content */}
        <div className="bg-white border border-border p-6">
          <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
            {processedMessage}
          </div>
        </div>
        
        {/* Footer with wax seal */}
        <div className="text-center pt-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#722F37] rounded-full">
            <span className="text-white text-lg font-bold">R</span>
          </div>
          <p className="text-muted-foreground text-xs mt-4 tracking-wider">
            © {new Date().getFullYear()} The Rare Goods Club
          </p>
        </div>
      </div>
    </div>
  );
}

export function SiteSettingsEditor() {
  const { t, language: currentLang } = useLanguage();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editLang, setEditLang] = useState<'en' | 'nl'>('en');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    dashboard: true,
    welcome: false,
    waitlist: false,
    unsubscribe: false,
  });

  const sections: SettingSection[] = [
    {
      id: 'dashboard',
      title: currentLang === 'nl' ? 'Dashboard Berichten' : 'Dashboard Messages',
      description: currentLang === 'nl' 
        ? 'Berichten die leden zien op hun dashboard' 
        : 'Messages that members see on their dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      keys: ['drop_teaser_title', 'drop_teaser_message', 'no_drops_title', 'no_drops_message'],
    },
    {
      id: 'welcome',
      title: currentLang === 'nl' ? 'Welkom & Verificatie' : 'Welcome & Verification',
      description: currentLang === 'nl' 
        ? 'E-mail die nieuwe leden ontvangen na registratie' 
        : 'Email that new members receive after registration',
      icon: <UserPlus className="w-5 h-5" />,
      keys: ['welcome_email_subject', 'welcome_email_message'],
      isEmail: true,
      placeholders: {
        '{{firstName}}': currentLang === 'nl' ? 'Voornaam van het lid' : "Member's first name",
        '{{verifyLink}}': currentLang === 'nl' ? 'Verificatie link (automatisch)' : 'Verification link (automatic)',
      },
    },
    {
      id: 'waitlist',
      title: currentLang === 'nl' ? 'Wachtlijst Bevestiging' : 'Waitlist Confirmation',
      description: currentLang === 'nl' 
        ? 'E-mail die mensen ontvangen na aanmelding op de wachtlijst' 
        : 'Email that people receive after joining the waitlist',
      icon: <Mail className="w-5 h-5" />,
      keys: ['waitlist_email_subject', 'waitlist_email_message'],
      isEmail: true,
      placeholders: {
        '{{firstName}}': currentLang === 'nl' ? 'Voornaam van de aanmelder' : "Subscriber's first name",
        '{{name}}': currentLang === 'nl' ? 'Volledige naam' : 'Full name',
      },
    },
    {
      id: 'unsubscribe',
      title: currentLang === 'nl' ? 'Uitschrijf Bevestiging' : 'Unsubscribe Confirmation',
      description: currentLang === 'nl' 
        ? 'E-mail die mensen ontvangen na uitschrijven' 
        : 'Email that people receive after unsubscribing',
      icon: <LogOut className="w-5 h-5" />,
      keys: ['unsubscribe_email_subject', 'unsubscribe_email_message'],
      isEmail: true,
      placeholders: {
        '{{firstName}}': currentLang === 'nl' ? 'Voornaam van de persoon' : "Person's first name",
        '{{name}}': currentLang === 'nl' ? 'Volledige naam' : 'Full name',
      },
    },
  ];

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
      // Dashboard messages
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
      // Welcome email
      welcome_email_subject: {
        label: currentLang === 'nl' ? 'E-mail Onderwerp' : 'Email Subject',
        description: currentLang === 'nl' 
          ? 'Onderwerp van de welkomst-/verificatie email' 
          : 'Subject line of the welcome/verification email',
      },
      welcome_email_message: {
        label: currentLang === 'nl' ? 'E-mail Bericht' : 'Email Message',
        description: currentLang === 'nl' 
          ? 'Inhoud van de welkomst-/verificatie email' 
          : 'Content of the welcome/verification email',
      },
      // Waitlist email
      waitlist_email_subject: {
        label: currentLang === 'nl' ? 'E-mail Onderwerp' : 'Email Subject',
        description: currentLang === 'nl' 
          ? 'Onderwerp van de wachtlijst bevestigingsmail' 
          : 'Subject line of the waitlist confirmation email',
      },
      waitlist_email_message: {
        label: currentLang === 'nl' ? 'E-mail Bericht' : 'Email Message',
        description: currentLang === 'nl' 
          ? 'Inhoud van de wachtlijst bevestigingsmail' 
          : 'Content of the waitlist confirmation email',
      },
      // Unsubscribe email
      unsubscribe_email_subject: {
        label: currentLang === 'nl' ? 'E-mail Onderwerp' : 'Email Subject',
        description: currentLang === 'nl' 
          ? 'Onderwerp van de uitschrijf bevestigingsmail' 
          : 'Subject line of the unsubscribe confirmation email',
      },
      unsubscribe_email_message: {
        label: currentLang === 'nl' ? 'E-mail Bericht' : 'Email Message',
        description: currentLang === 'nl' 
          ? 'Inhoud van de uitschrijf bevestigingsmail' 
          : 'Content of the unsubscribe confirmation email',
      },
    };
    return labels[key] || { label: key, description: '' };
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
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
          <h2 className="font-serif text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {currentLang === 'nl' ? 'Berichten Instellingen' : 'Message Settings'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {currentLang === 'nl' 
              ? 'Beheer alle berichten en e-mailtemplates op één plek' 
              : 'Manage all messages and email templates in one place'}
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

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const sectionSettings = settings.filter(s => section.keys.includes(s.key));
          const isOpen = openSections[section.id];

          return (
            <Collapsible
              key={section.id}
              open={isOpen}
              onOpenChange={() => toggleSection(section.id)}
              className="bg-card border border-border"
            >
              <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">{section.icon}</div>
                  <div className="text-left">
                    <h3 className="font-medium">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t border-border divide-y divide-border">
                  {/* Placeholders info */}
                  {section.placeholders && (
                    <div className="p-4 bg-muted/30">
                      <p className="text-sm font-medium mb-2">
                        {currentLang === 'nl' ? 'Beschikbare placeholders:' : 'Available placeholders:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(section.placeholders).map(([placeholder, desc]) => (
                          <span
                            key={placeholder}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-background border border-border text-xs"
                            title={desc}
                          >
                            <code className="text-primary">{placeholder}</code>
                            <span className="text-muted-foreground">- {desc}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Settings fields */}
                  {sectionSettings.map((setting) => {
                    const { label, description } = getSettingLabel(setting.key);
                    const value = editLang === 'en' ? setting.value_en : setting.value_nl;
                    const field = editLang === 'en' ? 'value_en' : 'value_nl';
                    const isTextArea = setting.key.includes('message');

                    return (
                      <div key={setting.id} className="p-4">
                        <label className="block">
                          <span className="font-medium">{label}</span>
                          <span className="block text-sm text-muted-foreground mb-3">{description}</span>
                          {isTextArea ? (
                            <textarea
                              value={value || ''}
                              onChange={(e) => updateSetting(setting.key, field, e.target.value)}
                              className="input-luxury w-full min-h-[120px] resize-y"
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

                  {/* Email Preview Button */}
                  {section.isEmail && (
                    <div className="p-4 bg-muted/20 border-t border-border">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="btn-luxury-outline flex items-center gap-2 w-full justify-center">
                            <Eye className="w-4 h-4" />
                            {currentLang === 'nl' ? 'Bekijk Email Preview' : 'View Email Preview'}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Mail className="w-5 h-5" />
                              {section.title} - Preview ({editLang.toUpperCase()})
                            </DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            <EmailPreview
                              subject={
                                editLang === 'en'
                                  ? sectionSettings.find(s => s.key.includes('subject'))?.value_en || ''
                                  : sectionSettings.find(s => s.key.includes('subject'))?.value_nl || ''
                              }
                              message={
                                editLang === 'en'
                                  ? sectionSettings.find(s => s.key.includes('message'))?.value_en || ''
                                  : sectionSettings.find(s => s.key.includes('message'))?.value_nl || ''
                              }
                            />
                            <p className="text-xs text-muted-foreground mt-4 text-center">
                              {currentLang === 'nl' 
                                ? 'Placeholders worden vervangen door voorbeelddata (bijv. {{firstName}} → Jan)'
                                : 'Placeholders are replaced with sample data (e.g. {{firstName}} → Jan)'}
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Preview Section */}
      <div className="bg-muted/30 border border-border p-6">
        <h3 className="font-serif text-lg mb-4">
          {currentLang === 'nl' ? 'Preview: Dashboard Berichten' : 'Preview: Dashboard Messages'}
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
