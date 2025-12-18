import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

export async function GET() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('default');
    const collection = db.collection('passes');
    
    // Fetch passes that have name and mobile (visitor data)
    const visitors = await collection.find({
      passId: { $regex: /^VIS-/ }, // Only VIS numbers
      $or: [
        { 
          name: { $exists: true, $ne: '' },
          mobile: { $exists: true, $ne: '' }
        },
        { 
          visitorName: { $exists: true, $ne: '' },
          visitorMobile: { $exists: true, $ne: '' }
        }
      ]
    }).sort({ createdAt: -1 }).toArray();
    
    await client.close();
    
    // Format the data
    const formattedVisitors = visitors.map(visitor => ({
      visNumber: visitor.passId,
      name: visitor.name || visitor.visitorName || '',
      phoneNumber: visitor.mobile || visitor.visitorMobile || '',
      createdAt: visitor.createdAt,
      status: visitor.status || 'unused'
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedVisitors,
      count: formattedVisitors.length
    });
    
  } catch (error) {
    console.error('Error fetching visitors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visitors' },
      { status: 500 }
    );
  }
}
