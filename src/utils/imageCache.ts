/**
 * Image Cache Utility
 *
 * Implements an LRU (Least Recently Used) cache for HTMLImageElements
 * to avoid repeated loading of the same images from data URLs and external URLs.
 * This significantly improves performance when working with multiple layers
 * that reference the same image sources.
 *
 * Also handles COEP (Cross-Origin-Embedder-Policy) issues for external images
 * from Supabase and other cross-origin sources.
 */

import { loadAsBlobUrl, needsCoepWorkaround } from './imageLoader';

interface CacheEntry {
  image: HTMLImageElement;
  lastAccess: number;
  sourceUrl?: string; // Original URL for blob URLs
}

class ImageCache {
  private cache = new Map<string, CacheEntry>();
  private maxEntries: number;
  private maxAge: number; // Maximum age in milliseconds

  constructor(maxEntries: number = 20, maxAgeMinutes: number = 30) {
    this.maxEntries = maxEntries;
    this.maxAge = maxAgeMinutes * 60 * 1000;
  }

  /**
   * Get an image from cache or load it if not cached
   * Handles COEP issues for cross-origin images automatically
   */
  async get(src: string): Promise<HTMLImageElement> {
    const now = Date.now();
    const entry = this.cache.get(src);

    // Check if image is in cache and not expired
    if (entry) {
      if (now - entry.lastAccess < this.maxAge) {
        // Update last access time (LRU)
        entry.lastAccess = now;
        return entry.image;
      } else {
        // Remove expired entry and revoke blob URL if needed
        this.removeEntry(src, entry);
      }
    }

    // Load the image with COEP workaround if needed
    const img = await this.loadImage(src);

    // Add to cache
    this.cache.set(src, {
      image: img,
      lastAccess: now,
      sourceUrl: src,
    });

    // Enforce max entries limit (LRU eviction)
    this.evictIfNeeded();

    return img;
  }

  /**
   * Check if an image is in the cache
   */
  has(src: string): boolean {
    const entry = this.cache.get(src);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.lastAccess >= this.maxAge) {
      this.cache.delete(src);
      return false;
    }

    return true;
  }

  /**
   * Preload an image into the cache
   */
  async preload(src: string): Promise<void> {
    if (!this.has(src)) {
      await this.get(src);
    }
  }

  /**
   * Remove a specific entry from the cache
   */
  remove(src: string): boolean {
    const entry = this.cache.get(src);
    if (entry) {
      this.removeEntry(src, entry);
    }
    return this.cache.delete(src);
  }

  /**
   * Clear all cached images
   */
  clear(): void {
    // Revoke all blob URLs before clearing
    for (const [src, entry] of this.cache.entries()) {
      this.removeEntry(src, entry);
    }
    this.cache.clear();
  }

  /**
   * Remove a cache entry and clean up blob URLs
   */
  private removeEntry(_src: string, entry: CacheEntry): void {
    // If the cached image src is a blob URL, revoke it to free memory
    if (entry.image.src && entry.image.src.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(entry.image.src);
      } catch (e) {
        // Ignore errors during revocation
        console.warn('[ImageCache] Failed to revoke blob URL:', e);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; entries: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxEntries,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Load an image from a URL or data URL
   * Handles COEP issues for cross-origin images
   */
  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise(async (resolve, reject) => {
      const img = new Image();

      // Check if this URL needs COEP workaround
      if (needsCoepWorkaround(src)) {
        try {
          // Convert to blob URL to bypass COEP restrictions
          const blobUrl = await loadAsBlobUrl(src);

          img.onload = () => resolve(img);
          img.onerror = () => {
            // Try to revoke the blob URL on error
            try {
              URL.revokeObjectURL(blobUrl);
            } catch (e) {
              // Ignore revocation errors
            }
            reject(new Error(`Failed to load image from ${src}`));
          };

          // Set the blob URL as the source
          img.src = blobUrl;
        } catch (error) {
          reject(new Error(`Failed to load image with COEP workaround: ${error}`));
        }
      } else {
        // Normal loading for data URLs and same-origin images
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      }
    });
  }

  /**
   * Evict oldest entries if cache is full
   */
  private evictIfNeeded(): void {
    if (this.cache.size <= this.maxEntries) return;

    // Sort entries by last access time (oldest first)
    const sortedEntries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].lastAccess - b[1].lastAccess
    );

    // Remove oldest entries and clean up blob URLs
    const entriesToRemove = sortedEntries.slice(0, this.cache.size - this.maxEntries);
    entriesToRemove.forEach(([src, entry]) => {
      this.removeEntry(src, entry);
      this.cache.delete(src);
    });
  }
}

// Export singleton instance
export const imageCache = new ImageCache();

// Export class for testing
export { ImageCache };
