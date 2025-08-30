import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { contextosRepository, usersRepository } from '@kontexto/db';

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
    
    // If no userId in session, get it from database using githubId
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

    const contextId = params.id;

    // Get the context
    const context = await contextosRepository.findById(contextId);
    
    if (!context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 });
    }

    // Check if user owns this context
    if (context.responsableId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      context: {
        id: context.id,
        nombre: context.nombre,
        descripcion: context.descripcion,
        repoUrl: context.repoUrl,
        branch: context.branch || 'main',
        tags: context.tags || [],
        isActive: context.isActive,
        createdAt: context.createdAt,
        updatedAt: context.updatedAt,
        aiDescription: context.aiDescription || null,
        projectStructure: context.projectStructure || null,
        lastAnalysisAt: context.lastAnalysisAt || null
      }
    });

  } catch (error: any) {
    console.error('Error fetching context:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(
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

    const contextId = params.id;
    const body = await req.json();

    // Get the context to check ownership
    const context = await contextosRepository.findById(contextId);
    
    if (!context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 });
    }

    if (context.responsableId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update the context
    const updatedContext = await contextosRepository.update(contextId, {
      ...body,
      updatedAt: new Date()
    });

    return NextResponse.json({
      context: updatedContext,
      message: 'Context updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating context:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(
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

    const contextId = params.id;

    // Get the context to check ownership
    const context = await contextosRepository.findById(contextId);
    
    if (!context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 });
    }

    if (context.responsableId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the context
    await contextosRepository.delete(contextId);

    return NextResponse.json({
      message: 'Context deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting context:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}