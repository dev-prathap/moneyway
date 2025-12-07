import { 
  getPendingOperations, 
  removePendingOperation, 
  updatePendingOperationRetryCount,
  PendingOperation 
} from './dexie';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: SyncError[];
}

export interface SyncError {
  operationId: number;
  error: string;
  retryable: boolean;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Base delay for exponential backoff

/**
 * Sync all pending operations to the server
 */
export async function syncPendingOperations(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    errors: []
  };

  try {
    const pendingOps = await getPendingOperations();
    
    if (pendingOps.length === 0) {
      return result;
    }

    console.log(`Starting sync of ${pendingOps.length} pending operations...`);

    // Process operations in order
    for (const op of pendingOps) {
      try {
        await processSingleOperation(op);
        
        // Remove from queue on success
        await removePendingOperation(op.id!);
        result.synced++;
        
        console.log(`Successfully synced operation ${op.id} (${op.type})`);
      } catch (error) {
        console.error(`Failed to sync operation ${op.id}:`, error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const retryable = op.retryCount < MAX_RETRIES;
        
        result.failed++;
        result.errors.push({
          operationId: op.id!,
          error: errorMessage,
          retryable
        });

        if (retryable) {
          // Increment retry count
          await updatePendingOperationRetryCount(op.id!, op.retryCount + 1);
          
          // Wait before next retry (exponential backoff)
          const delay = RETRY_DELAY_MS * Math.pow(2, op.retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Max retries reached, remove from queue
          console.error(`Max retries reached for operation ${op.id}, removing from queue`);
          await removePendingOperation(op.id!);
        }
      }
    }

    result.success = result.failed === 0;
    
    console.log(`Sync complete: ${result.synced} synced, ${result.failed} failed`);
    
    return result;
  } catch (error) {
    console.error('Sync engine error:', error);
    result.success = false;
    return result;
  }
}

/**
 * Process a single pending operation
 */
async function processSingleOperation(op: PendingOperation): Promise<void> {
  switch (op.type) {
    case 'update-pass':
      await syncUpdatePass(op);
      break;
    case 'create-pass':
      await syncCreatePass(op);
      break;
    case 'update-status':
      await syncUpdateStatus(op);
      break;
    case 'create-event':
      await syncCreateEvent(op);
      break;
    default:
      throw new Error(`Unknown operation type: ${op.type}`);
  }
}

/**
 * Sync pass update to server
 */
async function syncUpdatePass(op: PendingOperation): Promise<void> {
  const response = await fetch('/api/passes/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      passId: op.passId,
      ...op.payload
    })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to update pass');
  }
}

/**
 * Sync pass creation to server
 */
async function syncCreatePass(op: PendingOperation): Promise<void> {
  const response = await fetch('/api/passes/create-batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(op.payload)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to create pass');
  }
}

/**
 * Sync pass status update to server
 */
async function syncUpdateStatus(op: PendingOperation): Promise<void> {
  const response = await fetch('/api/passes/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      passId: op.passId,
      ...op.payload
    })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to update pass status');
  }
}

/**
 * Sync event creation to server
 */
async function syncCreateEvent(op: PendingOperation): Promise<void> {
  const response = await fetch('/api/events/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(op.payload)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to create event');
  }
}

/**
 * Trigger sync manually
 */
export async function triggerManualSync(): Promise<SyncResult> {
  console.log('Manual sync triggered');
  return await syncPendingOperations();
}

/**
 * Set up automatic sync on reconnection
 */
export function setupAutoSync(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    console.log('Connection restored, starting automatic sync...');
    try {
      const result = await syncPendingOperations();
      
      if (result.synced > 0) {
        console.log(`Auto-sync completed: ${result.synced} operations synced`);
        
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('sync-complete', { 
          detail: result 
        }));
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  });
}
