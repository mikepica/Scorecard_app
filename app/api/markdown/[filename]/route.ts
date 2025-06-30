import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params
    
    // Security: Only allow specific markdown files
    const allowedFiles = [
      'main-instructions',
      'ai-usage', 
      'ooda-ai-integration'
    ]
    
    if (!allowedFiles.includes(filename)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    const filePath = join(process.cwd(), 'app', 'instructions', 'content', `${filename}.md`)
    const content = await readFile(filePath, 'utf-8')
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Error reading markdown file:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}