import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { X, Save, Copy, Loader2, Smartphone, Monitor } from 'lucide-react';
import { DropEditorForm, DropFormData } from './DropEditorForm';
import { DropEditorPreview } from './DropEditorPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Drop {
  id: string;
  title_en: string;
  title_nl: string;
  description_en?: string;
  description_nl?: string;
  story_en?: string;
  story_nl?: string;
  tasting_notes_en?: string;
  tasting_notes_nl?: string;
  origin?: string;
  vintage?: string;
  price: number;
  quantity_available: number;
  quantity_sold?: number;
  image_url?: string;
  video_url?: string;
  starts_at: string;
  ends_at?: string;
  is_active: boolean;
  is_public: boolean;
  is_draft?: boolean;
}

interface DropEditorProps {
  drop: Drop | null;
  onClose: () => void;
  onSave: () => void;
  mode: 'edit' | 'create' | 'duplicate';
}

const initialFormData: DropFormData = {
  title_en: '',
  title_nl: '',
  description_en: '',
  description_nl: '',
  story_en: '',
  story_nl: '',
  tasting_notes_en: '',
  tasting_notes_nl: '',
  origin: '',
  vintage: '',
  price: '',
  quantity_available: '',
  quantity_sold: 0,
  image_url: '',
  video_url: '',
  starts_at: '',
  ends_at: '',
  is_draft: false,
  noEndDate: false,
};

