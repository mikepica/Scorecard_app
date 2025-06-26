import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type');
    let body;
    let isReprioritization = false;

    // Handle both JSON and FormData requests
    if (contentType?.includes('application/json')) {
      body = await req.json();
      // Validate request body for regular chat
      if (!body.messages || !Array.isArray(body.messages)) {
        return NextResponse.json(
          { error: 'Invalid messages format' },
          { status: 400 }
        );
      }
    } else {
      // Handle FormData for reprioritization requests
      const formData = await req.formData();
      isReprioritization = true;
      
      // Extract form data
      const prompt = formData.get('prompt') as string;
      const programContext = formData.get('programContext') as string;
      const files = formData.getAll('files') as File[];
      
      // Process file contents
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
      
      // Construct user message for reprioritization
      let userMessage = `Please analyze and reprioritize the quarterly objectives for this strategic program.\n\n`;
      
      if (prompt) {
        userMessage += `User Request: ${prompt}\n\n`;
      }
      
      if (programContext) {
        userMessage += `Strategic Program Context: ${programContext}\n\n`;
      }
      
      if (fileContents) {
        userMessage += `Attached Documents:\n${fileContents}\n\n`;
      }
      
      // Create body structure for reprioritization
      body = {
        messages: [{
          role: 'user',
          content: userMessage
        }],
        context: programContext ? JSON.parse(programContext) : {}
      };
    }

    const { messages, context } = body;

    // Load appropriate system prompt
    let promptPath;
    if (isReprioritization) {
      promptPath = path.join(process.cwd(), 'Prompts', 'reprioritize-goals-system-prompt.md');
    } else {
      promptPath = path.join(process.cwd(), 'Prompts', 'AI-chat-system-prompt.md');
    }
    const systemPrompt = await fs.readFile(promptPath, 'utf-8');

    // Limit context size to prevent token overflow
    const contextString = JSON.stringify(context);
    const maxContextLength = 50000; // Adjust based on needs
    const truncatedContext = contextString.length > maxContextLength 
      ? contextString.substring(0, maxContextLength) + '...[truncated]'
      : contextString;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\n\nHere is the context of the scorecard data: ${truncatedContext}`
        },
        ...messages
      ],
    });

    return NextResponse.json({ 
      response: completion.choices[0].message.content,
      isReprioritization: isReprioritization
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 