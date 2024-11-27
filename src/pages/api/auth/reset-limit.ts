import type { APIRoute } from 'astro';
import { resetLoginAttempts } from '../../../lib/auth';

export const POST: APIRoute = async ({ clientAddress }) => {
  try {
    const ip = clientAddress || '0.0.0.0';
    resetLoginAttempts(ip);
    
    return new Response(JSON.stringify({ success: true, message: 'Rate limit reset successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Reset error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
