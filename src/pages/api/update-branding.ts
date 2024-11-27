import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    return new Error(String(maybeError));
  }
}

function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message;
}

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const contentPath = path.join(process.cwd(), 'src/data/content.json');
    const content = JSON.parse(await fs.readFile(contentPath, 'utf-8'));

    // Ensure directories exist
    const publicDir = path.join(process.cwd(), 'public');
    const imagesDir = path.join(publicDir, 'images');
    await ensureDirectoryExists(publicDir);
    await ensureDirectoryExists(imagesDir);

    // Handle file uploads
    const logo = formData.get('logo') as File;
    const favicon = formData.get('favicon') as File;
    const title = formData.get('title') as string;

    try {
      if (logo && logo.size > 0) {
        const logoPath = path.join(imagesDir, logo.name);
        await fs.writeFile(logoPath, Buffer.from(await logo.arrayBuffer()));
        content.branding.logo = `/images/${logo.name}`;
      }

      if (favicon && favicon.size > 0) {
        const faviconPath = path.join(publicDir, favicon.name);
        await fs.writeFile(faviconPath, Buffer.from(await favicon.arrayBuffer()));
        content.branding.favicon = `/${favicon.name}`;
      }

      if (title) {
        content.branding.title = title;
      }

      // Save updated content
      await fs.writeFile(contentPath, JSON.stringify(content, null, 2));

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (fileError) {
      console.error('Error handling files:', getErrorMessage(fileError));
      return new Response(
        JSON.stringify({
          error: 'Failed to handle file uploads',
          details: getErrorMessage(fileError)
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    console.error('Error updating branding:', getErrorMessage(error));
    return new Response(
      JSON.stringify({
        error: 'Failed to update branding',
        details: getErrorMessage(error)
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
