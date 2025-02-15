/* import { ChatOpenAI } from "@langchain/openai";
import { StructuredTool } from "@langchain/core/tools";
import { StateGraph, START, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";
import { z } from "zod";
import { getJson } from "serpapi";

// Define the agent state
interface AgentState {
  messages: BaseMessage[];
  currentTask: 'TOOLS' | 'PLANNING' | 'COMPLETE';
}

// Define SerpAPI types to match their API
interface SerpAPIFlightsParams {
  engine: "google_flights";
  api_key: string;
  departure_id: string;
  arrival_id: string;
  outbound_date: string;
  return_date?: string;
  currency: string;
}

interface SerpAPIHotelsParams {
  engine: "google_hotels";
  api_key: string;
  q: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  currency: string;
}

// Define tool schemas
const FlightsSchema = z.object({
  departure_airport: z.string().optional(),
  arrival_airport: z.string().optional(),
  outbound_date: z.string(),
  return_date: z.string().optional(),
  adults: z.number().default(1),
  children: z.number().default(0),
  infants_in_seat: z.number().default(0),
  infants_on_lap: z.number().default(0)
});

const HotelsSchema = z.object({
  location: z.string(),
  check_in_date: z.string(),
  check_out_date: z.string(),
  sort_by: z.string().default('8'),
  adults: z.number().default(1),
  children: z.number().default(0),
  rooms: z.number().default(1),
  hotel_class: z.string().optional()
});

// Update tools to use specific param types
class FlightsFinderTool extends StructuredTool<typeof FlightsSchema> {
  name = "flights_finder";
  description = "Find flights using the Google Flights engine";
  schema = FlightsSchema;

  protected async _call(args: z.infer<typeof FlightsSchema>): Promise<string> {
    try {
      const params: SerpAPIFlightsParams = {
        engine: "google_flights",
        api_key: process.env.SERPAPI_API_KEY!,
        departure_id: args.departure_airport || "",
        arrival_id: args.arrival_airport || "",
        outbound_date: args.outbound_date,
        return_date: args.return_date,
        currency: "USD"
      };

      const response = await getJson(params as any);
      return JSON.stringify(response.best_flights || []);
    } catch (error) {
      console.error('Error in flights finder:', error);
      return "No flights found";
    }
  }
}

class HotelsFinderTool extends StructuredTool<typeof HotelsSchema> {
  name = "hotels_finder";
  description = "Find hotels using the Google Hotels engine";
  schema = HotelsSchema;

  protected async _call(args: z.infer<typeof HotelsSchema>): Promise<string> {
    try {
      const params: SerpAPIHotelsParams = {
        engine: "google_hotels",
        api_key: process.env.SERPAPI_API_KEY!,
        q: args.location,
        check_in_date: args.check_in_date,
        check_out_date: args.check_out_date,
        adults: args.adults,
        currency: "USD"
      };

      const response = await getJson(params as any);
      return JSON.stringify(response.properties?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error in hotels finder:', error);
      return "No hotels found";
    }
  }
}

// Create a proper Runnable class for each step
class ToolsRunnable extends Runnable<AgentState, AgentState> {
  lc_namespace = ["travel_agent", "tools"];

  constructor(private tools: StructuredTool[], private llm: ChatOpenAI) {
    super();
  }

  async invoke(state: AgentState): Promise<AgentState> {
    const systemPrompt = `You are a smart travel agency. Use the tools to look up flight and hotel information.
    Always include prices, links, and images when available.
    Current year is ${new Date().getFullYear()}.`;

    const messages = [new SystemMessage(systemPrompt), ...state.messages];
    const response = await this.llm.invoke(messages as any);

    // Convert response to AIMessage to ensure type compatibility
    const content = typeof response.content === 'string' 
      ? response.content 
      : Array.isArray(response.content) 
        ? response.content.map(c => 'text' in c ? c.text : '').join(' ')
        : '';

    const aiMessage = new AIMessage({ content });

    return {
      messages: [...state.messages, aiMessage],
      currentTask: 'TOOLS' as const
    };
  }
}

class ToolExecutorRunnable extends Runnable<AgentState, AgentState> {
  lc_namespace = ["travel_agent", "executor"];

  constructor(private tools: Record<string, StructuredTool>) {
    super();
  }

  async invoke(state: AgentState): Promise<AgentState> {
    const lastMessage = state.messages[state.messages.length - 1];
    const results = [];

    if ('additional_kwargs' in lastMessage && lastMessage.additional_kwargs.tool_calls) {
      for (const toolCall of lastMessage.additional_kwargs.tool_calls) {
        const tool = this.tools[toolCall.function.name];
        if (tool) {
          try {
            const result = await tool.invoke(JSON.parse(toolCall.function.arguments));
            results.push(new AIMessage({ content: result }));
          } catch (error) {
            results.push(new AIMessage({ content: "Error executing tool" }));
          }
        }
      }
    }

    return {
      messages: [...state.messages, ...results],
      currentTask: 'PLANNING' as const
    };
  }
}

// Update TravelAgent class
export class TravelAgent {
  private tools: Record<string, StructuredTool>;
  private toolsLLM: ChatOpenAI;
  private graph: any;

  constructor() {
    this.tools = {
      flights_finder: new FlightsFinderTool(),
      hotels_finder: new HotelsFinderTool()
    };

    this.toolsLLM = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7
    });

    const builder = new StateGraph<AgentState>({
      channels: {
        messages: {
          reducer: (acc: BaseMessage[], value: BaseMessage[]) => [...acc, ...value],
          default: () => [] as BaseMessage[]
        },
        currentTask: {
          reducer: (_: any, value: 'TOOLS' | 'PLANNING' | 'COMPLETE') => value,
          default: () => 'TOOLS' as const
        }
      }
    });

    // Create the model node
    const modelNode = this.callToolsLLM.bind(this);
    const toolNode = this.invokeTools.bind(this);

    // Add nodes
    builder.addNode("__start__", modelNode);
    builder.addNode("__end__", toolNode);

    // Define the routing function
    function shouldContinue(state: AgentState) {
      const lastMessage = state.messages[state.messages.length - 1];
      if ('additional_kwargs' in lastMessage && lastMessage.additional_kwargs.tool_calls?.length) {
        return "__end__";
      }
      return END;
    }

    // Add conditional edges
    builder.addConditionalEdges(
      "__start__",
      shouldContinue,
      {
        "__end__": "__end__",
        [END]: END
      }
    );

    // Add edge back to start
    builder.addEdge("__end__", "__start__");

    // Compile graph
    this.graph = builder.compile();
  }

  private async callToolsLLM(state: AgentState): Promise<AgentState> {
    const systemPrompt = `You are a smart travel agency. Use the tools to look up flight and hotel information.
    Always include prices, links, and images when available.
    Current year is ${new Date().getFullYear()}.`;

    const messages = [new SystemMessage(systemPrompt), ...state.messages];
    const response = await this.toolsLLM.invoke(messages as any);

    // Convert response to AIMessage to ensure type compatibility
    const content = typeof response.content === 'string' 
      ? response.content 
      : Array.isArray(response.content) 
        ? response.content.map(c => 'text' in c ? c.text : '').join(' ')
        : '';

    return {
      messages: [...state.messages, new AIMessage({ content })],
      currentTask: 'TOOLS'
    };
  }

  private async invokeTools(state: AgentState): Promise<AgentState> {
    const lastMessage = state.messages[state.messages.length - 1];
    const results = [];

    if ('additional_kwargs' in lastMessage && lastMessage.additional_kwargs.tool_calls) {
      for (const toolCall of lastMessage.additional_kwargs.tool_calls) {
        const tool = this.tools[toolCall.function.name];
        if (tool) {
          try {
            const result = await tool.invoke(JSON.parse(toolCall.function.arguments));
            results.push(new AIMessage({ content: result }));
          } catch (error) {
            results.push(new AIMessage({ content: "Error executing tool" }));
          }
        }
      }
    }

    return {
      messages: [...state.messages, ...results],
      currentTask: 'PLANNING'
    };
  }

  async planTravel(query: string) {
    const initialState: AgentState = {
      messages: [new HumanMessage(query)],
      currentTask: 'TOOLS'
    };

    try {
      const result = await this.graph.invoke(initialState);
      
      const formattedResult: TravelPlanResponse = {
        itinerary: this.parseItinerary(result.messages),
        flights: this.parseFlights(result.messages),
        hotels: this.parseHotels(result.messages)
      };

      return formattedResult;
    } catch (error) {
      console.error('Error in planTravel:', error);
      throw error;
    }
  }

  private parseItinerary(messages: BaseMessage[]): Array<{
    day: number;
    activities: Array<{
      id: string;
      day: number;
      time: string;
      title: string;
      description: string;
      location: string;
      type: string;
      price: number;
      tips: string[];
    }>;
  }> {
    const itineraryMessages = messages.filter(m => 
      m.content.toString().includes('Day') || 
      m.content.toString().includes('TITLE:')
    );
    
    const itinerary: Array<{
      day: number;
      activities: Array<{
        id: string;
        day: number;
        time: string;
        title: string;
        description: string;
        location: string;
        type: string;
        price: number;
        tips: string[];
      }>;
    }> = [];

    let currentDay: number | null = null;
    let activities: Array<{
      id: string;
      day: number;
      time: string;
      title: string;
      description: string;
      location: string;
      type: string;
      price: number;
      tips: string[];
    }> = [];

    for (const message of itineraryMessages) {
      const content = message.content.toString();
      // Parse the content and build the itinerary structure
      // Add your parsing logic here
    }

    return itinerary;
  }

  private parseFlights(messages: BaseMessage[]) {
    // Parse messages to extract flight information
    const flightMessages = messages.filter(m => 
      m.content.toString().includes('airline') || 
      m.content.toString().includes('flight')
    );
    
    // Parse and format flight information
    return flightMessages.map(m => {
      // Add your flight parsing logic here
      return {
        airline: '',
        departure: '',
        arrival: '',
        price: '',
        duration: '',
        logo: '',
        bookingLink: ''
      };
    });
  }

  private parseHotels(messages: BaseMessage[]) {
    // Parse messages to extract hotel information
    const hotelMessages = messages.filter(m => 
      m.content.toString().includes('hotel') || 
      m.content.toString().includes('accommodation')
    );
    
    // Parse and format hotel information
    return hotelMessages.map(m => {
      // Add your hotel parsing logic here
      return {
        name: '',
        description: '',
        image: '',
        price: '',
        rating: 0,
        amenities: [],
        location: '',
        bookingLink: ''
      };
    });
  }
}

// Add interface for the response type
interface TravelPlanResponse {
  itinerary: Array<{
    day: number;
    activities: Array<{
      id: string;
      day: number;
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
} */