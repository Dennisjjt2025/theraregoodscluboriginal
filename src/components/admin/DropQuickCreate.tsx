import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  RotateCcw,
  Save,
  X
} from 'lucide-react';

interface DropQuickCreateProps {
  onClose: () => void;
  onSave: () => void;
  onSwitchToFull: (formData: GeneratedContent & BasicInfo) => void;
}

interface BasicInfo {
  origin: string;
  vintage: string;
  price: string;
  quantity_available: string;
}

interface GeneratedContent {
  title_en: string;
  title_nl: string;
  description_en: string;
  description_nl: string;
  story_en: string;
  story_nl: string;
  details_en: string;
  details_nl: string;
}

type Step = 'input' | 'generating' | 'review';

export function DropQuickCreate({ onClose, onSave, onSwitchToFull }: DropQuickCreateProps) {
  const { language, t } = useLanguage();
  const [step, setStep] = useState<Step>('input');
  const [saving, setSaving] = useState(false);
  
  // Input step state
  const [description, setDescription] = useState('');
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    origin: '',
    vintage: '',
    price: '',
    quantity_available: '',
  });
  
  // Generated content state
  const [content, setContent] = useState<GeneratedContent>({
    title_en: '',
    title_nl: '',
    description_en: '',
    description_nl: '',
    story_en: '',
    story_nl: '',
    details_en: '',
    details_nl: '',
  });
  
  // Track which fields are being regenerated
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const generateContent = async () => {
    if (!description.trim()) {
      toast.error(language === 'nl' ? 'Voer een beschrijving in' : 'Please enter a description');
      return;
    }

    setStep('generating');

    try {
      const { data, error } = await supabase.functions.invoke('generate-drop-content', {
        body: {
          description,
          origin: basicInfo.origin,
          vintage: basicInfo.vintage,
        },
      });

      if (error) throw error;

      setContent({
        title_en: data.title_en || '',
        title_nl: data.title_nl || '',
        description_en: data.description_en || '',
        description_nl: data.description_nl || '',
        story_en: data.story_en || '',
        story_nl: data.story_nl || '',
        details_en: data.details_en || '',
        details_nl: data.details_nl || '',
      });

      setStep('review');
    } catch (error: any) {
      console.error('Generate content error:', error);
      toast.error(error.message || 'Failed to generate content');
      setStep('input');
    }
  };

  const regenerateField = async (field: 'title' | 'description' | 'story' | 'details') => {
    setRegenerating(field);

    try {
      const { data, error } = await supabase.functions.invoke('translate-drop-content', {
        body: {
          text: description,
          field,
          generateBoth: true,
        },
      });

      if (error) throw error;

      setContent(prev => ({
        ...prev,
        [`${field}_en`]: data[`${field}_en`] || prev[`${field}_en` as keyof GeneratedContent],
        [`${field}_nl`]: data[`${field}_nl`] || prev[`${field}_nl` as keyof GeneratedContent],
      }));

      toast.success(language === 'nl' ? 'Veld opnieuw gegenereerd' : 'Field regenerated');
    } catch (error: any) {
      console.error('Regenerate error:', error);
      toast.error(error.message || 'Failed to regenerate');
    } finally {
      setRegenerating(null);
    }
  };

  const handleSave = async () => {
    if (!basicInfo.price || !basicInfo.quantity_available) {
      toast.error(language === 'nl' ? 'Prijs en aantal zijn verplicht' : 'Price and quantity are required');
      return;
    }

    setSaving(true);

    try {
      // Create the drop with default dates (starts now)
      const { error } = await supabase.from('drops').insert({
        title_en: content.title_en,
        title_nl: content.title_nl,
        description_en: content.description_en || null,
        description_nl: content.description_nl || null,
        story_en: content.story_en || null,
        story_nl: content.story_nl || null,
        tasting_notes_en: content.details_en || null,
        tasting_notes_nl: content.details_nl || null,
        origin: basicInfo.origin || null,
        vintage: basicInfo.vintage || null,
        price: parseFloat(basicInfo.price),
        quantity_available: parseInt(basicInfo.quantity_available),
        quantity_sold: 0,
        is_active: false,
        is_public: false,
        is_draft: true,
        starts_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success(language === 'nl' ? 'Drop aangemaakt als concept' : 'Drop created as draft');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save drop');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToFull = () => {
    onSwitchToFull({
      ...content,
      ...basicInfo,
    });
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-lg">
            {language === 'nl' ? 'Snelle Drop Creator' : 'Quick Drop Creator'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress indicator */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2 text-sm">
          <span className={`flex items-center gap-1.5 ${step === 'input' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">1</span>
            {language === 'nl' ? 'Beschrijf' : 'Describe'}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className={`flex items-center gap-1.5 ${step === 'generating' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">2</span>
            {language === 'nl' ? 'Genereer' : 'Generate'}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className={`flex items-center gap-1.5 ${step === 'review' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">3</span>
            {language === 'nl' ? 'Review' : 'Review'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h3 className="text-xl font-serif">
                {language === 'nl' ? 'Beschrijf je drop' : 'Describe your drop'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {language === 'nl' 
                  ? 'Vertel ons over het product en AI genereert de content in EN en NL' 
                  : 'Tell us about the product and AI will generate content in EN and NL'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'nl' ? 'Productbeschrijving' : 'Product Description'} *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'nl' 
                    ? 'Bijv: Een zeldzame Château Margaux 2015, afkomstig van een familie wijnhuis in de Médoc. Hints van cassis, cederhout en violetten...'
                    : 'E.g: A rare Château Margaux 2015, sourced from a family winery in Médoc. Notes of cassis, cedar wood and violets...'}
                  rows={5}
                  className="input-luxury w-full resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'nl' 
                    ? 'Hoe meer detail, hoe beter de gegenereerde content' 
                    : 'The more detail, the better the generated content'}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === 'nl' ? 'Herkomst' : 'Origin'}
                  </label>
                  <input
                    type="text"
                    value={basicInfo.origin}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, origin: e.target.value }))}
                    placeholder="Bordeaux, France"
                    className="input-luxury w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === 'nl' ? 'Jaargang' : 'Vintage'}
                  </label>
                  <input
                    type="text"
                    value={basicInfo.vintage}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, vintage: e.target.value }))}
                    placeholder="2015"
                    className="input-luxury w-full"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === 'nl' ? 'Prijs (€)' : 'Price (€)'} *
                  </label>
                  <input
                    type="number"
                    value={basicInfo.price}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="299.00"
                    step="0.01"
                    min="0"
                    className="input-luxury w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === 'nl' ? 'Aantal beschikbaar' : 'Quantity Available'} *
                  </label>
                  <input
                    type="number"
                    value={basicInfo.quantity_available}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, quantity_available: e.target.value }))}
                    placeholder="50"
                    min="1"
                    className="input-luxury w-full"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={generateContent}
                disabled={!description.trim()}
                className="btn-luxury w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {language === 'nl' ? 'Genereer Content' : 'Generate Content'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generating - Skeleton UI */}
        {step === 'generating' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-6">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="text-lg font-medium">
                  {language === 'nl' ? 'Content wordt gegenereerd...' : 'Generating content...'}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'nl' 
                  ? 'AI schrijft je drop in Engels en Nederlands' 
                  : 'AI is writing your drop in English and Dutch'}
              </p>
              
              {/* Animated Progress Bar */}
              <div className="w-full max-w-md mx-auto mt-4">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-progress" />
                </div>
              </div>
            </div>

            {/* Skeleton for Title */}
            <div className="bg-card rounded-lg border border-border p-4 space-y-3 animate-fade-in" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Skeleton for Description */}
            <div className="bg-card rounded-lg border border-border p-4 space-y-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>

            {/* Skeleton for Story */}
            <div className="bg-card rounded-lg border border-border p-4 space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>

            {/* Skeleton for Details */}
            <div className="bg-card rounded-lg border border-border p-4 space-y-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-6">
              <h3 className="text-xl font-serif flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                {language === 'nl' ? 'Content gegenereerd!' : 'Content generated!'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {language === 'nl' 
                  ? 'Review en pas aan waar nodig' 
                  : 'Review and adjust as needed'}
              </p>
            </div>

            {/* Title */}
            <ContentField
              label={language === 'nl' ? 'Titel' : 'Title'}
              fieldKey="title"
              valueEn={content.title_en}
              valueNl={content.title_nl}
              onChangeEn={(v) => setContent(prev => ({ ...prev, title_en: v }))}
              onChangeNl={(v) => setContent(prev => ({ ...prev, title_nl: v }))}
              onRegenerate={() => regenerateField('title')}
              isRegenerating={regenerating === 'title'}
              isTextarea={false}
            />

            {/* Description */}
            <ContentField
              label={language === 'nl' ? 'Beschrijving' : 'Description'}
              fieldKey="description"
              valueEn={content.description_en}
              valueNl={content.description_nl}
              onChangeEn={(v) => setContent(prev => ({ ...prev, description_en: v }))}
              onChangeNl={(v) => setContent(prev => ({ ...prev, description_nl: v }))}
              onRegenerate={() => regenerateField('description')}
              isRegenerating={regenerating === 'description'}
              rows={2}
            />

            {/* Story */}
            <ContentField
              label={language === 'nl' ? 'Verhaal' : 'Story'}
              fieldKey="story"
              valueEn={content.story_en}
              valueNl={content.story_nl}
              onChangeEn={(v) => setContent(prev => ({ ...prev, story_en: v }))}
              onChangeNl={(v) => setContent(prev => ({ ...prev, story_nl: v }))}
              onRegenerate={() => regenerateField('story')}
              isRegenerating={regenerating === 'story'}
              rows={5}
            />

            {/* Details */}
            <ContentField
              label={language === 'nl' ? 'Details' : 'Details'}
              fieldKey="details"
              valueEn={content.details_en}
              valueNl={content.details_nl}
              onChangeEn={(v) => setContent(prev => ({ ...prev, details_en: v }))}
              onChangeNl={(v) => setContent(prev => ({ ...prev, details_nl: v }))}
              onRegenerate={() => regenerateField('details')}
              isRegenerating={regenerating === 'details'}
              rows={3}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      {step === 'review' && (
        <div className="bg-card border-t border-border px-4 py-3 flex flex-col sm:flex-row gap-2 sm:gap-4 shrink-0">
          <button
            onClick={() => setStep('input')}
            className="btn-outline-luxury py-2 px-4 flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {language === 'nl' ? 'Terug' : 'Back'}
          </button>
          
          <div className="flex-1" />
          
          <button
            onClick={handleSwitchToFull}
            className="btn-outline-luxury py-2 px-4 text-sm"
          >
            {language === 'nl' ? 'Open in volledige editor' : 'Open in full editor'}
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-luxury py-2 px-4 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {language === 'nl' ? 'Opslaan als concept' : 'Save as draft'}
          </button>
        </div>
      )}
    </div>
  );
}

// Helper component for content fields
interface ContentFieldProps {
  label: string;
  fieldKey: string;
  valueEn: string;
  valueNl: string;
  onChangeEn: (value: string) => void;
  onChangeNl: (value: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  isTextarea?: boolean;
  rows?: number;
}

function ContentField({
  label,
  valueEn,
  valueNl,
  onChangeEn,
  onChangeNl,
  onRegenerate,
  isRegenerating,
  isTextarea = true,
  rows = 3,
}: ContentFieldProps) {
  const { language } = useLanguage();
  
  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {isRegenerating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RotateCcw className="w-3 h-3" />
          )}
          {language === 'nl' ? 'Regenereer' : 'Regenerate'}
        </button>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">English</label>
          {isTextarea ? (
            <textarea
              value={valueEn}
              onChange={(e) => onChangeEn(e.target.value)}
              rows={rows}
              className="input-luxury w-full text-sm resize-none"
            />
          ) : (
            <input
              type="text"
              value={valueEn}
              onChange={(e) => onChangeEn(e.target.value)}
              className="input-luxury w-full text-sm"
            />
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nederlands</label>
          {isTextarea ? (
            <textarea
              value={valueNl}
              onChange={(e) => onChangeNl(e.target.value)}
              rows={rows}
              className="input-luxury w-full text-sm resize-none"
            />
          ) : (
            <input
              type="text"
              value={valueNl}
              onChange={(e) => onChangeNl(e.target.value)}
              className="input-luxury w-full text-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
