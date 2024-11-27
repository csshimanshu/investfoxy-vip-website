import type { APIRoute } from 'astro';
import { generateToken, checkRateLimit, logAuditEvent, resetLoginAttempts } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // Use a default IP if clientAddress is not available
    const ip = clientAddress || '0.0.0.0';
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: `Too many login attempts. Please try again in ${Math.ceil(rateLimitResult.waitTime! / 60000)} minutes.`
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { username, password, remember } = await request.json();

    // Debug logging
    console.log('Login attempt:', {
      providedUsername: username.toLowerCase(),
      storedUsername: import.meta.env.ADMIN_USERNAME.toLowerCase(),
      usernameMatch: username.toLowerCase() === import.meta.env.ADMIN_USERNAME.toLowerCase(),
      passwordMatch: password === import.meta.env.ADMIN_PASSWORD
    });

    // Validate credentials against environment variables (case-insensitive username)
    if (
      username.toLowerCase() === import.meta.env.ADMIN_USERNAME.toLowerCase() &&
      password === import.meta.env.ADMIN_PASSWORD
    ) {
      // Reset login attempts on successful login
      resetLoginAttempts(ip);

      // Generate JWT token
      const token = generateToken(username, remember);

      // Log successful login
      logAuditEvent({
        action: 'login',
        username,
        ip,
        details: { remember }
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${remember ? 2592000 : 86400}`
        }
      });
    }

    // Log failed login attempt with details
    const failureReason = {
      usernameMatch: username.toLowerCase() === import.meta.env.ADMIN_USERNAME.toLowerCase(),
      passwordMatch: password === import.meta.env.ADMIN_PASSWORD
    };

    logAuditEvent({
      action: 'failed_login',
      username,
      ip,
      details: { reason: 'Invalid credentials', ...failureReason }
    });

    return new Response(JSON.stringify({ 
      error: 'Invalid credentials',
      debug: {
        usernameValid: username.toLowerCase() === import.meta.env.ADMIN_USERNAME.toLowerCase(),
        passwordValid: password === import.meta.env.ADMIN_PASSWORD
      }
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
