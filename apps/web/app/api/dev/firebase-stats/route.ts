import { NextResponse } from 'next/server';

// Development only API to get server-side Firebase stats
export async function GET() {
  // Only available in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    // In the future, we could get actual server-side stats
    // For now, return mock data or empty stats
    const serverStats = {
      totalReads: 0,
      totalWrites: 0,
      totalDeletes: 0,
      totalCalls: 0,
      errors: 0,
      averageDuration: 0,
      callsPerMinute: 0,
      source: 'server'
    };

    return NextResponse.json(serverStats);
  } catch (error) {
    console.error('Error fetching server Firebase stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

// Optional: Accept client stats for aggregation
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const clientStats = await request.json();
    
    // Log client stats for debugging
    console.log('Received client Firebase stats:', clientStats);
    
    // In the future, we could store or aggregate these stats
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing client Firebase stats:', error);
    return NextResponse.json({ error: 'Failed to process stats' }, { status: 500 });
  }
}