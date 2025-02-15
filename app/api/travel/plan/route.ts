import { NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = 'http://localhost:8000';

interface TravelPlanRequest {
  destination: string;
  dateRange: {
    from: string;
    to: string;
  };
  groupSize: string;
  budget: number;
  interests: string;
  departureLocation?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const response = await fetch('http://localhost:8000/api/travel/plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('Backend request failed');
    }

    const data = await response.json();
    
    // Validate the response structure
    if (!data.itinerary || !Array.isArray(data.itinerary)) {
      throw new Error('Invalid response format from backend');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error in travel planning:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      itinerary: [],
      flights: [],
      hotels: [],
      messages: []
    }, { status: 500 });
  }
} 