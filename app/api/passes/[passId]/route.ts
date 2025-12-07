import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Pass } from '@/lib/models/pass';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ passId: string }> }
) {
  try {
    const { passId } = await params;
    
    if (!passId) {
      return NextResponse.json(
        { error: 'Pass ID is required' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    const pass = await db.collection<Pass>('passes').findOne({ passId });
    
    if (!pass) {
      return NextResponse.json(
        { error: 'Pass not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      pass: {
        passId: pass.passId,
        eventId: pass.eventId,
        status: pass.status,
        name: pass.name,
        mobile: pass.mobile,
        city: pass.city,
        age: pass.age,
        createdAt: pass.createdAt,
        updatedAt: pass.updatedAt,
        usedAt: pass.usedAt
      }
    });
    
  } catch (error) {
    console.error('Error fetching pass:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
