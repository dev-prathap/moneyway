import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const passId = searchParams.get('passId');
    const mobile = searchParams.get('mobile');

    // Validate that at least one search parameter is provided
    if (!passId && !mobile) {
      return NextResponse.json(
        { error: 'Please provide either passId or mobile parameter' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const passesCollection = db.collection('passes');

    let passes: any[] = [];

    // Search by passId (exact match)
    if (passId) {
      const pass = await passesCollection.findOne({ passId });
      passes = pass ? [pass] : [];
    }
    // Search by mobile (exact match, returns all passes with that mobile)
    else if (mobile) {
      passes = await passesCollection
        .find({ mobile })
        .sort({ createdAt: -1 })
        .toArray();
    }

    // Convert MongoDB _id to string for JSON serialization
    const serializedPasses = passes.map((pass) => ({
      ...pass,
      _id: pass._id.toString(),
      createdAt: pass.createdAt.toISOString(),
      updatedAt: pass.updatedAt.toISOString(),
      usedAt: pass.usedAt ? pass.usedAt.toISOString() : undefined,
    }));

    return NextResponse.json({
      passes: serializedPasses,
      count: serializedPasses.length,
    });
  } catch (error) {
    console.error('Error searching passes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
