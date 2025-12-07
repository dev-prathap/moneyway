import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { passId, status } = body;

    // Validate input
    if (!passId) {
      return NextResponse.json(
        { error: 'Pass ID is required' },
        { status: 400 }
      );
    }

    if (status !== 'used' && status !== 'unused') {
      return NextResponse.json(
        { error: 'Status must be either "used" or "unused"' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const passesCollection = db.collection('passes');

    // Find the pass
    const existingPass = await passesCollection.findOne({ passId });

    if (!existingPass) {
      return NextResponse.json(
        { error: 'Pass not found' },
        { status: 404 }
      );
    }

    // Prevent duplicate check-ins (Requirement 11.4)
    if (existingPass.status === 'used' && status === 'used') {
      return NextResponse.json(
        { 
          error: 'Pass is already marked as used',
          pass: {
            ...existingPass,
            _id: existingPass._id.toString(),
            createdAt: existingPass.createdAt instanceof Date ? existingPass.createdAt.toISOString() : existingPass.createdAt,
            updatedAt: existingPass.updatedAt instanceof Date ? existingPass.updatedAt.toISOString() : existingPass.updatedAt,
            usedAt: existingPass.usedAt ? (existingPass.usedAt instanceof Date ? existingPass.usedAt.toISOString() : existingPass.usedAt) : undefined,
          }
        },
        { status: 409 }
      );
    }

    // Update the pass status
    const now = new Date();
    const updateData: any = {
      status,
      updatedAt: now,
    };

    // Record timestamp when marking as used (Requirement 11.1)
    if (status === 'used') {
      updateData.usedAt = now;
    } else {
      // Clear usedAt when marking as unused
      updateData.usedAt = null;
    }

    const result = await passesCollection.updateOne(
      { passId },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update pass status' },
        { status: 500 }
      );
    }

    // Fetch the updated pass
    const updatedPass = await passesCollection.findOne({ passId });

    return NextResponse.json({
      success: true,
      message: `Pass marked as ${status}`,
      pass: {
        ...updatedPass,
        _id: updatedPass!._id.toString(),
        createdAt: updatedPass!.createdAt instanceof Date ? updatedPass!.createdAt.toISOString() : updatedPass!.createdAt,
        updatedAt: updatedPass!.updatedAt instanceof Date ? updatedPass!.updatedAt.toISOString() : updatedPass!.updatedAt,
        usedAt: updatedPass!.usedAt ? (updatedPass!.usedAt instanceof Date ? updatedPass!.usedAt.toISOString() : updatedPass!.usedAt) : undefined,
      },
    });
  } catch (error) {
    console.error('Error updating pass status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
