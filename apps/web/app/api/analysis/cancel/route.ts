import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { jobsRepository, usersRepository } from '@kontexto/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (!session.user?.id && !session.user?.githubId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = session.user.id;
    
    // If no userId in session, get it from database using githubId
    if (!userId && session.user.githubId) {
      const user = await usersRepository.findByGithubId(session.user.githubId);
      if (!user) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
      }
      userId = user.id;
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unable to identify user' }, { status: 401 });
    }

    const body = await req.json();
    const { contextId, jobId } = body;

    // Validate required parameters
    if (!contextId && !jobId) {
      return NextResponse.json({ 
        error: 'contextId o jobId es requerido' 
      }, { status: 400 });
    }

    let cancelledCount = 0;

    if (contextId) {
      // Cancel all pending/processing jobs for this context
      cancelledCount = await jobsRepository.cancelJobsByContextId(
        contextId, 
        'Cancelado por el usuario'
      );
    } else if (jobId) {
      // Cancel specific job
      const job = await jobsRepository.findById(jobId);
      if (!job) {
        return NextResponse.json({ 
          error: 'Trabajo no encontrado' 
        }, { status: 404 });
      }

      // Verify user owns this job
      if (job.payload?.userId !== userId) {
        return NextResponse.json({ 
          error: 'No tienes permisos para cancelar este trabajo' 
        }, { status: 403 });
      }

      const cancelled = await jobsRepository.cancelJob(jobId, 'Cancelado por el usuario');
      cancelledCount = cancelled ? 1 : 0;
    }

    return NextResponse.json({
      message: `${cancelledCount} trabajo(s) cancelado(s) exitosamente`,
      cancelledCount,
    });

  } catch (error: any) {
    console.error('Error cancelling jobs:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

// GET endpoint to find stuck jobs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (!session.user?.id && !session.user?.githubId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = session.user.id;
    
    if (!userId && session.user.githubId) {
      const user = await usersRepository.findByGithubId(session.user.githubId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      userId = user.id;
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unable to identify user' }, { status: 401 });
    }

    // Get timeout from query params (default 30 minutes)
    const url = new URL(req.url);
    const timeoutMinutes = parseInt(url.searchParams.get('timeout') || '30');

    // Find stuck jobs
    const stuckJobs = await jobsRepository.findStuckJobs(timeoutMinutes);
    
    // Filter by user
    const userStuckJobs = stuckJobs.filter(job => job.payload?.userId === userId);

    return NextResponse.json({
      stuckJobs: userStuckJobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        contextId: job.payload?.contextId,
        contextName: job.payload?.contextName,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        attempts: job.attempts,
        error: job.error,
      })),
      total: userStuckJobs.length,
      timeoutMinutes,
    });

  } catch (error: any) {
    console.error('Error fetching stuck jobs:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}