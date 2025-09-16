import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { usersRepository } from '@kontexto/db';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    name?: string;
    email?: string;
    githubId?: string;
  };
}

export interface ApiHandler {
  (req: AuthenticatedRequest): Promise<NextResponse>;
}

export interface RouteHandlers {
  GET?: ApiHandler;
  POST?: ApiHandler;
  PUT?: ApiHandler;
  DELETE?: ApiHandler;
  PATCH?: ApiHandler;
}

// Authentication middleware
export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req: AuthenticatedRequest) => {
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

      // Add user info to request
      req.user = {
        id: userId,
        name: session.user.name,
        email: session.user.email,
        githubId: session.user.githubId,
      };

      return handler(req);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
  };
}

// Error handling wrapper
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: AuthenticatedRequest) => {
    try {
      return await handler(req);
    } catch (error: any) {
      console.error('API Error:', error);
      
      // Handle specific error types
      if (error.code === 'ECONNREFUSED') {
        return NextResponse.json({ 
          error: 'Database connection failed' 
        }, { status: 503 });
      }
      
      if (error.name === 'ValidationError') {
        return NextResponse.json({ 
          error: 'Invalid request data',
          details: error.message 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }
  };
}

// CORS middleware
export function withCors(handler: ApiHandler): ApiHandler {
  return async (req: AuthenticatedRequest) => {
    const response = await handler(req);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  };
}

// Request validation
export function withValidation<T>(
  schema: (data: any) => T,
  handler: (req: AuthenticatedRequest, data: T) => Promise<NextResponse>
): ApiHandler {
  return async (req: AuthenticatedRequest) => {
    try {
      const body = req.method !== 'GET' ? await req.json() : {};
      const validatedData = schema(body);
      return handler(req, validatedData);
    } catch (error: any) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.message 
      }, { status: 400 });
    }
  };
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): (handler: ApiHandler) => ApiHandler {
  return (handler: ApiHandler): ApiHandler => {
    return async (req: AuthenticatedRequest) => {
      const identifier = req.user?.id || req.ip || 'anonymous';
      const now = Date.now();
      
      const current = rateLimitMap.get(identifier);
      
      if (!current || now > current.resetTime) {
        rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
        return handler(req);
      }
      
      if (current.count >= maxRequests) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        }, { status: 429 });
      }
      
      current.count++;
      return handler(req);
    };
  };
}

// Method routing helper
export function createRouteHandler(handlers: RouteHandlers) {
  return async (req: NextRequest) => {
    const method = req.method as keyof RouteHandlers;
    const handler = handlers[method];
    
    if (!handler) {
      return NextResponse.json({ 
        error: `Method ${method} not allowed` 
      }, { status: 405 });
    }
    
    return handler(req as AuthenticatedRequest);
  };
}

// Composition helper for middleware
export function compose(...middlewares: Array<(handler: ApiHandler) => ApiHandler>) {
  return (handler: ApiHandler): ApiHandler => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}