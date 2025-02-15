export interface AgentState {
  messages: any[];
  current_node: string;
  destination: string;
  dates: string;
  groupSize: string;
  duration: string;
  budget: number;
  interests: string;
}

export interface Activity {
  time: string;
  description: string;
  location?: string;
  cost?: number;
  type?: string;
  tips: string[];
}

export interface TravelPlan {
  days: Array<{
    day: number;
    activities: Activity[];
  }>;
}

export interface TravelPlanResult {
  itinerary: Array<{
    day: number;
    activities: Array<{
      id: string;
      time: string;
      title: string;
      description: string;
      location: string;
      type: string;
      price: number;
      tips: string[];
    }>;
  }>;
  flights?: Array<{
    airline: string;
    departure: string;
    arrival: string;
    price: string;
    duration: string;
    logo?: string;
    bookingLink?: string;
  }>;
  hotels?: Array<{
    name: string;
    description: string;
    image: string;
    price: string;
    rating: number;
    amenities: string[];
    location?: string;
    bookingLink?: string;
  }>;
  messages?: Array<{
    role: string;
    content: string;
  }>;
  interests?: string;
} 