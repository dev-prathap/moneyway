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

export async function PUT(
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
    
    const body = await request.json();
    const { name, mobile, status } = body;
    
    if (!name || !mobile) {
      return NextResponse.json(
        { error: 'Name and mobile are required' },
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
    
    // Update the pass
    const updateData: Partial<Pass> = {
      name,
      mobile,
      status: status || 'used',
      updatedAt: new Date(),
    };
    
    if (status === 'used') {
      updateData.usedAt = new Date();
    }
    
    const result = await db.collection<Pass>('passes').updateOne(
      { passId },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update pass' },
        { status: 500 }
      );
    }
    
    // Get updated pass
    const updatedPass = await db.collection<Pass>('passes').findOne({ passId });
    
    return NextResponse.json({
      success: true,
      message: 'Pass updated successfully',
      pass: {
        passId: updatedPass!.passId,
        eventId: updatedPass!.eventId,
        status: updatedPass!.status,
        name: updatedPass!.name,
        mobile: updatedPass!.mobile,
        city: updatedPass!.city,
        age: updatedPass!.age,
        createdAt: updatedPass!.createdAt,
        updatedAt: updatedPass!.updatedAt,
        usedAt: updatedPass!.usedAt
      }
    });
    
  } catch (error) {
    console.error('Error updating pass:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
