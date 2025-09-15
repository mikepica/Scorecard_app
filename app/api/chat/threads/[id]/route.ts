import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/database';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;
    const client = await getDbConnection();
    
    try {
      // Get thread info
      const threadResult = await client.query(`
        SELECT * FROM chat_threads WHERE id = $1
      `, [threadId]);
      
      if (threadResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }
      
      // Get messages
      const messagesResult = await client.query(`
        SELECT * FROM chat_messages 
        WHERE thread_id = $1 
        ORDER BY timestamp ASC
      `, [threadId]);
      
      return NextResponse.json({
        thread: threadResult.rows[0],
        messages: messagesResult.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;
    const body = await req.json();
    const { name, contextSelection } = body as { name?: string; contextSelection?: unknown };
    
    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid name' },
        { status: 400 }
      );
    }
    
    if (name === undefined && contextSelection === undefined) {
      return NextResponse.json(
        { error: 'Nothing to update' },
        { status: 400 }
      );
    }
    
    const client = await getDbConnection();
    
    try {
      // Dynamically build update statement
      const sets: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      
      if (name !== undefined) {
        sets.push(`name = $${idx++}`);
        values.push(name);
      }
      if (contextSelection !== undefined) {
        sets.push(`context_selection = $${idx++}`);
        values.push(contextSelection);
      }
      sets.push(`updated_at = CURRENT_TIMESTAMP`);
      
      const query = `
        UPDATE chat_threads
        SET ${sets.join(', ')}
        WHERE id = $${idx}
        RETURNING *
      `;
      values.push(threadId);
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ thread: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating thread:', error);
    return NextResponse.json(
      { error: 'Failed to update thread' },
      { status: 500 }
    );
  }
}
