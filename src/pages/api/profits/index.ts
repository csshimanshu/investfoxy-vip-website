import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const contentPath = path.join(process.cwd(), 'src/data/content.json');
    const content = JSON.parse(await fs.readFile(contentPath, 'utf-8'));

    const date = formData.get('date') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const image = formData.get('image') as File;

    let imagePath = '';
    if (image && image.size > 0) {
      const fileName = `${uuidv4()}-${image.name}`;
      const filePath = path.join(process.cwd(), 'public/images/profits', fileName);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, Buffer.from(await image.arrayBuffer()));
      imagePath = `/images/profits/${fileName}`;
    }

    const newProfit = {
      id: uuidv4(),
      date,
      amount,
      description,
      image: imagePath || undefined
    };

    content.profits.unshift(newProfit);
    await fs.writeFile(contentPath, JSON.stringify(content, null, 2));

    return new Response(JSON.stringify({ success: true, profit: newProfit }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error adding profit:', error);
    return new Response(JSON.stringify({ error: 'Failed to add profit' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
