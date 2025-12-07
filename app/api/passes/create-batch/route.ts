import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { generatePassBatch, ensurePassIndexes } from '@/lib/pass-generator';
import { z } from 'zod';

const CreateBatchSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  prefix: z.string().min(1, 'Prefix is required').max(10, 'Prefix too long'),
  count: z.number().int().min(1, 'Count must be at least 1').max(1000, 'Count cannot exceed 1000')
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('maniway_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = CreateBatchSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { eventId, prefix, count } = validation.data;
    
    // Ensure indexes exist
    await ensurePassIndexes();
    
    // Get base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    
    // Generate passes
    const passes = await generatePassBatch({
      eventId,
      prefix,
      count,
      baseUrl
    });
    
    return NextResponse.json({
      success: true,
      count: passes.length,
      passes: passes.map(p => ({
        passId: p.passId,
        qrUrl: p.qrUrl,
        qrDataUrl: p.qrDataUrl,
        status: p.status
      }))
    });
    
  } catch (error) {
    console.error('Error creating pass batch:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
