import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDb();
    const passesCollection = db.collection('passes');

    // Get total passes count
    const totalPasses = await passesCollection.countDocuments();

    // Get used passes count
    const usedPasses = await passesCollection.countDocuments({ status: 'used' });

    // Calculate unused passes
    const unusedPasses = totalPasses - usedPasses;

    return NextResponse.json({
      totalPasses,
      usedPasses,
      unusedPasses,
    });
  } catch (error) {
    console.error('Error fetching pass statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
