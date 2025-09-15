import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }
    
    // Take first few messages to generate a concise name
    const firstMessages = messages.slice(0, 4);
    const conversationText = firstMessages
      .map(msg => `${msg.sender}: ${msg.text}`)
      .join('\n');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "Generate a short, descriptive name (3-6 words) for this chat conversation. Focus on the main topic or question being discussed. Return only the name, no quotes or extra text."
        },
        {
          role: "user",
          content: `Generate a name for this conversation:\n\n${conversationText}`
        }
      ],
    });
    
    const generatedName = completion.choices[0].message.content?.trim() || 'New Chat';
    
    return NextResponse.json({ name: generatedName });
  } catch (error) {
    console.error('Error generating thread name:', error);
    return NextResponse.json(
      { error: 'Failed to generate thread name' },
      { status: 500 }
    );
  }
}