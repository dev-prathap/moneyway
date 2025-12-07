import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Pass } from '@/lib/models/pass';
import { z } from 'zod';

const UpdatePassSchema = z.object({
  passId: z.string(),
  name: z.string().optional(),
  mobile: z.string().optional(),
  city: z.string().optional(),
  age: z.string().optional()
});

export async function PUT(request: NextRequest) {
  try {
    // Parse request body without validation
    const body = await request.json();
    const { passId, name, mobile, city, age } = body;
    
    // Basic passId check
    if (!passId) {
      return NextResponse.json(
        { error: 'Pass ID is required' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    
    // Check if pass exists
    const existingPass = await db.collection<Pass>('passes').findOne({ passId });
    
    if (!existingPass) {
      return NextResponse.json(
        { error: 'Pass not found' },
        { status: 404 }
      );
    }
    
    // Update pass with visitor information
    const result = await db.collection<Pass>('passes').updateOne(
      { passId },
      {
        $set: {
          name,
          mobile,
          city,
          age,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Pass not found' },
        { status: 404 }
      );
    }
    
    // Fetch updated pass
    const updatedPass = await db.collection<Pass>('passes').findOne({ passId });
    
    return NextResponse.json({
      success: true,
      message: 'Pass updated successfully',
      pass: {
        passId: updatedPass?.passId,
        status: updatedPass?.status,
        name: updatedPass?.name,
        mobile: updatedPass?.mobile,
        city: updatedPass?.city,
        age: updatedPass?.age,
        updatedAt: updatedPass?.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error updating pass:', error);
    
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