export function DropEditor({ drop, onClose, onSave, mode }: DropEditorProps) {
  const { t, language } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DropFormData>(initialFormData);
  const [previewLang, setPreviewLang] = useState<'en' | 'nl'>(language);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('desktop');
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [galleryImages, setGalleryImages] = useState<Array<{ id: string; image_url: string; alt_text: string | null; sort_order: number }>>([]);

  // Format date for input
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  // Load drop data when editing/duplicating
  useEffect(() => {
    if (drop && (mode === 'edit' || mode === 'duplicate')) {
      setForm({
        title_en: drop.title_en || '',
        title_nl: drop.title_nl || '',
        description_en: drop.description_en || '',
        description_nl: drop.description_nl || '',
        story_en: drop.story_en || '',
        story_nl: drop.story_nl || '',
        tasting_notes_en: drop.tasting_notes_en || '',
        tasting_notes_nl: drop.tasting_notes_nl || '',
        origin: drop.origin || '',
        vintage: drop.vintage || '',
        price: drop.price?.toString() || '',
        quantity_available: drop.quantity_available?.toString() || '',
        quantity_sold: drop.quantity_sold || 0,
        image_url: drop.image_url || '',
        video_url: drop.video_url || '',
        starts_at: drop.starts_at ? formatDateForInput(drop.starts_at) : '',
        ends_at: drop.ends_at ? formatDateForInput(drop.ends_at) : '',
        is_draft: drop.is_draft || false,
        noEndDate: !drop.ends_at,
      });

      // Fetch gallery images for existing drop
      if (mode === 'edit') {
        fetchGalleryImages(drop.id);
      }
    }
  }, [drop, mode]);

  const fetchGalleryImages = async (dropId: string) => {
    const { data, error } = await supabase
      .from('drop_images')
      .select('id, image_url, alt_text, sort_order')
      .eq('drop_id', dropId)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setGalleryImages(data);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);

    try {
      const dropData = {
        title_en: form.title_en,
        title_nl: form.title_nl,
        description_en: form.description_en || null,
        description_nl: form.description_nl || null,
        story_en: form.story_en || null,
        story_nl: form.story_nl || null,
        tasting_notes_en: form.tasting_notes_en || null,
        tasting_notes_nl: form.tasting_notes_nl || null,
        origin: form.origin || null,
        vintage: form.vintage || null,
        price: parseFloat(form.price),
        quantity_available: parseInt(form.quantity_available),
        image_url: form.image_url || null,
        video_url: form.video_url || null,
        starts_at: form.starts_at,
        ends_at: form.noEndDate ? null : form.ends_at || null,
        is_draft: form.is_draft,
      };

      if (mode === 'edit' && drop) {
        const { error } = await supabase
          .from('drops')
          .update(dropData)
          .eq('id', drop.id);

        if (error) throw error;
        toast.success('Drop updated successfully');
      } else {
        const { error } = await supabase
          .from('drops')
          .insert({
            ...dropData,
            is_active: false,
            is_public: false,
            quantity_sold: 0,
          });

        if (error) throw error;
        toast.success(mode === 'duplicate' ? 'Drop duplicated successfully' : 'Drop created successfully');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Save drop error:', error);
      toast.error(error.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'edit': return 'Edit Drop';
      case 'duplicate': return 'Duplicate Drop';
      default: return t.admin.createDrop;
    }
  };

  const isFormValid = form.title_en && form.title_nl && form.price && form.quantity_available && form.starts_at;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {mode === 'duplicate' && <Copy className="w-5 h-5" />}
          <h2 className="font-serif text-lg md:text-xl">{getTitle()}</h2>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Language toggle for preview */}
          <div className="hidden md:flex items-center gap-1 bg-muted rounded-md p-1">
            <button
              type="button"
              onClick={() => setPreviewLang('en')}
              className={`px-2 py-1 text-xs rounded ${previewLang === 'en' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang('nl')}
              className={`px-2 py-1 text-xs rounded ${previewLang === 'nl' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              NL
            </button>
          </div>

          {/* Viewport toggle for preview */}
          <div className="hidden lg:flex items-center gap-1 bg-muted rounded-md p-1">
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              className={`p-1.5 rounded ${previewMode === 'mobile' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
              title="Mobile preview"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              className={`p-1.5 rounded ${previewMode === 'desktop' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
              title="Desktop preview"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-outline-luxury text-sm py-1.5 px-3"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !isFormValid}
            className="btn-luxury text-sm py-1.5 px-3 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {mode === 'edit' ? 'Save' : mode === 'duplicate' ? 'Create Copy' : 'Create'}
            </span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden border-b border-border">
        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as 'form' | 'preview')}>
          <TabsList className="w-full grid grid-cols-2 bg-muted/50 rounded-none h-12">
            <TabsTrigger value="form" className="data-[state=active]:bg-background rounded-none">
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-background rounded-none">
              Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content: Split pane on desktop, tabs on mobile */}
      <div className="flex-1 overflow-hidden flex">
        {/* Form Panel */}
        <div className={`${mobileTab === 'form' ? 'flex' : 'hidden'} md:flex md:w-1/2 lg:w-[45%] flex-col border-r border-border overflow-hidden`}>
          <DropEditorForm
            form={form}
            setForm={setForm}
            mode={mode}
            dropId={drop?.id}
          />
        </div>

        {/* Preview Panel */}
        <div className={`${mobileTab === 'preview' ? 'flex' : 'hidden'} md:flex md:w-1/2 lg:w-[55%] flex-col overflow-hidden bg-muted/30`}>
          {/* Mobile language toggle */}
          <div className="md:hidden flex items-center justify-center gap-2 p-2 bg-muted/50">
            <span className="text-xs text-muted-foreground">Preview:</span>
            <div className="flex items-center gap-1 bg-background rounded-md p-1">
              <button
                type="button"
                onClick={() => setPreviewLang('en')}
                className={`px-2 py-1 text-xs rounded ${previewLang === 'en' ? 'bg-muted' : 'text-muted-foreground'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setPreviewLang('nl')}
                className={`px-2 py-1 text-xs rounded ${previewLang === 'nl' ? 'bg-muted' : 'text-muted-foreground'}`}
              >
                NL
              </button>
            </div>
          </div>

          <DropEditorPreview
            form={form}
            previewLang={previewLang}
            previewMode={previewMode}
            galleryImages={galleryImages}
          />
        </div>
      </div>
    </div>
  );
}
