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

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    const interestsPath = path.join(process.cwd(), 'src', 'data', 'interests.json');

    // Read current interests
    let interests: Interest[] = [];
    try {
      const fileContent = fs.readFileSync(interestsPath, 'utf-8');
      interests = fileContent ? JSON.parse(fileContent) : [];
    } catch (error) {
      console.error('Error reading interests:', error);
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to read interests data'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Find and remove the interest
    const interestIndex = interests.findIndex(interest => interest.id === id);
    if (interestIndex === -1) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Interest not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Remove the interest
    interests.splice(interestIndex, 1);

    // Save updated interests
    fs.writeFileSync(interestsPath, JSON.stringify(interests, null, 2));

    return new Response(JSON.stringify({
      success: true,
      message: 'Interest deleted successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error deleting interest:', error);
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
