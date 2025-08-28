import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      hasSession: !!session,
      userId: session?.user?.id,
      userName: session?.user?.name,
      userEmail: session?.user?.email,
      fullSession: session
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Error getting session',
      details: error.message 
    }, { status: 500 });
  }
}