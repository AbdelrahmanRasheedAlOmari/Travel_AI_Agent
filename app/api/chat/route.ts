import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json()
    console.log('Chat Request:', { message, context }); // Log the request

    // Make request to your backend chat endpoint
    const response = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        context: {
          ...context,
          destination: 'Dubai', // Always set Dubai as destination
          assistant_name: 'Sayih', // Use your assistant's name
          specialization: 'Dubai tourism and culture expert'
        }
      })
    });

    if (!response.ok) {
      console.error('Backend chat error:', response.status, response.statusText);
      throw new Error('Backend chat request failed');
    }

    const data = await response.json();
    console.log('Chat Response:', data); // Log the response

    return NextResponse.json({ 
      message: data.message,
      status: 'success'
    });
    
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal Server Error',
        message: "I apologize, but I'm having trouble connecting to my knowledge base. Please try again.",
        status: 'error'
      },
      { status: 500 }
    );
  }
} 