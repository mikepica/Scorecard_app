import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Extract form data
    const content = formData.get('content') as string;
    const instructions = formData.get('instructions') as string;
    const programContext = formData.get('programContext') as string;
    
    // Extract file contents
    const files = formData.getAll('files') as File[];
    let fileContents = '';
    
    if (files.length > 0) {
      const fileTexts = await Promise.all(
        files.map(async (file) => {
          const text = await file.text();
          return `--- Content from ${file.name} ---\n${text}\n`;
        })
      );
      fileContents = fileTexts.join('\n');
    }

    // Load system prompt from file
    const promptPath = path.join(process.cwd(), 'Prompts', 'progress-updates-system-prompt.md');
    const systemPrompt = await fs.readFile(promptPath, 'utf-8');

    // Construct the user message
    let userMessage = '';
    
    if (content) {
      userMessage += `Current progress update content:\n${content}\n\n`;
    }
    
    if (instructions) {
      userMessage += `User instructions:\n${instructions}\n\n`;
    }
    
    if (programContext) {
      userMessage += `Strategic program context:\n${programContext}\n\n`;
    }
    
    if (fileContents) {
      userMessage += `Attached documents:\n${fileContents}\n\n`;
    }
    
    userMessage += 'Please generate or improve the progress update based on the provided information.';

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userMessage
        }
      ],
    });

    const generatedUpdate = completion.choices[0].message.content;

    return NextResponse.json({ 
      success: true,
      update: generatedUpdate 
    });

  } catch (error) {
    console.error('Error in generate-update API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate update' 
      },
      { status: 500 }
    );
  }
}