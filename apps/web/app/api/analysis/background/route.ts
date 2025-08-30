import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { contextosRepository, usersRepository, jobsRepository } from '@kontexto/db';
import { JOB_TYPES, JOB_STATUS } from '@kontexto/core';

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
    const { contextId } = body;

    // Basic validation
    if (!contextId) {
      return NextResponse.json({ 
        error: 'contextId es requerido' 
      }, { status: 400 });
    }

    // Verify that the context exists and belongs to the user
    const context = await contextosRepository.findById(contextId);
    if (!context) {
      return NextResponse.json({ 
        error: 'Contexto no encontrado' 
      }, { status: 404 });
    }

    if (context.responsableId !== userId) {
      return NextResponse.json({ 
        error: 'No tienes permisos para analizar este contexto' 
      }, { status: 403 });
    }

    // Check if there's already a pending or processing job for this context
    const existingJobs = await jobsRepository.findByType(JOB_TYPES.ANALYZE_REPO);
    const activeJob = existingJobs.find(job => 
      job.payload.contextId === contextId && 
      (job.status === JOB_STATUS.PENDING || job.status === JOB_STATUS.PROCESSING)
    );

    if (activeJob) {
      return NextResponse.json({
        message: 'Ya hay un análisis en progreso para este contexto',
        jobId: activeJob.id,
        status: activeJob.status,
        contextId: contextId,
        contextName: context.nombre,
        repoUrl: context.repoUrl,
      });
    }

    // Create a background job for the analysis
    const analysisJob = await jobsRepository.create({
      type: JOB_TYPES.ANALYZE_REPO,
      status: JOB_STATUS.PENDING,
      payload: {
        contextId: contextId,
        userId: userId,
        repoUrl: context.repoUrl,
        branch: context.branch || 'main',
        contextName: context.nombre,
        accessToken: session.accessToken,
      },
      result: null,
      attempts: 0,
      maxAttempts: 3,
    } as any);

    console.log(`🚀 Background analysis job created: ${analysisJob.id} for context: ${context.nombre}`);

    return NextResponse.json({
      message: 'Análisis iniciado en segundo plano. Puedes salir de la página sin interrumpir el proceso.',
      jobId: analysisJob.id,
      status: JOB_STATUS.PENDING,
      contextId: contextId,
      contextName: context.nombre,
      repoUrl: context.repoUrl,
      estimatedTime: '2-5 minutos',
      canNavigateAway: true,
    });

  } catch (error: any) {
    console.error('Error starting background analysis:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

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

    // Get all analysis jobs for this user
    const analysisJobs = await jobsRepository.findByType(JOB_TYPES.ANALYZE_REPO);
    const userJobs = analysisJobs.filter(job => job.payload.userId === userId);

    // Sort by creation date (newest first)
    userJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({
      jobs: userJobs.map(job => ({
        id: job.id,
        status: job.status,
        contextId: job.payload.contextId,
        contextName: job.payload.contextName,
        repoUrl: job.payload.repoUrl,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
        attempts: job.attempts,
        error: job.error,
        result: job.result,
      })),
      total: userJobs.length
    });

  } catch (error: any) {
    console.error('Error fetching background jobs:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}