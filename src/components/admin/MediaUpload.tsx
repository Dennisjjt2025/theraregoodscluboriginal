import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Image, Video, Loader2 } from 'lucide-react';

interface MediaUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
  type?: 'image' | 'video' | 'both';
  label?: string;
  showPreview?: boolean;
}

export function MediaUpload({ currentUrl, onUpload, type = 'both', label, showPreview = true }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = {
    image: 'image/jpeg,image/png,image/webp,image/gif',
    video: 'video/mp4,video/webm,video/quicktime',
    both: 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime',
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (type === 'image' && !isImage) {
      toast.error('Please upload an image file');
      return;
    }
    if (type === 'video' && !isVideo) {
      toast.error('Please upload a video file');
      return;
    }
    if (type === 'both' && !isImage && !isVideo) {
      toast.error('Please upload an image or video file');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 52428800) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `drops/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('drop-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('drop-media')
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      onUpload(publicUrl);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const clearMedia = () => {
    setPreview(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isVideoPreview = preview?.match(/\.(mp4|webm|mov)$/i);

  return (
    <div className="space-y-2">
      {label && <label className="text-sm text-muted-foreground">{label}</label>}
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes[type]}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : preview && showPreview ? (
          <div className="relative">
            {isVideoPreview ? (
              <video
                src={preview}
                className="w-full h-40 object-cover rounded"
                controls
              />
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-40 object-cover rounded"
              />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearMedia();
              }}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <div className="flex items-center gap-2 mb-2">
              {(type === 'image' || type === 'both') && <Image className="w-6 h-6" />}
              {(type === 'video' || type === 'both') && <Video className="w-6 h-6" />}
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm">
              {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs mt-1">
              {type === 'image' && 'JPG, PNG, WebP, GIF (max 50MB)'}
              {type === 'video' && 'MP4, WebM, MOV (max 50MB)'}
              {type === 'both' && 'Images or videos (max 50MB)'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
