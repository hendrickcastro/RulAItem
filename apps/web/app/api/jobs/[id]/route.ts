import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { jobsRepository, usersRepository } from '@kontexto/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const jobId = params.id;
    const job = await jobsRepository.findById(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify that the job belongs to the user
    if (job.payload.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      payload: {
        contextId: job.payload.contextId,
        contextName: job.payload.contextName,
        repoUrl: job.payload.repoUrl,
        branch: job.payload.branch,
      },
      result: job.result,
      error: job.error,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt,
    });

  } catch (error: any) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}