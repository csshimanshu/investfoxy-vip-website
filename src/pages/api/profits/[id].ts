import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';

interface Profit {
  id: string;
  date: string;
  amount: number;
  description: string;
  image?: string;
}

interface ContentData {
  profits: Profit[];
  [key: string]: any;
}

// Simple MIME type checker
function isImageFile(buffer: Buffer): { ext: string; mime: string } | null {
  // Check for PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { ext: 'png', mime: 'image/png' };
  }
  // Check for JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  // Check for GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { ext: 'gif', mime: 'image/gif' };
  }
  return null;
}

export const PUT: APIRoute = async ({ params, request }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'No ID provided' }), {
        status: 400,
        headers
      });
    }

    const contentPath = path.join(process.cwd(), 'src/data/content.json');
    let content: ContentData;
    try {
      const contentData = await fs.readFile(contentPath, 'utf-8');
      content = JSON.parse(contentData);
    } catch (error) {
      console.error('Error reading content file:', error);
      return new Response(JSON.stringify({ error: 'Failed to read content file' }), {
        status: 500,
        headers
      });
    }

    const profitIndex = content.profits.findIndex((p: Profit) => p.id === id);
    if (profitIndex === -1) {
      return new Response(JSON.stringify({ error: 'Profit not found' }), {
        status: 404,
        headers
      });
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('Error parsing form data:', error);
      return new Response(JSON.stringify({ error: 'Failed to parse form data' }), {
        status: 400,
        headers
      });
    }

    const date = formData.get('date') as string;
    const amountStr = formData.get('amount') as string;
    const description = formData.get('description') as string;
    const imageFile = formData.get('image') as File | null;

    if (!date || !amountStr || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers
      });
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      return new Response(JSON.stringify({ error: 'Invalid amount value' }), {
        status: 400,
        headers
      });
    }

    // Update profit data
    const updatedProfit: Profit = {
      ...content.profits[profitIndex],
      date,
      amount,
      description
    };

    // Handle new image if provided
    if (imageFile && imageFile.size > 0) {
      try {
        // Delete old image if it exists
        if (content.profits[profitIndex].image) {
          const oldImagePath = path.join(process.cwd(), 'public', content.profits[profitIndex].image);
          try {
            await fs.unlink(oldImagePath);
          } catch (error) {
            console.error('Error deleting old image:', error);
            // Continue even if old image deletion fails
          }
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });

        // Save new image
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Check file type
        const fileType = isImageFile(buffer);
        if (!fileType) {
          return new Response(JSON.stringify({ error: 'Invalid image file type. Only PNG, JPEG, and GIF are supported.' }), {
            status: 400,
            headers
          });
        }

        const fileName = `profit-${id}-${Date.now()}.${fileType.ext}`;
        const imagePath = path.join(uploadsDir, fileName);
        await fs.writeFile(imagePath, buffer);
        updatedProfit.image = `/uploads/${fileName}`;
      } catch (error) {
        console.error('Error handling image:', error);
        return new Response(JSON.stringify({ error: 'Failed to process image' }), {
          status: 500,
          headers
        });
      }
    }

    // Update profit in content
    content.profits[profitIndex] = updatedProfit;
    try {
      await fs.writeFile(contentPath, JSON.stringify(content, null, 2));
    } catch (error) {
      console.error('Error writing content file:', error);
      return new Response(JSON.stringify({ error: 'Failed to save changes' }), {
        status: 500,
        headers
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      profit: updatedProfit 
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error updating profit:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'No ID provided' }), {
        status: 400,
        headers
      });
    }

    const contentPath = path.join(process.cwd(), 'src/data/content.json');
    let content: ContentData;
    try {
      const contentData = await fs.readFile(contentPath, 'utf-8');
      content = JSON.parse(contentData);
    } catch (error) {
      console.error('Error reading content file:', error);
      return new Response(JSON.stringify({ error: 'Failed to read content file' }), {
        status: 500,
        headers
      });
    }

    const profitIndex = content.profits.findIndex((p: Profit) => p.id === id);
    if (profitIndex === -1) {
      return new Response(JSON.stringify({ error: 'Profit not found' }), {
        status: 404,
        headers
      });
    }

    // Delete associated image if it exists
    const profit = content.profits[profitIndex];
    if (profit.image) {
      const imagePath = path.join(process.cwd(), 'public', profit.image);
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    content.profits.splice(profitIndex, 1);
    await fs.writeFile(contentPath, JSON.stringify(content, null, 2));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error deleting profit:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers
    });
  }
};
