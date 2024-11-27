import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Testimonial, TestimonialInput, ContentJson } from '../../../types/testimonial';

// Import content with explicit type
const content = (await import('../../../data/content.json')).default as ContentJson;

// Function to save content.json
async function saveContent() {
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const projectRoot = dirname(dirname(dirname(dirname(dirname(currentFilePath)))));
    const contentPath = join(projectRoot, 'src', 'data', 'content.json');
    console.log('Saving content to:', contentPath);
    await writeFile(contentPath, JSON.stringify(content, null, 2));
  } catch (error) {
    console.error('Error saving content:', error);
    throw new Error(`Failed to save content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const PATCH: APIRoute = async ({ params, request }) => {
  console.log('API Route: Received PATCH request for ID:', params.id);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Content-Type': 'application/json'
  };

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  try {
    const testimonialId = params.id;
    if (!testimonialId) {
      return new Response(JSON.stringify({ 
        error: 'Missing testimonial ID',
      }), {
        status: 400,
        headers
      });
    }

    const data = await request.json();
    console.log('Received data:', { ...data, profilePhotoData: data.profilePhotoData ? '[BASE64]' : undefined });

    // Find the testimonial to update
    const testimonialIndex = content.testimonials.findIndex(t => t.id === testimonialId);
    if (testimonialIndex === -1) {
      return new Response(JSON.stringify({ 
        error: 'Testimonial not found',
      }), {
        status: 404,
        headers
      });
    }

    // Handle profile photo if provided
    if (data.profilePhotoData && data.profilePhoto) {
      try {
        console.log('Processing profile photo...');
        const currentFilePath = fileURLToPath(import.meta.url);
        const projectRoot = dirname(dirname(dirname(dirname(dirname(currentFilePath)))));
        const imagesDir = join(projectRoot, 'public', 'images', 'testimonials');
        
        // Ensure the images directory exists
        await mkdir(imagesDir, { recursive: true });
        
        const base64Content = data.profilePhotoData.split(';base64,').pop();
        if (!base64Content) {
          throw new Error('Invalid base64 data');
        }
        
        const fileName = `${Date.now()}-${data.profilePhoto}`;
        const buffer = Buffer.from(base64Content, 'base64');
        const imagePath = join(imagesDir, fileName);
        
        console.log('Saving image to:', imagePath);
        await writeFile(imagePath, buffer);
        
        // Update the profile photo path
        data.profilePhoto = `/images/testimonials/${fileName}`;
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

    // Update the testimonial
    const updatedTestimonial = {
      ...content.testimonials[testimonialIndex],
      name: data.name,
      initials: data.initials,
      joinDate: data.joinDate,
      roi: parseFloat(data.roi.toString()),
      quote: data.quote,
      ...(data.profilePhoto && { profilePhoto: data.profilePhoto })
    };

    content.testimonials[testimonialIndex] = updatedTestimonial;

    // Save the updated content
    try {
      await saveContent();
      console.log('Successfully updated testimonial');
      return new Response(JSON.stringify({ 
        success: true,
        testimonial: updatedTestimonial
      }), {
        status: 200,
        headers
      });
    } catch (error) {
      console.error('Failed to save content:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to save content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers
      });
    }
  } catch (error) {
    console.error('API Route Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  console.log('API Route: Received DELETE request for ID:', params.id);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Content-Type': 'application/json'
  };

  try {
    const testimonialId = params.id;
    if (!testimonialId) {
      return new Response(JSON.stringify({ 
        error: 'Missing testimonial ID',
      }), {
        status: 400,
        headers
      });
    }

    // Find the testimonial to delete
    const testimonialIndex = content.testimonials.findIndex(t => t.id === testimonialId);
    if (testimonialIndex === -1) {
      return new Response(JSON.stringify({ 
        error: 'Testimonial not found',
      }), {
        status: 404,
        headers
      });
    }

    // Remove the testimonial from the array
    const [deletedTestimonial] = content.testimonials.splice(testimonialIndex, 1);

    // Save the updated content
    try {
      await saveContent();
      console.log('Successfully deleted testimonial');
      return new Response(JSON.stringify({ 
        success: true,
        testimonial: deletedTestimonial
      }), {
        status: 200,
        headers
      });
    } catch (error) {
      console.error('Failed to save content:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to save content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers
      });
    }
  } catch (error) {
    console.error('API Route Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers
    });
  }
};
