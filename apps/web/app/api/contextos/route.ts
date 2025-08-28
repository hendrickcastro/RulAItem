import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { contextosRepository } from '@kontexto/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (!session.user?.id && !session.user?.githubId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || String(session.user.githubId);
    const body = await req.json();
    
    const { nombre, descripcion, repoUrl, tags } = body;

    // Basic validation
    if (!nombre || !descripcion || !repoUrl) {
      return NextResponse.json({ 
        error: 'Nombre, descripción y URL del repositorio son requeridos' 
      }, { status: 400 });
    }

    if (nombre.length < 5) {
      return NextResponse.json({ 
        error: 'El nombre debe tener al menos 5 caracteres' 
      }, { status: 400 });
    }

    if (descripcion.length < 10) {
      return NextResponse.json({ 
        error: 'La descripción debe tener al menos 10 caracteres' 
      }, { status: 400 });
    }

    // Validate GitHub URL format
    const githubUrlPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
    if (!githubUrlPattern.test(repoUrl)) {
      return NextResponse.json({ 
        error: 'URL debe ser un repositorio válido de GitHub' 
      }, { status: 400 });
    }

    // Check if context with this repo URL already exists
    const existingContext = await contextosRepository.findByRepoUrl(repoUrl);
    if (existingContext) {
      return NextResponse.json({ 
        error: 'Ya existe un contexto con esta URL de repositorio' 
      }, { status: 400 });
    }

    // Create the context
    const newContext = await contextosRepository.createContexto({
      nombre,
      descripcion,
      repoUrl,
      responsableId: userId,
      tags: Array.isArray(tags) ? tags : [],
      isActive: true
    });

    return NextResponse.json({
      message: 'Contexto creado exitosamente',
      context: newContext
    });

  } catch (error: any) {
    console.error('Error creating context:', error);
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

    const userId = session.user.id || String(session.user.githubId);
    
    // Get user's contexts
    const contexts = await contextosRepository.findByResponsable(userId);
    
    return NextResponse.json({
      contexts,
      total: contexts.length
    });

  } catch (error: any) {
    console.error('Error fetching contexts:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}