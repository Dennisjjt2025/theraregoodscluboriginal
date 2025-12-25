import { Dispatch, SetStateAction, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaUpload } from './MediaUpload';
import { DropGalleryManager } from './DropGalleryManager';
import { FileText, Image, Settings, Package, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DropFormData {
  title_en: string;
  title_nl: string;
  description_en: string;
  description_nl: string;
  story_en: string;
  story_nl: string;
  tasting_notes_en: string;
  tasting_notes_nl: string;
  origin: string;
  vintage: string;
  price: string;
  quantity_available: string;
  quantity_sold: number;
  image_url: string;
  video_url: string;
  shopify_product_id: string;
  starts_at: string;
  ends_at: string;
  is_draft: boolean;
  noEndDate: boolean;
}

interface DropEditorFormProps {
  form: DropFormData;
  setForm: Dispatch<SetStateAction<DropFormData>>;
  mode: 'edit' | 'create' | 'duplicate';
  dropId?: string;
}

// Form field component with label and optional AI translate button
function FormField({ 
  label, 
  required = false, 
  children, 
  hint,
  charCount,
  maxChars,
  onTranslate,
  isTranslating,
  showTranslate = false,
}: { 
  label: string; 
  required?: boolean; 
  children: React.ReactNode;
  hint?: string;
  charCount?: number;
  maxChars?: number;
  onTranslate?: () => void;
  isTranslating?: boolean;
  showTranslate?: boolean;
}) {
  const { language } = useLanguage();
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {showTranslate && onTranslate && (
            <button
              type="button"
              onClick={onTranslate}
              disabled={isTranslating}
              className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              title={language === 'nl' ? 'Vertaal met AI' : 'Translate with AI'}
            >
              {isTranslating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">AI</span>
            </button>
          )}
          {charCount !== undefined && maxChars && (
            <span className={`text-xs ${charCount > maxChars ? 'text-destructive' : 'text-muted-foreground'}`}>
              {charCount}/{maxChars}
            </span>
          )}
        </div>
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function DropEditorForm({ form, setForm, mode, dropId }: DropEditorFormProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('basic');
  const [translating, setTranslating] = useState<string | null>(null);

  const updateForm = (field: keyof DropFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // AI Translation function
  const translateField = async (
    field: 'title' | 'description' | 'story' | 'details',
    sourceField: keyof DropFormData,
    targetField: keyof DropFormData,
    sourceLang: 'en' | 'nl'
  ) => {
    const sourceValue = form[sourceField];
    if (!sourceValue || typeof sourceValue !== 'string' || !sourceValue.trim()) {
      toast.error(language === 'nl' ? 'Vul eerst het bronveld in' : 'Fill in the source field first');
      return;
    }

    setTranslating(field);

    try {
      const { data, error } = await supabase.functions.invoke('translate-drop-content', {
        body: {
          text: sourceValue,
          field,
          sourceLanguage: sourceLang,
          generateBoth: false,
        },
      });

      if (error) throw error;

      const targetLang = sourceLang === 'en' ? 'nl' : 'en';
      const translatedValue = data[`${field}_${targetLang}`];
      
      if (translatedValue) {
        updateForm(targetField, translatedValue);
        toast.success(language === 'nl' ? 'Vertaling voltooid' : 'Translation complete');
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error(error.message || 'Translation failed');
    } finally {
      setTranslating(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="sticky top-0 z-10 bg-card grid grid-cols-4 gap-1 p-1 mx-4 mt-4 rounded-lg">
          <TabsTrigger value="basic" className="text-xs flex items-center gap-1.5 data-[state=active]:bg-background">
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="text-xs flex items-center gap-1.5 data-[state=active]:bg-background">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="text-xs flex items-center gap-1.5 data-[state=active]:bg-background">
            <Image className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Media</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs flex items-center gap-1.5 data-[state=active]:bg-background">
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Tab */}
          <TabsContent value="basic" className="mt-0 space-y-4">
            <div className="grid gap-4">
              <FormField 
                label="Title (English)" 
                required
                showTranslate={!!form.title_en}
                onTranslate={() => translateField('title', 'title_en', 'title_nl', 'en')}
                isTranslating={translating === 'title'}
              >
                <input
                  type="text"
                  value={form.title_en}
                  onChange={(e) => updateForm('title_en', e.target.value)}
                  placeholder="e.g., Château Margaux 2015"
                  className="input-luxury w-full"
                />
              </FormField>

              <FormField 
                label="Title (Dutch)" 
                required
                showTranslate={!!form.title_nl}
                onTranslate={() => translateField('title', 'title_nl', 'title_en', 'nl')}
                isTranslating={translating === 'title'}
              >
                <input
                  type="text"
                  value={form.title_nl}
                  onChange={(e) => updateForm('title_nl', e.target.value)}
                  placeholder="e.g., Château Margaux 2015"
                  className="input-luxury w-full"
                />
              </FormField>
            </div>

            <div className="grid gap-4">
              <FormField 
                label="Description (English)" 
                charCount={form.description_en.length}
                maxChars={300}
                showTranslate={!!form.description_en}
                onTranslate={() => translateField('description', 'description_en', 'description_nl', 'en')}
                isTranslating={translating === 'description'}
              >
                <textarea
                  value={form.description_en}
                  onChange={(e) => updateForm('description_en', e.target.value)}
                  placeholder="Short product description..."
                  rows={2}
                  className="input-luxury w-full resize-none"
                />
              </FormField>

              <FormField 
                label="Description (Dutch)"
                charCount={form.description_nl.length}
                maxChars={300}
                showTranslate={!!form.description_nl}
                onTranslate={() => translateField('description', 'description_nl', 'description_en', 'nl')}
                isTranslating={translating === 'description'}
              >
                <textarea
                  value={form.description_nl}
                  onChange={(e) => updateForm('description_nl', e.target.value)}
                  placeholder="Korte productbeschrijving..."
                  rows={2}
                  className="input-luxury w-full resize-none"
                />
              </FormField>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Origin" hint="e.g., Bordeaux, France">
                <input
                  type="text"
                  value={form.origin}
                  onChange={(e) => updateForm('origin', e.target.value)}
                  placeholder="Bordeaux, France"
                  className="input-luxury w-full"
                />
              </FormField>

              <FormField label="Vintage" hint="e.g., 2015">
                <input
                  type="text"
                  value={form.vintage}
                  onChange={(e) => updateForm('vintage', e.target.value)}
                  placeholder="2015"
                  className="input-luxury w-full"
                />
              </FormField>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Price (€)" required>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => updateForm('price', e.target.value)}
                  placeholder="299.00"
                  step="0.01"
                  min="0"
                  className="input-luxury w-full"
                />
              </FormField>

              <FormField label="Quantity Available" required>
                <input
                  type="number"
                  value={form.quantity_available}
                  onChange={(e) => updateForm('quantity_available', e.target.value)}
                  placeholder="50"
                  min="1"
                  className="input-luxury w-full"
                />
              </FormField>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="mt-0 space-y-4">
            <FormField 
              label="Story (English)"
              showTranslate={!!form.story_en}
              onTranslate={() => translateField('story', 'story_en', 'story_nl', 'en')}
              isTranslating={translating === 'story'}
            >
              <textarea
                value={form.story_en}
                onChange={(e) => updateForm('story_en', e.target.value)}
                placeholder="Tell the story behind this product..."
                rows={5}
                className="input-luxury w-full resize-none"
              />
            </FormField>

            <FormField 
              label="Story (Dutch)"
              showTranslate={!!form.story_nl}
              onTranslate={() => translateField('story', 'story_nl', 'story_en', 'nl')}
              isTranslating={translating === 'story'}
            >
              <textarea
                value={form.story_nl}
                onChange={(e) => updateForm('story_nl', e.target.value)}
                placeholder="Vertel het verhaal achter dit product..."
                rows={5}
                className="input-luxury w-full resize-none"
              />
            </FormField>

            <FormField 
              label="Details (English)" 
              hint="Previously 'Tasting Notes' - can be used for any product type"
              showTranslate={!!form.tasting_notes_en}
              onTranslate={() => translateField('details', 'tasting_notes_en', 'tasting_notes_nl', 'en')}
              isTranslating={translating === 'details'}
            >
              <textarea
                value={form.tasting_notes_en}
                onChange={(e) => updateForm('tasting_notes_en', e.target.value)}
                placeholder="Product details, specifications, tasting notes..."
                rows={3}
                className="input-luxury w-full resize-none"
              />
            </FormField>

            <FormField 
              label="Details (Dutch)"
              showTranslate={!!form.tasting_notes_nl}
              onTranslate={() => translateField('details', 'tasting_notes_nl', 'tasting_notes_en', 'nl')}
              isTranslating={translating === 'details'}
            >
              <textarea
                value={form.tasting_notes_nl}
                onChange={(e) => updateForm('tasting_notes_nl', e.target.value)}
                placeholder="Productdetails, specificaties, proefnotities..."
                rows={3}
                className="input-luxury w-full resize-none"
              />
            </FormField>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="mt-0 space-y-6">
            {/* Gallery Manager - Only for existing drops */}
            {mode === 'edit' && dropId && (
              <div className="border border-border rounded-lg p-4 bg-card">
                <DropGalleryManager dropId={dropId} />
              </div>
            )}

            {mode !== 'edit' && (
              <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground">
                <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Gallery images can be added after creating the drop.</p>
                <p className="text-xs mt-1">Use the fallback image below for the initial product image.</p>
              </div>
            )}

            <div className="grid gap-4">
              <MediaUpload
                currentUrl={form.image_url}
                onUpload={(url) => updateForm('image_url', url)}
                type="image"
                label="Fallback Image"
                showPreview={true}
              />

              <MediaUpload
                currentUrl={form.video_url}
                onUpload={(url) => updateForm('video_url', url)}
                type="video"
                label="Product Video (optional)"
                showPreview={false}
              />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0 space-y-4">
            <FormField label="Drop Start" required>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => updateForm('starts_at', e.target.value)}
                className="input-luxury w-full"
              />
            </FormField>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Drop End</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.noEndDate}
                    onChange={(e) => {
                      updateForm('noEndDate', e.target.checked);
                      if (e.target.checked) {
                        updateForm('ends_at', '');
                      }
                    }}
                    className="rounded border-border"
                  />
                  <span className="text-muted-foreground text-xs">While supplies last</span>
                </label>
              </div>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => updateForm('ends_at', e.target.value)}
                disabled={form.noEndDate}
                className={`input-luxury w-full ${form.noEndDate ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <FormField label="Shopify Product ID" hint="For checkout integration">
              <input
                type="text"
                value={form.shopify_product_id}
                onChange={(e) => updateForm('shopify_product_id', e.target.value)}
                placeholder="gid://shopify/Product/..."
                className="input-luxury w-full"
              />
            </FormField>

            <div className="pt-4 border-t border-border space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.is_draft}
                  onChange={(e) => updateForm('is_draft', e.target.checked)}
                  className="rounded border-border w-4 h-4"
                />
                <div>
                  <span className="text-sm font-medium">Save as draft</span>
                  <p className="text-xs text-muted-foreground">Won't be visible to members until published</p>
                </div>
              </label>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
