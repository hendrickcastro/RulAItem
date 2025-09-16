import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { jobsRepository, usersRepository } from '@kontexto/db';

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

    // Get query parameters
    const url = new URL(req.url);
    const timeoutMinutes = parseInt(url.searchParams.get('timeout') || '30');
    const autoCancel = url.searchParams.get('autoCancel') === 'true';

    // Get all stuck jobs
    const stuckJobs = await jobsRepository.findStuckJobs(timeoutMinutes);
    
    // Filter by user
    const userStuckJobs = stuckJobs.filter(job => job.payload?.userId === userId);

    // Auto-cancel stuck jobs if requested
    let autoCancelledCount = 0;
    if (autoCancel && userStuckJobs.length > 0) {
      for (const job of userStuckJobs) {
        try {
          await jobsRepository.cancelJob(
            job.id, 
            `Cancelado automáticamente - trabajo atascado por más de ${timeoutMinutes} minutos`
          );
          autoCancelledCount++;
        } catch (error) {
          console.error(`Failed to auto-cancel job ${job.id}:`, error);
        }
      }
    }

    // Get general stats
    const stats = await jobsRepository.getJobStats();

    return NextResponse.json({
      health: {
        status: userStuckJobs.length === 0 ? 'healthy' : 'warning',
        stuckJobsCount: userStuckJobs.length,
        timeoutMinutes,
        autoCancelledCount,
      },
      stats,
      stuckJobs: userStuckJobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        contextId: job.payload?.contextId,
        contextName: job.payload?.contextName,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        attempts: job.attempts,
        stuckDurationMinutes: Math.floor(
          (new Date().getTime() - job.updatedAt.getTime()) / (1000 * 60)
        ),
      })),
      recommendations: generateRecommendations(userStuckJobs, stats),
    });

  } catch (error: any) {
    console.error('Error checking analysis health:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

function generateRecommendations(stuckJobs: any[], stats: any): string[] {
  const recommendations: string[] = [];

  if (stuckJobs.length > 0) {
    recommendations.push(`Tienes ${stuckJobs.length} trabajo(s) atascado(s). Considera cancelarlos.`);
    
    if (stuckJobs.length > 3) {
      recommendations.push('Alto número de trabajos atascados. Verifica que el worker esté funcionando correctamente.');
    }
  }

  if (stats.failed > stats.completed && stats.failed > 5) {
    recommendations.push('Tasa alta de trabajos fallidos. Revisa los logs para identificar problemas comunes.');
  }

  if (stats.processing > 10) {
    recommendations.push('Muchos trabajos en procesamiento. Podría indicar un cuello de botella en el worker.');
  }

  if (recommendations.length === 0) {
    recommendations.push('El sistema de análisis está funcionando correctamente.');
  }

  return recommendations;
}

// POST endpoint to auto-fix stuck jobs
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { 
      timeoutMinutes = 30, 
      cancelStuckJobs = true,
      retryFailedJobs = false 
    } = body;

    let fixedCount = 0;
    const results = {
      cancelledJobs: 0,
      retriedJobs: 0,
    };

    // Cancel stuck jobs
    if (cancelStuckJobs) {
      const stuckJobs = await jobsRepository.findStuckJobs(timeoutMinutes);
      const userStuckJobs = stuckJobs.filter(job => job.payload?.userId === userId);
      
      for (const job of userStuckJobs) {
        try {
          await jobsRepository.cancelJob(
            job.id, 
            `Auto-fix: Cancelado por estar atascado ${timeoutMinutes}+ minutos`
          );
          results.cancelledJobs++;
          fixedCount++;
        } catch (error) {
          console.error(`Failed to cancel stuck job ${job.id}:`, error);
        }
      }
    }

    // Retry failed jobs (optional)
    if (retryFailedJobs) {
      const failedJobs = await jobsRepository.getFailedJobs(10);
      const userFailedJobs = failedJobs.filter(job => 
        job.payload?.userId === userId && 
        job.attempts < job.maxAttempts
      );
      
      for (const job of userFailedJobs) {
        try {
          await jobsRepository.retryJob(job.id);
          results.retriedJobs++;
          fixedCount++;
        } catch (error) {
          console.error(`Failed to retry job ${job.id}:`, error);
        }
      }
    }

    return NextResponse.json({
      message: `Auto-fix completado. ${fixedCount} problema(s) solucionado(s).`,
      results,
      fixedCount,
    });

  } catch (error: any) {
    console.error('Error during auto-fix:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}