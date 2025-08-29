import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FilterSelections {
  pillars: number[];
  categories: number[];
  goals: number[];
  programs: number[];
}

interface ScorecardData {
  pillars: Array<{
    id: number;
    categories: Array<{
      id: number;
      strategicGoals: Array<{
        id: number;
        strategicPrograms: Array<{
          id: number;
          [key: string]: unknown;
        }>;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }>;
}

// Filter scorecard data based on user selections
function filterScorecardData(fullData: ScorecardData, selections: FilterSelections) {
  const filtered = {
    pillars: fullData.pillars.filter((pillar) => 
      selections.pillars.includes(pillar.id)
    ).map((pillar) => ({
      ...pillar,
      categories: pillar.categories.filter((category) => 
        selections.categories.includes(category.id)
      ).map((category) => ({
        ...category,
        strategicGoals: category.strategicGoals.filter((goal) => 
          selections.goals.includes(goal.id)
        ).map((goal) => ({
          ...goal,
          strategicPrograms: goal.strategicPrograms.filter((program) => 
            selections.programs.includes(program.id)
          )
        }))
      }))
    }))
  };
  
  return filtered;
}

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
      // Handle FormData for reprioritization or AI Flows requests
      const formData = await req.formData();
      const flowType = formData.get('flowType') as string;
      
      if (flowType) {
        // AI Flows request
        isReprioritization = false;
      } else {
        // Reprioritization request
        isReprioritization = true;
      }
      
      // Extract form data
      const prompt = formData.get('prompt') as string;
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

      let userMessage = '';
      let contextData = {};

      if (flowType) {
        // AI Flows request
        const selections = formData.get('selections') as string;
        const scorecardData = formData.get('scorecardData') as string;
        
        if (scorecardData && selections) {
          const fullData = JSON.parse(scorecardData);
          const filterSelections = JSON.parse(selections);
          
          // Filter data based on selections
          const filteredData = filterScorecardData(fullData, filterSelections);
          
          userMessage = `Please analyze the selected strategic data for ${flowType.replace('-', ' ')}.\n\n`;
          
          if (prompt) {
            userMessage += `User Instructions: ${prompt}\n\n`;
          }
          
          userMessage += `Selected Data Context: ${JSON.stringify(filteredData, null, 2)}\n\n`;
          
          if (fileContents) {
            userMessage += `Attached Documents:\n${fileContents}\n\n`;
          }
          
          contextData = filteredData;
        }
      } else {
        // Reprioritization request
        const programContext = formData.get('programContext') as string;
        
        userMessage = `Please analyze and reprioritize the quarterly objectives for this strategic program.\n\n`;
        
        if (prompt) {
          userMessage += `User Request: ${prompt}\n\n`;
        }
        
        if (programContext) {
          userMessage += `Strategic Program Context: ${programContext}\n\n`;
        }
        
        if (fileContents) {
          userMessage += `Attached Documents:\n${fileContents}\n\n`;
        }
        
        contextData = programContext ? JSON.parse(programContext) : {};
      }
      
      // Create body structure
      body = {
        messages: [{
          role: 'user',
          content: userMessage
        }],
        context: contextData,
        flowType: flowType || 'reprioritization'
      };
    }

    const { messages, context } = body;

    // Load appropriate system prompt
    let promptPath;
    const bodyFlowType = (body as { flowType?: string }).flowType;
    
    if (isReprioritization) {
      promptPath = path.join(process.cwd(), 'Prompts', 'reprioritize-goals-system-prompt.md');
    } else if (bodyFlowType === 'goal-comparison') {
      promptPath = path.join(process.cwd(), 'Prompts', 'goal-comparison-system-prompt.md');
    } else if (bodyFlowType === 'learnings-best-practices') {
      promptPath = path.join(process.cwd(), 'Prompts', 'learnings-best-practices-system-prompt.md');
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
      isReprioritization: isReprioritization,
      flowType: bodyFlowType
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 