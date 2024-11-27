import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';

export async function validateToken(request: Request) {
  const token = request.headers.get('Cookie')?.split(';')
    .find(c => c.trim().startsWith('admin_token='))
    ?.split('=')[1];

  if (!token) {
    return false;
  }

  try {
    jwt.verify(token, import.meta.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function createAuthMiddleware(handler: APIRoute): APIRoute {
  return async (context) => {
    const isValid = await validateToken(context.request);
    
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return handler(context);
  };
}
