import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;
    const client = await pool.connect();
    
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
    const { name } = await req.json();
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Thread name is required' },
        { status: 400 }
      );
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE chat_threads 
        SET name = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [name, threadId]);
      
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