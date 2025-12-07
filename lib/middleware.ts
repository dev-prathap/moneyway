import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from './auth';

const COOKIE_NAME = process.env.COOKIE_NAME || 'maniway_token';

/**
 * Middleware to protect routes requiring authentication
 * Returns the user payload if authenticated, null otherwise
 */
export function withAuth(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  const user = verifyJWT(token);
  return user;
}

/**
 * Create a protected API route handler
 */
export function protectedRoute(
  handler: (request: NextRequest, user: NonNullable<ReturnType<typeof verifyJWT>>) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = withAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return handler(request, user);
  };
}
