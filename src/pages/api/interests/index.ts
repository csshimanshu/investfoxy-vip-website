import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

interface Interest {
  id: string;
  tradingExperience: string;
  selectedPlan: string;
  email: string;
  discordId?: string;
  date: string;
}

export const GET: APIRoute = async () => {
  try {
    const interestsPath = path.join(process.cwd(), 'src', 'data', 'interests.json');
    
    if (!fs.existsSync(interestsPath)) {
      return new Response(JSON.stringify({ interests: [] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const fileContent = fs.readFileSync(interestsPath, 'utf-8');
    const interests = fileContent ? JSON.parse(fileContent) : [];

    return new Response(JSON.stringify({ interests }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error reading interests:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to read interests'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const interestsPath = path.join(process.cwd(), 'src', 'data', 'interests.json');

    // Validate required fields
    if (!data.tradingExperience || !data.selectedPlan || !data.email) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing required fields'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Ensure the directory exists
    const dir = path.dirname(interestsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Read existing interests
    let interests: Interest[] = [];
    try {
      if (fs.existsSync(interestsPath)) {
        const fileContent = fs.readFileSync(interestsPath, 'utf-8');
        interests = fileContent ? JSON.parse(fileContent) : [];
      }
    } catch (error) {
      console.error('Error reading interests file:', error);
      // Continue with empty array if file is corrupted
    }

    // Add new interest
    const newInterest: Interest = {
      id: crypto.randomUUID(),
      tradingExperience: data.tradingExperience,
      selectedPlan: data.selectedPlan,
      email: data.email,
      discordId: data.discordId,
      date: new Date().toISOString()
    };

    interests.push(newInterest);

    // Save updated interests
    try {
      fs.writeFileSync(interestsPath, JSON.stringify(interests, null, 2));
      return new Response(JSON.stringify({
        success: true,
        message: 'Interest submitted successfully'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error writing to interests file:', error);
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to save data'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
