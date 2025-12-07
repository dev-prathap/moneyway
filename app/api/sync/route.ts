import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Pass } from '@/lib/models/pass';
import { z } from 'zod';

const SyncOperationSchema = z.object({
  id: z.number(),
  type: z.enum(['create-pass', 'update-pass', 'create-event', 'update-status']),
  passId: z.string().optional(),
  eventId: z.string().optional(),
  payload: z.any(),
  createdAt: z.string().or(z.date()),
  retryCount: z.number()
});

const SyncRequestSchema = z.object({
  operations: z.array(SyncOperationSchema)
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = SyncRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { operations } = validation.data;
    const db = await getDb();
    
    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [] as Array<{ operationId: number; error: string }>
    };
    
    // Process each operation
    for (const op of operations) {
      try {
        switch (op.type) {
          case 'update-pass':
            await processUpdatePass(db, op);
            break;
          case 'create-pass':
            await processCreatePass(db, op);
            break;
          case 'update-status':
            await processUpdateStatus(db, op);
            break;
          case 'create-event':
            await processCreateEvent(db, op);
            break;
          default:
            throw new Error(`Unknown operation type: ${op.type}`);
        }
        
        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          operationId: op.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    results.success = results.failed === 0;
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Sync API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processUpdatePass(db: any, op: any): Promise<void> {
  // Fetch current pass to check for conflicts
  const currentPass = await db.collection('passes').findOne({ passId: op.passId });
  
  if (!currentPass) {
    throw new Error(`Pass ${op.passId} not found`);
  }
  
  // Parse operation timestamp
  const opTimestamp = new Date(op.createdAt);
  const currentTimestamp = new Date(currentPass.updatedAt);
  
  // Conflict resolution: prioritize most recent timestamp
  if (currentTimestamp > opTimestamp) {
    // Server version is newer, skip this operation
    console.log(`Skipping update for ${op.passId}: server version is newer`);
    return;
  }
  
  const { passId, ...updateData } = op.payload;
  
  const result = await db.collection('passes').updateOne(
    { passId: op.passId },
    {
      $set: {
        ...updateData,
        updatedAt: opTimestamp
      }
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error(`Pass ${op.passId} not found`);
  }
}

async function processCreatePass(db: any, op: any): Promise<void> {
  // This would typically be handled by the create-batch endpoint
  // but we include it here for completeness
  throw new Error('Create pass operations should use /api/passes/create-batch');
}

async function processUpdateStatus(db: any, op: any): Promise<void> {
  // Fetch current pass to check for conflicts (Requirement 11.5)
  const currentPass = await db.collection('passes').findOne({ passId: op.passId });
  
  if (!currentPass) {
    throw new Error(`Pass ${op.passId} not found`);
  }
  
  // Parse operation timestamp
  const opTimestamp = new Date(op.createdAt);
  const currentTimestamp = new Date(currentPass.updatedAt);
  
  // Conflict resolution: prioritize most recent timestamp (Requirement 11.5)
  if (currentTimestamp > opTimestamp) {
    // Server version is newer, skip this operation
    console.log(`Skipping status update for ${op.passId}: server version is newer`);
    return;
  }
  
  // Apply the update
  const updateData: any = {
    status: op.payload.status,
    updatedAt: opTimestamp
  };
  
  if (op.payload.status === 'used') {
    updateData.usedAt = opTimestamp;
  } else {
    updateData.usedAt = null;
  }
  
  const result = await db.collection('passes').updateOne(
    { passId: op.passId },
    { $set: updateData }
  );
  
  if (result.matchedCount === 0) {
    throw new Error(`Pass ${op.passId} not found`);
  }
}

async function processCreateEvent(db: any, op: any): Promise<void> {
  // This would typically be handled by the create event endpoint
  // but we include it here for completeness
  throw new Error('Create event operations should use /api/events/create');
}
