import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';
import type { Testimonial, TestimonialInput, BaseTestimonial, ContentJson } from '../../types/testimonial';

// Import content with explicit type
const content = (await import('../../data/content.json')).default as ContentJson;

// Function to ensure directory exists
async function ensureDir(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

// Function to save image file
async function saveImageFile(base64Data: string, fileName: string): Promise<string> {
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const projectRoot = dirname(dirname(dirname(dirname(currentFilePath))));
    const imagesDir = join(projectRoot, 'public', 'images', 'testimonials');
    
    console.log('Project root:', projectRoot);
    console.log('Images directory:', imagesDir);
    
    // Ensure the images directory exists
    await ensureDir(imagesDir);
    
    const base64Content = base64Data.split(';base64,').pop();
    if (!base64Content) {
      throw new Error('Invalid base64 data');
    }
    
    const buffer = Buffer.from(base64Content, 'base64');
    const imagePath = join(imagesDir, fileName);
    
    console.log('Saving image to:', imagePath);
    await writeFile(imagePath, buffer);
    
    return `/images/testimonials/${fileName}`;
  } catch (error) {
    console.error('Error saving image:', error);
    throw new Error(`Failed to save image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to save content.json
async function saveContent() {
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const projectRoot = dirname(dirname(dirname(dirname(currentFilePath))));
    const contentPath = join(projectRoot, 'src', 'data', 'content.json');
    console.log('Saving content to:', contentPath);
    await writeFile(contentPath, JSON.stringify(content, null, 2));
  } catch (error) {
    console.error('Error saving content:', error);
    throw new Error(`Failed to save content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const POST: APIRoute = async ({ request }) => {
  console.log('API Route: Received POST request');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Content-Type': 'application/json'
  };

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  try {
    console.log('API Route: Parsing request body');
    let data;
    try {
      data = await request.json();
      console.log('API Route: Request data:', { 
        ...data, 
        profilePhotoData: data.profilePhotoData ? '[BASE64]' : null 
      });
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(JSON.stringify({ 
        error: 'Invalid request body',
        details: 'Failed to parse JSON data'
      }), {
        status: 400,
        headers
      });
    }

    // Validate required fields
    const missingFields = [];
    if (!data.name) missingFields.push('name');
    if (!data.initials) missingFields.push('initials');
    if (!data.joinDate) missingFields.push('joinDate');
    if (!data.roi) missingFields.push('roi');
    if (!data.quote) missingFields.push('quote');

    if (missingFields.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        details: `Missing fields: ${missingFields.join(', ')}`
      }), {
        status: 400,
        headers
      });
    }

    console.log('API Route: Creating new testimonial object');
    const baseTestimonial: BaseTestimonial = {
      id: uuidv4(),
      name: data.name,
      initials: data.initials,
      joinDate: data.joinDate,
      roi: parseFloat(data.roi.toString()),
      quote: data.quote
    };

    console.log('API Route: New testimonial (before photo):', baseTestimonial);

    // Create the initial testimonial object without photo
    const testimonial: Testimonial = { ...baseTestimonial };

    // If there's profile photo data, save it
    if (data.profilePhotoData && data.profilePhoto) {
      try {
        console.log('API Route: Processing profile photo...');
        const savedPhotoPath = await saveImageFile(data.profilePhotoData, data.profilePhoto);
        testimonial.profilePhoto = savedPhotoPath;
        console.log('API Route: Profile photo saved:', testimonial.profilePhoto);
      } catch (error) {
        console.error('Failed to save profile photo:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to save profile photo',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers
        });
      }
    }

    // Initialize testimonials array if it doesn't exist
    if (!Array.isArray(content.testimonials)) {
      content.testimonials = [];
    }

    console.log('API Route: Adding testimonial to array');
    content.testimonials.push(testimonial);
    console.log('API Route: New testimonials count:', content.testimonials.length);

    console.log('API Route: Writing updated content.json...');
    try {
      await saveContent();
      console.log('API Route: Successfully wrote content.json');
    } catch (error) {
      console.error('Failed to save content.json:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to save testimonial',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      testimonial
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('API Route Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to add testimonial',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers
    });
  }
};
