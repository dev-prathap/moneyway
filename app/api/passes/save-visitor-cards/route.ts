import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Pass } from '@/lib/models/pass';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passes } = body;

    if (!passes || !Array.isArray(passes)) {
      return NextResponse.json(
        { error: 'Invalid passes data' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const passesCollection = db.collection<Pass>('passes');

    // Check for existing passes to avoid duplicates
    const passIds = passes.map((p: any) => p.passId);
    const existingPasses = await passesCollection
      .find({ passId: { $in: passIds } })
      .toArray();

    if (existingPasses.length > 0) {
      console.log(`Found ${existingPasses.length} existing passes, skipping duplicates`);
      
      // Filter out existing passes
      const existingPassIds = new Set(existingPasses.map(p => p.passId));
      const newPasses = passes.filter((p: any) => !existingPassIds.has(p.passId));
      
      if (newPasses.length === 0) {
        return NextResponse.json({
          success: true,
          count: 0,
          message: 'All passes already exist',
          skipped: existingPasses.length
        });
      }
      
      // Insert only new passes
      const result = await passesCollection.insertMany(newPasses);
      
      return NextResponse.json({
        success: true,
        count: result.insertedCount,
        skipped: existingPasses.length,
        message: `Created ${result.insertedCount} new passes, skipped ${existingPasses.length} duplicates`
      });
    }

    // Insert all passes if no duplicates
    const result = await passesCollection.insertMany(passes);

    return NextResponse.json({
      success: true,
      count: result.insertedCount,
      message: `Successfully created ${result.insertedCount} visitor passes`
    });

  } catch (error) {
    console.error('Error saving visitor cards:', error);
    return NextResponse.json(
      { error: 'Failed to save visitor cards' },
      { status: 500 }
    );
  }
}
