/**
 * Image loading utilities for cross-origin isolated environments (COEP/COOP)
 *
 * When Cross-Origin-Embedder-Policy: require-corp is set (in older cross-origin isolated deployments),
 * direct loading of cross-origin images fails with ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep.
 *
 * Solution: Fetch via request with credentials, convert to blob, create object URL.
 */

import { useState, useEffect } from 'react';

const blobCache = new Map<string, string>();

/**
 * Load an image from URL and return a blob URL that bypasses COEP restrictions
 * Uses fetch to get the image as a blob, then creates an object URL
 */
export async function loadAsBlobUrl(url: string): Promise<string> {
  // Check cache first
  if (blobCache.has(url)) {
    return blobCache.get(url)!;
  }

  try {
    const response = await fetch(url, {
      credentials: 'omit',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Cache the result
    blobCache.set(url, blobUrl);

    return blobUrl;
  } catch (error) {
    console.error('Error loading image as blob:', error);
    throw error;
  }
}

/**
 * Preload an image and return an HTMLImageElement
 * Useful for preloading images before displaying them
 */
export async function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // If it's a Supabase URL, use the blob URL method
    if (url.includes('supabase.co')) {
      loadAsBlobUrl(url)
        .then((blobUrl) => {
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = blobUrl;
        })
        .catch(reject);
    } else {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    }
  });
}

/**
 * Check if a URL is likely to have COEP issues
 */
export function needsCoepWorkaround(url: string): boolean {
  return url.includes('supabase.co') ||
         url.includes('amazonaws.com') ||
         (!url.startsWith(window.location.origin) && !url.startsWith('blob:'));
}

/**
 * Revoke a blob URL to free memory
 * Call this when the image is no longer needed
 */
export function revokeBlobUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
    // Remove from cache
    for (const [originalUrl, blobUrl] of blobCache.entries()) {
      if (blobUrl === url) {
        blobCache.delete(originalUrl);
        break;
      }
    }
  }
}

/**
 * Clear all cached blob URLs
 * Call this to free all memory used by cached images
 */
export function clearBlobCache(): void {
  for (const blobUrl of blobCache.values()) {
    URL.revokeObjectURL(blobUrl);
  }
  blobCache.clear();
}

/**
 * React hook for loading images with COEP workaround
 * Returns the blob URL and loading state
 */
export function useBlobUrl(url: string | null, enabled: boolean = true) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url || !enabled) {
      setBlobUrl(null);
      return;
    }

    // Check if workaround is needed
    if (!needsCoepWorkaround(url)) {
      setBlobUrl(url);
      return;
    }

    setIsLoading(true);
    setError(null);

    loadAsBlobUrl(url)
      .then((url) => {
        setBlobUrl(url);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err as Error);
        setIsLoading(false);
      });

    // Cleanup on unmount
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        // Don't revoke immediately as cache is shared
        // Only revoke if not in cache
        let isInCache = false;
        for (const cachedUrl of blobCache.values()) {
          if (cachedUrl === blobUrl) {
            isInCache = true;
            break;
          }
        }
        if (!isInCache) {
          URL.revokeObjectURL(blobUrl);
        }
      }
    };
  }, [url, enabled]);

  return { blobUrl, isLoading, error };
}
