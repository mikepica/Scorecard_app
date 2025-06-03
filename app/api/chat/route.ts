import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    // Load system prompt from file
    const promptPath = path.join(process.cwd(), 'llm-system-prompt.md');
    const systemPrompt = await fs.readFile(promptPath, 'utf-8');

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\n\nHere is the context of the scorecard data: ${JSON.stringify(context)}`
        },
        ...messages
      ],
    });

    return NextResponse.json({ 
      response: completion.choices[0].message.content 
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 