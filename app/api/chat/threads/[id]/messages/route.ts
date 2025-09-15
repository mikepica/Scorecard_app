import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/database';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;
    const { text, sender } = await req.json();
    
    if (!text || !sender || !['user', 'ai'].includes(sender)) {
      return NextResponse.json(
        { error: 'Valid text and sender (user/ai) are required' },
        { status: 400 }
      );
    }
    
    const client = await getDbConnection();
    
    try {
      // Verify thread exists
      const threadCheck = await client.query(`
        SELECT id FROM chat_threads WHERE id = $1
      `, [threadId]);
      
      if (threadCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }
      
      // Create message
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      const result = await client.query(`
        INSERT INTO chat_messages (id, thread_id, text, sender)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [messageId, threadId, text, sender]);
      
      // Update thread updated_at timestamp
      await client.query(`
        UPDATE chat_threads 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [threadId]);
      
      return NextResponse.json({ message: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}