import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Pass } from '@/lib/models/pass';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const db = await getDb();
    const passesCollection = db.collection<Pass>('passes');

    // Get recent visitor passes (VIS prefix)
    const visitorPasses = await passesCollection
      .find({ passId: { $regex: '^VIS-' } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const totalVisitorPasses = await passesCollection.countDocuments({ 
      passId: { $regex: '^VIS-' } 
    });

    const duplicates = await passesCollection.countDocuments({ 
      passId: { $regex: '^VIS-.*-DUP$' } 
    });

    return NextResponse.json({
      success: true,
      totalVisitorPasses,
      duplicates,
      recentPasses: visitorPasses.map(pass => ({
        passId: pass.passId,
        status: pass.status,
        createdAt: pass.createdAt,
        isDuplicate: pass.passId.includes('-DUP'),
        hasQrImage: !!pass.qrDataUrl,
        qrUrl: pass.qrUrl
      }))
    });

  } catch (error) {
    console.error('Error checking visitor cards:', error);
    return NextResponse.json(
      { error: 'Failed to check visitor cards' },
      { status: 500 }
    );
  }
}
