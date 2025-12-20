/**
 * Image optimization utilities for Supabase storage
 */

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Get an optimized image URL using Supabase's built-in image transformations
 * Only works for images stored in Supabase storage buckets
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return '';
  
  const { width, height, quality = 80 } = options;
  
  // Only apply transformations to Supabase storage URLs
  if (url.includes('supabase.co/storage') || url.includes('supabase.in/storage')) {
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    params.set('quality', quality.toString());
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }
  
  return url;
}

/**
 * Get srcset for responsive images
 */
export function getImageSrcSet(url: string | null | undefined): string {
  if (!url) return '';
  
  // Only generate srcset for Supabase storage URLs
  if (url.includes('supabase.co/storage') || url.includes('supabase.in/storage')) {
    const widths = [400, 800, 1200];
    return widths
      .map(w => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
      .join(', ');
  }
  
  return '';
}

/**
 * Preload critical images
 */
export function preloadImage(url: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  document.head.appendChild(link);
}
