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
      const context = JSON.parse(programContext);
      const contextLabel = context.itemType ? `${context.itemType} context` : 'Strategic program context';
      userMessage += `${contextLabel}:\n${JSON.stringify(context, null, 2)}\n\n`;

      // Add specific AI context section if available
      if (context.aiContext && context.aiContext.trim()) {
        userMessage += `AI-specific context and instructions:\n${context.aiContext}\n\n`;
      }

      // Include alignment details when available
      if (Array.isArray(context.alignments) && context.alignments.length > 0) {
        const alignmentSummaries = context.alignments
          .map((alignmentDetail: AlignmentContextDetail, index: number) => {
            const summaryLines: string[] = [];
            const alignmentRecord = alignmentDetail?.alignment;
            const summaryText = alignmentDetail?.summary;
            const itemRole = alignmentDetail?.itemRole;
            const relatedRole = alignmentDetail?.relatedItemRole;
            const relatedType = alignmentDetail?.relatedItemType;
            const relatedId = alignmentDetail?.relatedItemId;
            const relatedName = alignmentDetail?.relatedItemName;
            const relatedPath = alignmentDetail?.relatedItemPath;

            summaryLines.push(`Alignment ${index + 1}:`);

            if (summaryText) {
              summaryLines.push(summaryText);
            }

            const rolesLine = [
              itemRole ? `Item role: ${itemRole}` : null,
              relatedRole ? `Related role: ${relatedRole}` : null,
              relatedType ? `Related type: ${relatedType}` : null,
              relatedId ? `Related id: ${relatedId}` : null,
            ]
              .filter(Boolean)
              .join(' | ');

            if (rolesLine) {
              summaryLines.push(rolesLine);
            }

            if (relatedName) {
              summaryLines.push(`Related name: ${relatedName}`);
            }

            if (relatedPath) {
              summaryLines.push(`Related path: ${relatedPath}`);
            }

            if (alignmentRecord) {
              summaryLines.push(
                `Alignment record:\n${JSON.stringify(alignmentRecord, null, 2)}`,
              );
            }

            return summaryLines.join('\n');
          })
          .join('\n\n');

        userMessage += `Alignment context for ${context.text || context.itemId || 'selected item'}:\n${alignmentSummaries}\n\n`;
      }
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
