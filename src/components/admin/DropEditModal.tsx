import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { X, Save, Copy, Loader2 } from 'lucide-react';
import { MediaUpload } from './MediaUpload';
import { DropGalleryManager } from './DropGalleryManager';

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
  shopify_product_id?: string;
  starts_at: string;
  ends_at?: string;
  is_active: boolean;
  is_public: boolean;
  is_draft?: boolean;
}

interface DropEditModalProps {
  drop: Drop | null;
  onClose: () => void;
  onSave: () => void;
  mode: 'edit' | 'create' | 'duplicate';
}

export function DropEditModal({ drop, onClose, onSave, mode }: DropEditModalProps) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [noEndDate, setNoEndDate] = useState(false);
  
  const [form, setForm] = useState({
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
    image_url: '',
    video_url: '',
    shopify_product_id: '',
    starts_at: '',
    ends_at: '',
    is_draft: false,
  });

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
        image_url: drop.image_url || '',
        video_url: drop.video_url || '',
        shopify_product_id: drop.shopify_product_id || '',
        starts_at: drop.starts_at ? formatDateForInput(drop.starts_at) : '',
        ends_at: drop.ends_at ? formatDateForInput(drop.ends_at) : '',
        is_draft: drop.is_draft || false,
      });
      setNoEndDate(!drop.ends_at);
    }
  }, [drop, mode]);

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        shopify_product_id: form.shopify_product_id || null,
        starts_at: form.starts_at,
        ends_at: noEndDate ? null : form.ends_at || null,
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
        // Create or duplicate
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

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-serif text-xl flex items-center gap-2">
            {mode === 'duplicate' && <Copy className="w-5 h-5" />}
            {getTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              value={form.title_en}
              onChange={(e) => setForm({ ...form, title_en: e.target.value })}
              placeholder={t.admin.dropTitleEn}
              required
              className="input-luxury"
            />
            <input
              type="text"
              value={form.title_nl}
              onChange={(e) => setForm({ ...form, title_nl: e.target.value })}
              placeholder={t.admin.dropTitleNl}
              required
              className="input-luxury"
            />
          </div>

          {/* Descriptions */}
          <div className="grid md:grid-cols-2 gap-4">
            <textarea
              value={form.description_en}
              onChange={(e) => setForm({ ...form, description_en: e.target.value })}
              placeholder={t.admin.descriptionEn}
              rows={2}
              className="input-luxury"
            />
            <textarea
              value={form.description_nl}
              onChange={(e) => setForm({ ...form, description_nl: e.target.value })}
              placeholder={t.admin.descriptionNl}
              rows={2}
              className="input-luxury"
            />
          </div>

          {/* Stories */}
          <div className="grid md:grid-cols-2 gap-4">
            <textarea
              value={form.story_en}
              onChange={(e) => setForm({ ...form, story_en: e.target.value })}
              placeholder={t.admin.storyEn}
              rows={3}
              className="input-luxury"
            />
            <textarea
              value={form.story_nl}
              onChange={(e) => setForm({ ...form, story_nl: e.target.value })}
              placeholder={t.admin.storyNl}
              rows={3}
              className="input-luxury"
            />
          </div>

          {/* Tasting Notes */}
          <div className="grid md:grid-cols-2 gap-4">
            <textarea
              value={form.tasting_notes_en}
              onChange={(e) => setForm({ ...form, tasting_notes_en: e.target.value })}
              placeholder={t.admin.tastingNotesEn}
              rows={2}
              className="input-luxury"
            />
            <textarea
              value={form.tasting_notes_nl}
              onChange={(e) => setForm({ ...form, tasting_notes_nl: e.target.value })}
              placeholder={t.admin.tastingNotesNl}
              rows={2}
              className="input-luxury"
            />
          </div>

          {/* Origin & Vintage */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              placeholder="Origin (e.g., Bordeaux, France)"
              className="input-luxury"
            />
            <input
              type="text"
              value={form.vintage}
              onChange={(e) => setForm({ ...form, vintage: e.target.value })}
              placeholder="Vintage (e.g., 2015)"
              className="input-luxury"
            />
          </div>

          {/* Price & Quantity */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder={t.admin.price}
              step="0.01"
              required
              className="input-luxury"
            />
            <input
              type="number"
              value={form.quantity_available}
              onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
              placeholder={t.admin.quantity}
              required
              className="input-luxury"
            />
          </div>

          {/* Gallery Images - Only show when editing existing drop */}
          {mode === 'edit' && drop && (
            <div className="border-t border-border pt-6">
              <DropGalleryManager dropId={drop.id} />
            </div>
          )}

          {/* Legacy Media Uploads (for main image if no gallery) */}
          <div className="grid md:grid-cols-2 gap-4">
            <MediaUpload
              currentUrl={form.image_url}
              onUpload={(url) => setForm({ ...form, image_url: url })}
              type="image"
              label="Main Product Image (fallback if no gallery)"
            />
            <MediaUpload
              currentUrl={form.video_url}
              onUpload={(url) => setForm({ ...form, video_url: url })}
              type="video"
              label="Product Video (optional)"
            />
          </div>

          {/* Shopify ID */}
          <input
            type="text"
            value={form.shopify_product_id}
            onChange={(e) => setForm({ ...form, shopify_product_id: e.target.value })}
            placeholder={t.admin.shopifyProductId}
            className="input-luxury w-full"
          />

          {/* Dates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">{t.admin.startDate}</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                required
                className="input-luxury w-full"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-muted-foreground">{t.admin.endDate}</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noEndDate}
                    onChange={(e) => {
                      setNoEndDate(e.target.checked);
                      if (e.target.checked) {
                        setForm({ ...form, ends_at: '' });
                      }
                    }}
                    className="rounded border-border"
                  />
                  <span className="text-muted-foreground">While supplies last</span>
                </label>
              </div>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                disabled={noEndDate}
                className={`input-luxury w-full ${noEndDate ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          {/* Draft Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_draft}
              onChange={(e) => setForm({ ...form, is_draft: e.target.checked })}
              className="rounded border-border"
            />
            <span className="text-sm">Save as draft (won't be visible to members)</span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline-luxury"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-luxury flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {mode === 'edit' ? 'Save Changes' : mode === 'duplicate' ? 'Create Copy' : 'Create Drop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
