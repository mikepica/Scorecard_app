import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          ct.id,
          ct.name,
          ct.created_at,
          ct.updated_at,
          COUNT(cm.id) as message_count,
          MAX(cm.timestamp) as last_message_at
        FROM chat_threads ct
        LEFT JOIN chat_messages cm ON ct.id = cm.thread_id
        GROUP BY ct.id, ct.name, ct.created_at, ct.updated_at
        ORDER BY COALESCE(MAX(cm.timestamp), ct.updated_at) DESC
      `);
      
      return NextResponse.json({ threads: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Thread name is required' },
        { status: 400 }
      );
    }
    
    const client = await pool.connect();
    
    try {
      const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await client.query(`
        INSERT INTO chat_threads (id, name)
        VALUES ($1, $2)
        RETURNING *
      `, [threadId, name]);
      
      return NextResponse.json({ thread: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('id');
    
    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        DELETE FROM chat_threads WHERE id = $1
        RETURNING id
      `, [threadId]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting thread:', error);
    return NextResponse.json(
      { error: 'Failed to delete thread' },
      { status: 500 }
    );
  }
}