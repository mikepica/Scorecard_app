import { NextResponse } from 'next/server';
// to be commented out
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import type { AlignmentContextDetail } from '@/types/alignment';

// to be commented out
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// import { openai } from @/lib/openai

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
  alignments?: AlignmentContextDetail[];
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

// Extract AI context from selected programs
function extractAIContext(data: ScorecardData): string {
  const aiContexts: string[] = [];

  if (data && data.pillars) {
    data.pillars.forEach(pillar => {
      if (pillar && pillar.categories) {
        pillar.categories.forEach(category => {
          if (category && category.strategicGoals) {
            category.strategicGoals.forEach(goal => {
              if (goal && goal.strategicPrograms) {
                goal.strategicPrograms.forEach(program => {
                  if (program && program.aiContext && program.aiContext.trim()) {
                    aiContexts.push(`${program.text}: ${program.aiContext}`);
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  return aiContexts.length > 0
    ? `\n\nAI Context for Selected Programs:\n${aiContexts.join('\n')}`
    : '';
}

function buildAlignmentSummary(alignments?: AlignmentContextDetail[]): string {
  if (!Array.isArray(alignments) || alignments.length === 0) {
    return '';
  }

  const sections = alignments.map((detail, index) => {
    const lines: string[] = [];
    lines.push(
      `Alignment ${index + 1}: Item ${detail.itemType} (${detail.itemId}) as ${detail.itemRole.toUpperCase()}`,
    );

    if (detail.summary) {
      lines.push(detail.summary);
    }

    const relatedDescriptor = detail.relatedItemType
      ? `${detail.relatedItemRole.toUpperCase()} ${detail.relatedItemType} (${detail.relatedItemId ?? 'unknown'})`
      : 'Related item: unknown';
    lines.push(relatedDescriptor);

    if (detail.relatedItemName) {
      lines.push(`Related name: ${detail.relatedItemName}`);
    }

    if (detail.relatedItemPath) {
      lines.push(`Related path: ${detail.relatedItemPath}`);
    }

    lines.push(`Strength: ${detail.alignment.alignment_strength}`);

    if (detail.alignment.alignment_rationale) {
      lines.push(`Rationale: ${detail.alignment.alignment_rationale}`);
    }

    lines.push(`Alignment record:\n${JSON.stringify(detail.alignment, null, 2)}`);

    return lines.join('\n');
  });

  return `\n\nAlignment context:\n${sections.join('\n\n')}`;
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
        const alignmentsContextRaw = formData.get('alignmentsContext') as string | null;
        let alignmentsContext: AlignmentContextDetail[] = [];

        if (alignmentsContextRaw) {
          try {
            alignmentsContext = JSON.parse(alignmentsContextRaw) as AlignmentContextDetail[];
          } catch (alignmentParseError) {
            console.error('Failed to parse alignments context payload:', alignmentParseError);
          }
        }
        
        if (scorecardData && selections) {
          const fullData = JSON.parse(scorecardData);
          const filterSelections = JSON.parse(selections);
          
          // Filter data based on selections
          const filteredData = filterScorecardData(fullData, filterSelections);
          const contextWithAlignments: ScorecardData = {
            ...filteredData,
            alignments: alignmentsContext.length > 0 ? alignmentsContext : undefined,
          };
          
          userMessage = `Please analyze the selected strategic data for ${flowType.replace('-', ' ')}.\n\n`;
          
          if (prompt) {
            userMessage += `User Instructions: ${prompt}\n\n`;
          }
          
          userMessage += `Selected Data Context: ${JSON.stringify(contextWithAlignments, null, 2)}\n\n`;
          
          if (fileContents) {
            userMessage += `Attached Documents:\n${fileContents}\n\n`;
          }
          
          contextData = contextWithAlignments;
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
    const typedContext = (context ?? { pillars: [] }) as ScorecardData;

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

    // Extract AI context from selected programs
    const aiContext = extractAIContext(typedContext);
    const alignmentSummary = buildAlignmentSummary(typedContext.alignments);

    // Limit context size to prevent token overflow
    const contextString = JSON.stringify(typedContext);
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
          content: `${systemPrompt}\n\nHere is the context of the scorecard data: ${truncatedContext}${aiContext}${alignmentSummary}`
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
