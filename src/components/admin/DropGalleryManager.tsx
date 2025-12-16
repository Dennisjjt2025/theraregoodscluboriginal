import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, X, GripVertical, Loader2, Image as ImageIcon } from 'lucide-react';
import { MediaUpload } from './MediaUpload';

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

interface DropGalleryManagerProps {
  dropId: string;
}

export function DropGalleryManager({ dropId }: DropGalleryManagerProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchImages();
  }, [dropId]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('drop_images')
        .select('*')
        .eq('drop_id', dropId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async (url: string) => {
    setUploading(true);
    try {
      const nextSortOrder = images.length > 0 
        ? Math.max(...images.map(i => i.sort_order)) + 1 
        : 0;

      const { data, error } = await supabase
        .from('drop_images')
        .insert({
          drop_id: dropId,
          image_url: url,
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (error) throw error;
      setImages([...images, data]);
      toast.success('Image added to gallery');
    } catch (error: any) {
      console.error('Error adding image:', error);
      toast.error('Failed to add image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('drop_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      setImages(images.filter(i => i.id !== imageId));
      toast.success('Image removed');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    // Update sort_order
    newImages.forEach((img, i) => {
      img.sort_order = i;
    });

    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    
    // Save new order to database
    try {
      const updates = images.map((img, index) => ({
        id: img.id,
        drop_id: dropId,
        image_url: img.image_url,
        alt_text: img.alt_text,
        sort_order: index,
      }));

      const { error } = await supabase
        .from('drop_images')
        .upsert(updates);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save image order');
      fetchImages(); // Reload original order
    }
  };

  const handleAltTextChange = async (imageId: string, altText: string) => {
    try {
      const { error } = await supabase
        .from('drop_images')
        .update({ alt_text: altText })
        .eq('id', imageId);

      if (error) throw error;
      setImages(images.map(img => 
        img.id === imageId ? { ...img, alt_text: altText } : img
      ));
    } catch (error) {
      console.error('Error updating alt text:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Product Gallery ({images.length} images)
        </h3>
      </div>

      {/* Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group border border-border rounded-lg overflow-hidden bg-muted cursor-move ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <div className="aspect-square">
                <img
                  src={image.image_url}
                  alt={image.alt_text || `Gallery image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Drag handle */}
              <div className="absolute top-2 left-2 p-1 bg-background/80 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4" />
              </div>
              
              {/* Remove button */}
              <button
                onClick={() => handleRemoveImage(image.id)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Order indicator */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-background/80 rounded text-xs font-medium">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No gallery images yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add images to create a product gallery</p>
        </div>
      )}

      {/* Add Image Button */}
      <div className="border border-dashed border-border rounded-lg p-4">
        <MediaUpload
          currentUrl=""
          onUpload={handleAddImage}
          type="image"
          label="Add Gallery Image"
          showPreview={false}
        />
      </div>

      {images.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Drag and drop to reorder images. The first image will be the main hero image.
        </p>
      )}
    </div>
  );
}
