import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Category {
  id: string;
  key: string;
  label_en: string;
  label_nl: string;
  sort_order: number;
  is_active: boolean;
}

export function PreferenceCategoriesManager() {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ key: '', label_en: '', label_nl: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('preference_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Kon categorieën niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.key || !formData.label_en || !formData.label_nl) {
      toast.error('Vul alle velden in');
      return;
    }

    setSaving(true);
    try {
      const maxSortOrder = Math.max(...categories.map(c => c.sort_order), 0);
      
      const { error } = await supabase
        .from('preference_categories')
        .insert({
          key: formData.key.toLowerCase().replace(/\s+/g, '_'),
          label_en: formData.label_en,
          label_nl: formData.label_nl,
          sort_order: maxSortOrder + 1,
        });

      if (error) throw error;

      toast.success('Categorie toegevoegd');
      setShowAddDialog(false);
      setFormData({ key: '', label_en: '', label_nl: '' });
      fetchCategories();
    } catch (error: any) {
      console.error('Error adding category:', error);
      if (error.code === '23505') {
        toast.error('Een categorie met deze key bestaat al');
      } else {
        toast.error('Kon categorie niet toevoegen');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingCategory) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('preference_categories')
        .update({
          label_en: formData.label_en,
          label_nl: formData.label_nl,
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast.success('Categorie bijgewerkt');
      setEditingCategory(null);
      setFormData({ key: '', label_en: '', label_nl: '' });
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Kon categorie niet bijwerken');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;

    try {
      const { error } = await supabase
        .from('preference_categories')
        .update({ is_active: false })
        .eq('id', deleteCategory.id);

      if (error) throw error;

      toast.success('Categorie verwijderd');
      setDeleteCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Kon categorie niet verwijderen');
    }
  };

  const handleRestore = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('preference_categories')
        .update({ is_active: true })
        .eq('id', category.id);

      if (error) throw error;

      toast.success('Categorie hersteld');
      fetchCategories();
    } catch (error) {
      console.error('Error restoring category:', error);
      toast.error('Kon categorie niet herstellen');
    }
  };

  const moveCategory = async (category: Category, direction: 'up' | 'down') => {
    const activeCategories = categories.filter(c => c.is_active);
    const currentIndex = activeCategories.findIndex(c => c.id === category.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= activeCategories.length) return;

    const targetCategory = activeCategories[targetIndex];

    try {
      await supabase
        .from('preference_categories')
        .update({ sort_order: targetCategory.sort_order })
        .eq('id', category.id);

      await supabase
        .from('preference_categories')
        .update({ sort_order: category.sort_order })
        .eq('id', targetCategory.id);

      fetchCategories();
    } catch (error) {
      console.error('Error reordering categories:', error);
      toast.error('Kon volgorde niet aanpassen');
    }
  };

  const openEditDialog = (category: Category) => {
    setFormData({
      key: category.key,
      label_en: category.label_en,
      label_nl: category.label_nl,
    });
    setEditingCategory(category);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeCategories = categories.filter(c => c.is_active);
  const inactiveCategories = categories.filter(c => !c.is_active);

  return (
    <div className="bg-card border border-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="font-serif text-xl">
          {language === 'nl' ? 'Categorieën Beheren' : 'Manage Categories'}
        </h2>
        <Button
          onClick={() => {
            setFormData({ key: '', label_en: '', label_nl: '' });
            setShowAddDialog(true);
          }}
          size="sm"
          className="gap-2 min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {language === 'nl' ? 'Toevoegen' : 'Add'}
        </Button>
      </div>

      {/* Active Categories */}
      <div className="space-y-2">
        {activeCategories.map((category, index) => (
          <div
            key={category.id}
            className="flex items-center gap-2 sm:gap-3 p-3 bg-muted/30 border border-border rounded"
          >
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveCategory(category, 'up')}
                disabled={index === 0}
                className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-muted rounded disabled:opacity-30"
              >
                <GripVertical className="w-4 h-4 rotate-180" />
              </button>
              <button
                onClick={() => moveCategory(category, 'down')}
                disabled={index === activeCategories.length - 1}
                className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-muted rounded disabled:opacity-30"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {language === 'nl' ? category.label_nl : category.label_en}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                <span className="hidden sm:inline">{language === 'nl' ? category.label_en : category.label_nl}</span>
                <span className="hidden sm:inline mx-2">•</span>
                <code className="text-xs">{category.key}</code>
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(category)}
                className="h-10 w-10 min-h-[44px] min-w-[44px]"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteCategory(category)}
                className="h-10 w-10 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Inactive Categories */}
      {inactiveCategories.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {language === 'nl' ? 'Verwijderde categorieën' : 'Deleted categories'}
          </h3>
          <div className="space-y-2">
            {inactiveCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 p-3 bg-muted/10 border border-border/50 rounded opacity-60"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate line-through">
                    {language === 'nl' ? category.label_nl : category.label_en}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(category)}
                >
                  {language === 'nl' ? 'Herstellen' : 'Restore'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'nl' ? 'Nieuwe Categorie' : 'New Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Key (uniek ID)</label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="bijv. jewelry_watches"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Wordt automatisch lowercase met underscores
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Nederlands</label>
              <Input
                value={formData.label_nl}
                onChange={(e) => setFormData({ ...formData, label_nl: e.target.value })}
                placeholder="Sieraden & Horloges"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">English</label>
              <Input
                value={formData.label_en}
                onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
                placeholder="Jewelry & Watches"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {language === 'nl' ? 'Annuleren' : 'Cancel'}
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? '...' : language === 'nl' ? 'Toevoegen' : 'Add'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'nl' ? 'Categorie Bewerken' : 'Edit Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Key</label>
              <Input value={formData.key} disabled className="bg-muted" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Nederlands</label>
              <Input
                value={formData.label_nl}
                onChange={(e) => setFormData({ ...formData, label_nl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">English</label>
              <Input
                value={formData.label_en}
                onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              {language === 'nl' ? 'Annuleren' : 'Cancel'}
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? '...' : language === 'nl' ? 'Opslaan' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'nl' ? 'Categorie verwijderen?' : 'Delete category?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'nl'
                ? 'De categorie wordt gedeactiveerd. Bestaande voorkeuren blijven behouden. Je kunt de categorie later herstellen.'
                : 'The category will be deactivated. Existing preferences will be kept. You can restore the category later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'nl' ? 'Annuleren' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'nl' ? 'Verwijderen' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
