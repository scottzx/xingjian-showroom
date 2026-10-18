/**
 * Persistence Queue Utility
 *
 * Implements a queue-based system for localStorage write operations
 * to batch rapid successive writes and use requestIdleCallback for
 * non-blocking writes that don't impact UI performance.
 */

type QueueItem = {
  fn: () => void;
  priority: 'high' | 'low';
  timestamp: number;
};

class PersistenceQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private maxQueueSize = 50;
  private processingBatchSize = 5; // Process up to 5 items per idle callback

  /**
   * Add a function to the queue
   * @param fn Function to execute
   * @param priority 'high' for user-initiated saves, 'low' for auto-saves
   */
  enqueue(fn: () => void, priority: 'high' | 'low' = 'low'): void {
    // If queue is full, remove oldest low-priority items
    if (this.queue.length >= this.maxQueueSize) {
      const lowPriorityIndex = this.queue.findIndex(item => item.priority === 'low');
      if (lowPriorityIndex !== -1) {
        this.queue.splice(lowPriorityIndex, 1);
      } else {
        // All items are high priority, remove oldest
        this.queue.shift();
      }
    }

    this.queue.push({
      fn,
      priority,
      timestamp: Date.now(),
    });

    // Sort by priority (high first) then timestamp
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return a.timestamp - b.timestamp;
    });

    if (!this.isProcessing) {
      this.process();
    }
  }

  /**
   * Process the queue using requestIdleCallback or setTimeout
   */
  private async process(): Promise<void> {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      // Process a batch of items
      const batch = this.queue.splice(0, this.processingBatchSize);

      await this.processBatch(batch);

      // If there are more items, yield to the browser
      if (this.queue.length > 0) {
        await this.yieldToBrowser();
      }
    }

    this.isProcessing = false;
  }

  /**
   * Process a batch of queue items
   */
  private async processBatch(batch: QueueItem[]): Promise<void> {
    return new Promise((resolve) => {
      const processBatchItems = () => {
        batch.forEach(item => {
          try {
            item.fn();
          } catch (error) {
            console.error('[PersistenceQueue] Error processing item:', error);
          }
        });
        resolve();
      };

      // Use requestIdleCallback if available, otherwise setTimeout
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(
          () => processBatchItems(),
          { timeout: 1000 } // Maximum wait time
        );
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(processBatchItems, 0);
      }
    });
  }

  /**
   * Yield to the browser using setTimeout
   */
  private yieldToBrowser(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Clear all pending items from the queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueLength: number;
    isProcessing: boolean;
    highPriorityCount: number;
    lowPriorityCount: number;
  } {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      highPriorityCount: this.queue.filter(i => i.priority === 'high').length,
      lowPriorityCount: this.queue.filter(i => i.priority === 'low').length,
    };
  }

  /**
   * Wait for all pending items to be processed
   */
  async flush(): Promise<void> {
    while (this.isProcessing || this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

// Export singleton instance
export const persistenceQueue = new PersistenceQueue();

// Export class for testing
export { PersistenceQueue };
