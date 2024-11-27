import type { APIRoute } from 'astro';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Profit ID is required' }),
        { status: 400 }
      );
    }

    // Read the content file
    const contentPath = join(process.cwd(), 'src/data/content.json');
    const content = JSON.parse(readFileSync(contentPath, 'utf-8'));

    // Find and remove the profit
    const profitIndex = content.profits.findIndex((profit: any) => profit.id === id);
    
    if (profitIndex === -1) {
      return new Response(
        JSON.stringify({ success: false, message: 'Profit not found' }),
        { status: 404 }
      );
    }

    // Remove the profit
    content.profits.splice(profitIndex, 1);

    // Write back to the file
    writeFileSync(contentPath, JSON.stringify(content, null, 2));

    return new Response(
      JSON.stringify({ success: true, message: 'Profit deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting profit:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500 }
    );
  }
}
