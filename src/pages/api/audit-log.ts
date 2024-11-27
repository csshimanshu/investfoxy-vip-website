import type { APIRoute } from 'astro';
import { getAuditLog } from '../../lib/auth';
import { createAuthMiddleware } from '../../middleware/auth';

const handler: APIRoute = async ({ request }) => {
  try {
    const { action, startDate, endDate } = await request.json();
    
    const filters: any = {};
    if (action) filters.action = action;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const logs = getAuditLog(filters);

    return new Response(JSON.stringify(logs), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Audit log error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// Protect the audit log endpoint with authentication
export const POST = createAuthMiddleware(handler);
