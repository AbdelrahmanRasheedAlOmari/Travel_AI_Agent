import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Forward the data to your Python backend
    const response = await fetch('http://localhost:8000/store_interaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to store interaction');
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Analytics processing error:', error);
    return NextResponse.json(
      { error: 'Failed to store interaction' },
      { status: 500 }
    );
  }
} 