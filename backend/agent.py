import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_core.tools import tool, Tool
from serpapi import GoogleSearch
from dotenv import load_dotenv
import logging
import json
from datetime import datetime
from etl_processor import ETLProcessor
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Define data models
class TravelRequest(BaseModel):
    destination: str
    dateRange: dict
    groupSize: str
    budget: float
    interests: str
    departureLocation: str | None = None

class Activity(BaseModel):
    id: str
    day: int
    time: str
    title: str
    description: str
    location: str
    type: str
    price: float
    tips: List[str]

class TravelPlanResponse(BaseModel):
    itinerary: List[Dict[str, Any]]
    flights: Optional[List[Dict[str, Any]]]
    hotels: Optional[List[Dict[str, Any]]]

class AgentState(dict):
    """State definition for the agent."""
    messages: List[BaseMessage]

class Agent:
    def __init__(self):
        self.tools = [
            Tool(
                name="flights_finder",
                description="Search for flights using Google Flights via SerpAPI",
                func=self.flights_finder_func
            ),
            Tool(
                name="hotels_finder",
                description="Search for hotels using Google Hotels via SerpAPI",
                func=self.hotels_finder_func
            )
        ]
        
        self.llm = ChatOpenAI(
            temperature=0.7,
            model="gpt-4o"
        )
        
        # Define the workflow graph
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("plan_trip", self.plan_trip)
        workflow.add_node("search_travel", self.search_travel)
        workflow.add_node("create_itinerary", self.create_itinerary)
        
        # Add edges
        workflow.add_edge("plan_trip", "search_travel")
        workflow.add_edge("search_travel", "create_itinerary")
        workflow.add_edge("create_itinerary", END)
        
        # Set entry point
        workflow.set_entry_point("plan_trip")
        
        self.graph = workflow.compile()


    def flights_finder_func(self, query: dict) -> str:
        """Search for flights using Google Flights via SerpAPI"""
        try:
            # Validate required parameters
            required_params = ["departure_location", "destination", "outbound_date"]
            for param in required_params:
                if param not in query or not query[param]:
                    raise ValueError(f"Missing required parameter: {param}")
            
            # Convert locations to airport codes
            departure_code = self._get_airport_code(query["departure_location"])
            destination_code = self._get_airport_code(query["destination"])
            
            # Prepare API parameters according to documentation
            api_params = {
                "engine": "google_flights",
                "api_key": os.getenv("SERPAPI_API_KEY"),
                "departure_id": departure_code,
                "arrival_id": destination_code,
                "outbound_date": query["outbound_date"],
                "type": "1",  # 1 for round trip
                "currency": "USD",
                "hl": "en",
                "gl": "us",
                "adults": "2", 
                "include_airlines": "EK" # Default to 2 adults
            }
            
            # Add return date for round trip
            if "return_date" in query and query["return_date"]:
                api_params["return_date"] = query["return_date"]
            
            logging.info(f"Making flight API call with params: {api_params}")
            
            search = GoogleSearch(api_params)
            results = search.get_dict()
            logging.info(f"Complete raw SerpAPI flight response: {json.dumps(results, indent=2)}")
            if 'error' in results:
                logging.error(f"SerpAPI Flight Error: {results['error']}")
                return json.dumps({"error": results['error']})
                
            # Get both best flights and other flights
            all_flights = []
            if 'best_flights' in results:
                all_flights.extend(results['best_flights'])
            if 'other_flights' in results:
                all_flights.extend(results['other_flights'])
                
            # Modify this return statement to include all flight data
            return json.dumps({
                'status': 'success',
                'flights': [
                    {
                        **flight,  # Include all flight data
                        'departure_token': flight.get('departure_token'),  # Explicitly include departure_token
                        'booking_link': f"https://www.google.com/flights?hl=en#flt={flight.get('departure_token')}" if flight.get('departure_token') else None
                    }
                    for flight in all_flights
                ],
                'price_insights': results.get('price_insights', {})
            })
            
        except Exception as e:
            logging.error(f"Flight search error: {str(e)}")
            return json.dumps({"error": str(e)})

    def hotels_finder_func(self, query: dict) -> str:
        """Search for hotels using Google Hotels via SerpAPI"""
        try:
            # Validate required parameters
            required_params = ["location", "check_in_date", "check_out_date"]
            for param in required_params:
                if param not in query or not query[param]:
                    raise ValueError(f"Missing required parameter: {param}")
            
            # Prepare API parameters according to documentation
            api_params = {
                "engine": "google_hotels",
                "api_key": os.getenv("SERPAPI_API_KEY"),
                "q": query["location"],  # Location query
                "check_in_date": query["check_in_date"],
                "check_out_date": query["check_out_date"],
                "currency": "USD",
                "hl": "en",
                "gl": "us",
                "adults": "2",  # Default to 2 adults
                "hotel_class": "5"  # Sort by lowest price
            }
            
            logging.info(f"Making hotel API call with params: {api_params}")
            
            search = GoogleSearch(api_params)
            results = search.get_dict()
            
            if 'error' in results:
                logging.error(f"SerpAPI Hotel Error: {results['error']}")
                return json.dumps({"error": results['error']})
                
            # Get properties from results
            hotels = results.get('properties', [])
            
            # Format hotel results
            formatted_hotels = [{
                'name': hotel.get('name'),
                'description': hotel.get('description'),
                'price': hotel.get('rate_per_night', {}).get('lowest'),
                'rating': hotel.get('overall_rating'),
                'location': hotel.get('location', ''),
                'amenities': hotel.get('amenities', []),
                'images': hotel.get('images', []),
                'reviews': hotel.get('reviews'),
                'booking_link': hotel.get('link')
            } for hotel in hotels]
            
            return json.dumps({
                'status': 'success',
                'hotels': formatted_hotels
            })
            
        except Exception as e:
            logging.error(f"Hotel search error: {str(e)}")
            return json.dumps({"error": str(e)})

    def _get_airport_code(self, city: str) -> str:
        """Convert city name to IATA airport code"""
        # Common airport codes mapping
        airport_codes = {
            "london": "LHR",  # London Heathrow
            "paris": "CDG",   # Paris Charles de Gaulle
            "new york": "JFK", # New York JFK
            "tokyo": "HND",   # Tokyo Haneda
            "dubai": "DXB",   # Dubai International
            "singapore": "SIN", # Singapore Changi
            "bali": "DPS", # Bali Ngurah Rai
            "san francisco": "SFO", # San Francisco International
            "new delhi": "DEL", # Delhi Indira Gandhi International
            "delhi": "DEL",
            "mumbai": "BOM", # Mumbai Chhatrapati Shivaji International
            "beijing": "PEK", # Beijing Capital International
            "seoul": "ICN", # Seoul Incheon International
            "sydney": "SYD", # Sydney International
            "melbourne": "MEL", # Melbourne Airport
            "perth": "PER", # Perth International
            "brisbane": "BNE", # Brisbane International
            "canberra": "CBR", # Canberra International
            "adelaide": "ADL", # Adelaide Airport
            "gold coast": "OOL", # Gold Coast Airport
            "newcastle": "NTL", # Newcastle Airport
            "wollongong": "WOL", # Wollongong Airport
            "san diego": "SAN", # San Diego International
            "abu dhabi": "AUH", # Abu Dhabi International
            "amman": "AMM", # Amman Civil Airport
            "amsterdam": "AMS", # Amsterdam Airport Schiphol
            "antalya": "AYT", # Antalya Airport
            "athens": "ATH", # Athens International Airport
            "barcelona": "BCN", # Barcelona El Prat Airport
            "berlin": "BER", # Berlin Brandenburg Airport
            "birmingham": "BHX", # Birmingham Airport
            "brussels": "BRU", # Brussels Airport
            "bucharest": "OTP", # Bucharest Henri Coanda International Airport
            "budapest": "BUD", # Budapest Ferenc Liszt International Airport
            "copenhagen": "CPH", # Copenhagen Airport
            "dublin": "DUB", # Dublin Airport
            "edinburgh": "EDI", # Edinburgh Airport
            "frankfurt": "FRA", # Frankfurt Airport
            "geneva": "GVA", # Geneva Airport
            "glasgow": "GLA", # Glasgow Airport
            "helsinki": "HEL", # Helsinki Vantaa Airport
            "istanbul": "IST", # Istanbul Airport
            "jerusalem": "JRS", # Jerusalem Airport
            "kiev": "IEV", # Kiev Zhuliany International Airport
            "lisbon": "LIS", # Lisbon Portela Airport
            "london city": "LCY", # London City Airport
            "madrid": "MAD", # Madrid Barajas Airport
            "milan": "MXP", # Milan Malpensa Airport
            "munich": "MUC", # Munich Airport
        }
        
        city_lower = city.lower().strip()
        if city_lower in airport_codes:
            return airport_codes[city_lower]
        
        # If city not found in mapping, try to get it from SerpAPI location API
        try:
            locations = self.get_location(city, 1)
            if locations and len(locations) > 0:
                # Get the first airport result
                for location in locations:
                    if location.get("type") == "airport":
                        return location.get("iata_code", city.upper())
        except Exception as e:
            logging.error(f"Error getting airport code: {str(e)}")
        
        # If all else fails, return uppercase city name
        return city.upper()

    def get_location(self, query: str, limit: int = 1) -> List[Dict]:
        """Get location using SerpAPI Location API"""
        try:
            search = GoogleSearch({
                "engine": "google_flights",
                "api_key": os.getenv("SERPAPI_API_KEY"),
                "q": query,
                "limit": limit
            })
            locations = search.get_location()
            return locations
        except Exception as e:
            logging.error(f"Error in get_location: {str(e)}")
            return []

    def plan_trip(self, state: AgentState) -> AgentState:
        """Initial planning step"""
        try:
            messages = state.get("messages", [])
            last_message = messages[-1] if messages else None
            
            if isinstance(last_message, HumanMessage):
                # Add more specific instructions to force JSON output
                planning_prompt = SystemMessage(content="""You are Sayih, a Dubai travel planning assistant. 
                RESPOND ONLY WITH VALID JSON in the following format, no additional text or explanations:

                {
                    "budget_analysis": {
                        "total_budget": float,
                        "flight_cost": float,
                        "hotel_cost": float,
                        "remaining_budget": float
                    },
                    "daily_itinerary": [
                        {
                            "day": int,
                            "activities": [
                                {
                                    "time": "HH:MM AM/PM",
                                    "title": string,
                                    "description": string,
                                    "location": string,
                                    "area": string,
                                    "price": float,
                                    "tip": string,
                                    "category": string
                                }
                            ]
                        }
                    ]
                }""")

                messages.append(planning_prompt)
                
                try:
                    # Get response from OpenAI
                    response = self.llm.invoke(messages)
                    
                    # Log the raw response for debugging
                    logging.info(f"Raw OpenAI response: {response.content}")
                    
                    try:
                        # Try to clean the response if it contains markdown or extra text
                        content = response.content
                        # Look for JSON content between triple backticks if present
                        json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
                        if json_match:
                            content = json_match.group(1)
                        
                        # Remove any non-JSON text before or after
                        content = re.sub(r'^[^{]*', '', content)
                        content = re.sub(r'[^}]*$', '', content)
                        
                        # Parse the cleaned JSON
                        itinerary_json = json.loads(content)
                        
                        # Validate the structure
                        if not all(key in itinerary_json for key in ["budget_analysis", "daily_itinerary"]):
                            raise ValueError("Missing required top-level keys")
                        
                        # Return the validated JSON response
                        return {"messages": messages + [AIMessage(content=json.dumps(itinerary_json, ensure_ascii=False))]}
                        
                    except json.JSONDecodeError as je:
                        logging.error(f"JSON Parse Error: {str(je)}")
                        logging.error(f"Attempted to parse content: {content}")
                        raise
                        
                except Exception as e:
                    logging.error(f"Error generating itinerary: {str(e)}")
                    raise
                    
        except Exception as e:
            logging.error(f"Error in plan_trip: {str(e)}")
            
            # Return a fallback JSON response
            fallback_json = {
                "budget_analysis": {
                    "total_budget": float(state.get("budget", 0)),
                    "flight_cost": 0.0,
                    "hotel_cost": 0.0,
                    "remaining_budget": float(state.get("budget", 0))
                },
                "daily_itinerary": [
                    {
                        "day": 1,
                        "activities": [
                            {
                                "time": "09:00 AM",
                                "title": "Start of Day",
                                "description": "We're preparing your Dubai itinerary",
                                "location": "Dubai International Airport",
                                "area": "Airport Area",
                                "price": 0.0,
                                "tip": "Please try again to get a complete Dubai itinerary",
                                "category": "Transport"
                            }
                        ]
                    }
                ]
            }
            
            return {"messages": state["messages"] + [AIMessage(content=json.dumps(fallback_json, ensure_ascii=False))]}

    def search_travel(self, state: AgentState) -> AgentState:
        """Search for flights and hotels to Dubai"""
        try:
            messages = state.get("messages", [])
            
            # Extract travel details from the last message
            for msg in reversed(messages):
                if isinstance(msg, HumanMessage):
                    content = msg.content
                    logging.info(f"Processing message content: {content}")
                    
                    try:
                        # Extract group size from content using regex
                        group_pattern = r"Group Size:\s*([^\n]+)"
                        group_match = re.search(group_pattern, content)
                        group_size = group_match.group(1).strip().lower() if group_match else "solo"
                        
                        # Set adults and children based on group size
                        if group_size == "solo":
                            adults = 1
                            children = 0
                            children_ages = None
                        elif group_size == "couple":
                            adults = 2
                            children = 0
                            children_ages = None
                        elif group_size == "family":
                            adults = 2
                            children = 1
                            children_ages = "11"  # Set child age to 11
                        elif group_size == "group":
                            adults = 6
                            children = 0
                            children_ages = None
                        else:
                            logging.warning(f"Unknown group size: {group_size}, defaulting to 1 adult")
                            adults = 1
                            children = 0
                            children_ages = None
                        
                        logging.info(f"Set passengers to: {adults} adults, {children} children")
                        
                        # Extract dates using regex
                        date_pattern = r"Dates:\s*(\d{4}-\d{2}-\d{2})\s*to\s*(\d{4}-\d{2}-\d{2})"
                        date_match = re.search(date_pattern, content)
                        if not date_match:
                            raise ValueError("Could not extract dates from message")
                        
                        outbound_date = date_match.group(1)
                        return_date = date_match.group(2)
                        
                        # Extract departure location (destination is always Dubai)
                        from_pattern = r"From:\s*([^\n]+)"
                        departure = re.search(from_pattern, content)
                        
                        if not departure:
                            raise ValueError("Could not extract departure location from message")
                        
                        departure = departure.group(1).strip()
                        destination = "Dubai"  # Always set to Dubai
                        
                        # Search for flights with group size parameters
                        flight_results = self.flights_finder_func({
                            "departure_location": departure,
                            "destination": destination,
                            "outbound_date": outbound_date,
                            "return_date": return_date,
                            "type": "1",  # Round trip
                            "include_airlines": "EK",  # Prefer Emirates Airlines
                            "adults": str(adults),
                            "children": str(children)
                        })
                        
                        # Search for Dubai hotels with group size parameters
                        hotel_results = self.hotels_finder_func({
                            "location": "Dubai",
                            "check_in_date": outbound_date,
                            "check_out_date": return_date,
                            "adults": str(adults),
                            "children": str(children),
                            "children_ages": children_ages if children > 0 else None,
                            "hotel_class": "5"  # Dubai luxury hotels
                        })
                        
                        # Add results to messages
                        messages.extend([
                            AIMessage(content=f"Flight Options:\n{flight_results}"),
                            AIMessage(content=f"Hotel Recommendations:\n{hotel_results}")
                        ])
                        
                        return {"messages": messages}
                        
                    except Exception as e:
                        logging.error(f"Error in search_travel: {str(e)}")
                        raise
                    
            return {"messages": messages}
            
        except Exception as e:
            logging.error(f"Error in search_travel: {str(e)}")
            return {"messages": state["messages"]}

    def create_itinerary(self, state: AgentState) -> AgentState:
        """Create final Dubai itinerary"""
        try:
            messages = state.get("messages", [])
            
            # Create a Dubai-specific prompt for the final itinerary
            prompt = SystemMessage(content="""Based on the flight and hotel data provided, create a detailed Dubai itinerary.
            Focus on:
            1. Popular Dubai attractions (Burj Khalifa, Dubai Mall, Palm Jumeirah, etc.)
            2. Local cultural experiences (Gold Souk, Al Fahidi, etc.)
            3. Modern entertainment (Dubai Frame, Museum of the Future, etc.)
            4. Luxury experiences (Desert safaris, yacht tours, etc.)
            
            Format the response as valid JSON only:
            {
                "budget_analysis": {
                    "total_budget": float,
                    "flight_cost": float,
                    "hotel_cost": float,
                    "remaining_budget": float
                },
                "daily_itinerary": [
                    {
                        "day": int,
                        "activities": [
                            {
                                "time": "HH:MM AM/PM",
                                "title": string,
                                "description": string,
                                "location": string,
                                "area": string,
                                "price": float,
                                "tip": string,
                                "category": string
                            }
                        ]
                    }
                ]
            }
            
            Important:
            1. Include practical tips about dress code, customs, and weather
            2. Consider prayer times and Ramadan if applicable
            3. Account for Dubai's climate in activity planning
            4. Include transportation recommendations
            5. Suggest dining options for each day
            """)
            
            try:
                # Get response from OpenAI
                response = self.llm.invoke(messages + [prompt])
                
                # Try to parse the response as JSON
                try:
                    content = response.content
                    # Clean up the response if needed
                    json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
                    if json_match:
                        content = json_match.group(1)
                    
                    content = re.sub(r'^[^{]*', '', content)
                    content = re.sub(r'[^}]*$', '', content)
                    
                    # Parse and validate the JSON
                    itinerary_json = json.loads(content)
                    
                    if not all(key in itinerary_json for key in ["budget_analysis", "daily_itinerary"]):
                        raise ValueError("Missing required top-level keys")
                    
                    return {"messages": messages + [AIMessage(content=json.dumps(itinerary_json, ensure_ascii=False))]}
                    
                except json.JSONDecodeError as e:
                    logging.error(f"Error parsing itinerary JSON: {e}")
                    logging.error(f"Problematic content: {content}")
                    raise
                    
            except Exception as e:
                logging.error(f"Error in create_itinerary: {e}")
                raise
                
        except Exception as e:
            logging.error(f"Error in create_itinerary: {str(e)}")
            
            # Return a fallback JSON response
            fallback_json = {
                "budget_analysis": {
                    "total_budget": 0.0,
                    "flight_cost": 0.0,
                    "hotel_cost": 0.0,
                    "remaining_budget": 0.0
                },
                "daily_itinerary": [
                    {
                        "day": 1,
                        "activities": [
                            {
                                "time": "09:00 AM",
                                "title": "Start of Day",
                                "description": "We're preparing your Dubai itinerary",
                                "location": "Dubai International Airport",
                                "area": "Airport Area",
                                "price": 0.0,
                                "tip": "Please try again to get a complete Dubai itinerary",
                                "category": "Transport"
                            }
                        ]
                    }
                ]
            }
            
            return {"messages": state["messages"] + [AIMessage(content=json.dumps(fallback_json, ensure_ascii=False))]}

    def _extract_departure(self, content: str) -> str:
        """Extract departure location from message content"""
        departure_match = re.search(r"From:\s*([^\n]+)", content)
        return departure_match.group(1).strip() if departure_match else None

    def _extract_destination(self, content: str) -> str:
        """Extract destination from message content"""
        destination_match = re.search(r"To:\s*([^\n]+)", content)
        return destination_match.group(1).strip() if destination_match else None

    def _extract_dates(self, content: str) -> tuple:
        """Extract dates from message content"""
        dates_match = re.search(r"Dates:\s*(\d{4}-\d{2}-\d{2})\s*to\s*(\d{4}-\d{2}-\d{2})", content)
        return (dates_match.group(1), dates_match.group(2)) if dates_match else None

    async def plan_travel(self, request: TravelRequest) -> Dict[str, Any]:
        """Main method to handle travel planning requests"""
        try:
            # Format the input message
            input_message = self._format_travel_request(request)
            
            # Initialize state with the input message
            initial_state = {
                "messages": [HumanMessage(content=input_message)]
            }
            
            # Run the graph with the initial state
            result = await self.graph.ainvoke(initial_state)
            
            # Process the final messages to extract structured data
            final_result = self._process_final_result(result)
            
            return final_result
            
        except Exception as e:
            logging.error(f"Error in plan_travel: {str(e)}")
            raise

    def _format_travel_request(self, request: TravelRequest) -> str:
        """Format the travel request into a structured message"""
        departure = request.departureLocation or "Unknown"
        return f"""
        From: {departure}
        To: {request.destination}
        Dates: {request.dateRange['from']} to {request.dateRange['to']}
        Group Size: {request.groupSize}
        Budget: ${request.budget}
        Interests: {request.interests}
        """

    def _process_final_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Process the final result from the graph into structured data"""
        try:
            messages = result.get("messages", [])
            
            # Parse flights from messages
            flights = []
            flight_message = next((msg for msg in messages 
                if isinstance(msg, AIMessage) and "Flight Options:" in msg.content), None)
            if flight_message:
                try:
                    flight_json = flight_message.content.split('Flight Options:\n')[1]
                    flight_data = json.loads(flight_json)
                    flights = flight_data.get('flights', [])
                except Exception as e:
                    logging.error(f"Error parsing flights: {e}")

            # Parse hotels from messages
            hotels = []
            hotel_message = next((msg for msg in messages 
                if isinstance(msg, AIMessage) and "Hotel Recommendations:" in msg.content), None)
            if hotel_message:
                try:
                    hotel_json = hotel_message.content.split('Hotel Recommendations:\n')[1]
                    hotel_data = json.loads(hotel_json)
                    hotels = hotel_data.get('hotels', [])
                except Exception as e:
                    logging.error(f"Error parsing hotels: {e}")

            # Get the itinerary from the assistant's JSON response
            itinerary_message = next((msg for msg in messages 
                if isinstance(msg, AIMessage) and "budget_analysis" in msg.content), None)
            
            if itinerary_message:
                try:
                    # Parse the JSON content
                    content = json.loads(itinerary_message.content)
                    
                    # Format the itinerary from the JSON structure
                    itinerary = []
                    if "daily_itinerary" in content:
                        itinerary = [{
                            "day": day["day"],
                            "activities": [{
                                "id": f"{day['day']}-{i}",
                                "day": day["day"],
                                "time": activity["time"],
                                "title": activity["title"],
                                "description": activity["description"],
                                "location": activity["location"],
                                "area": activity.get("area", self.get_dubai_area(activity["location"])),
                                "type": activity.get("category", self._determine_activity_type(activity["title"])),
                                "price": float(activity["price"]),
                                "tips": [activity.get("tip", "")]
                            } for i, activity in enumerate(day["activities"])]
                        } for day in content["daily_itinerary"]]
                    
                    logging.info(f"Processed itinerary: {json.dumps(itinerary, indent=2)}")
                    
                    return {
                        "itinerary": itinerary,
                        "flights": flights,
                        "hotels": hotels,
                        "messages": [{
                            "role": "assistant" if isinstance(msg, AIMessage) else "user",
                            "content": msg.content
                        } for msg in messages]
                    }
                    
                except json.JSONDecodeError as e:
                    logging.error(f"Error parsing itinerary JSON: {e}")
                    logging.error(f"Problematic content: {itinerary_message.content}")
                    
            return {
                "itinerary": [],
                "flights": flights,
                "hotels": hotels,
                "messages": [{
                    "role": "assistant" if isinstance(msg, AIMessage) else "user",
                    "content": msg.content
                } for msg in messages]
            }
                
        except Exception as e:
            logging.error(f"Error in _process_final_result: {str(e)}")
            return {
                "itinerary": [],
                "flights": [],
                "hotels": [],
                "messages": []
            }

    def _extract_location(self, description: str) -> str:
        """Extract location from activity description"""
        # Look for common location indicators
        location_patterns = [
            r'at\s+([^,.]+)',
            r'in\s+([^,.]+)',
            r'to\s+([^,.]+)',
            r'visit\s+([^,.]+)'
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return ""

    def _determine_activity_type(self, description: str) -> str:
        """Determine activity type based on description"""
        type_keywords = {
            'meal': ['breakfast', 'lunch', 'dinner', 'restaurant', 'dining'],
            'sightseeing': ['visit', 'explore', 'tour', 'see'],
            'shopping': ['shop', 'market', 'store'],
            'transport': ['depart', 'arrive', 'check-in', 'check-out'],
            'cultural': ['temple', 'shrine', 'museum', 'ceremony'],
            'nature': ['park', 'garden', 'mountain', 'forest']
        }
        
        description_lower = description.lower()
        for activity_type, keywords in type_keywords.items():
            if any(keyword in description_lower for keyword in keywords):
                return activity_type
        return 'activity'

    def _validate_date_format(self, date_str: str) -> bool:
        """Validate that a date string is in YYYY-MM-DD format"""
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
            return True
        except ValueError:
            return False

    def format_flights_for_context(self, flights):
        """Format flight details for Dubai context"""
        if not flights:
            return "No flights selected yet."
        
        formatted = []
        for flight in flights[:3]:  # Show only first 3 options
            departure_time = flight.get('departure_airport', {}).get('time', '')
            arrival_time = flight.get('arrival_airport', {}).get('time', '')
            airline = flight.get('airline', '')
            price = flight.get('price', {}).get('total', 0)
            
            formatted.append(
                f"- {airline} flight: "
                f"{departure_time} → {arrival_time} "
                f"(${price:,.2f})"
            )
        
        return "\n".join(formatted)

    def format_hotels_for_context(self, hotels):
        """Format hotel details for Dubai context"""
        if not hotels:
            return "No hotels selected yet."
        
        formatted = []
        for hotel in hotels[:3]:  # Show only first 3 options
            name = hotel.get('name', '')
            area = self.get_dubai_area(hotel.get('location', ''))
            price = hotel.get('price', 0)
            rating = hotel.get('rating', '')
            
            formatted.append(
                f"- {name} ({area}): "
                f"{rating} stars, "
                f"${price:,.2f} per night"
            )
        
        return "\n".join(formatted)

    def get_dubai_area(self, location: str) -> str:
        """Map location to Dubai area/district"""
        dubai_areas = {
            "burj khalifa": "Downtown Dubai",
            "dubai mall": "Downtown Dubai",
            "palm jumeirah": "Palm Jumeirah",
            "burj al arab": "Jumeirah",
            "gold souk": "Deira",
            "dubai marina": "Dubai Marina",
            "dubai frame": "Zabeel",
            "dubai creek": "Deira",
            "jumeirah beach": "Jumeirah",
            "mall of emirates": "Al Barsha",
            "dubai miracle garden": "Al Barsha South",
            "global village": "Dubailand",
            "dubai opera": "Downtown Dubai",
            "city walk": "Al Wasl",
            "la mer": "Jumeirah",
            "dubai water canal": "Business Bay",
            "dubai design district": "Business Bay",
            "dubai international airport": "Airport Area",
            "ibn battuta mall": "Jebel Ali",
            "dubai festival city": "Festival City"
        }
        
        if not location:
            return "Dubai"
            
        location_lower = location.lower()
        for key, area in dubai_areas.items():
            if key in location_lower:
                return area
        return "Dubai"

    def format_itinerary_for_context(self, itinerary: list) -> str:
        try:
            formatted_days = []
            for day in itinerary:
                if isinstance(day, dict):
                    day_number = day.get("day", "Unknown")
                    activities = day.get("activities", [])
                    activity_texts = []
                    
                    for activity in activities:
                        if isinstance(activity, dict):
                            time = activity.get("time", "")
                            title = activity.get("title", "")
                            location = activity.get("location", "")
                            activity_texts.append(f"- {time}: {title} at {location}")
                    
                    formatted_days.append(f"Day {day_number}:\n" + "\n".join(activity_texts))
            
            return "\n\n".join(formatted_days)
        except Exception as e:
            logging.error(f"Error formatting itinerary: {str(e)}")
            return "Itinerary details not available"

    def format_flights_for_context(self, flights: list) -> str:
        try:
            if not flights:
                return "No flight details available"
                
            formatted_flights = []
            for flight in flights:
                if isinstance(flight, dict):
                    airline = flight.get("airline", "Unknown")
                    departure = flight.get("departure", "")
                    arrival = flight.get("arrival", "")
                    price = flight.get("price", "")
                    formatted_flights.append(f"- {airline}: {departure} to {arrival} ({price})")
            
            return "\n".join(formatted_flights)
        except Exception as e:
            logging.error(f"Error formatting flights: {str(e)}")
            return "Flight details not available"

    def format_hotels_for_context(self, hotels: list) -> str:
        try:
            if not hotels:
                return "No hotel details available"
                
            formatted_hotels = []
            for hotel in hotels:
                if isinstance(hotel, dict):
                    name = hotel.get("name", "Unknown")
                    price = hotel.get("price", "")
                    rating = hotel.get("rating", "")
                    formatted_hotels.append(f"- {name} ({rating}★) - {price}")
            
            return "\n".join(formatted_hotels)
        except Exception as e:
            logging.error(f"Error formatting hotels: {str(e)}")
            return "Hotel details not available"

    def clean_markdown_formatting(self, text: str) -> str:
        """Remove markdown formatting from text."""
        # Remove bold formatting
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
        # Remove italic formatting
        text = re.sub(r'\*(.*?)\*', r'\1', text)
        # Remove bullet points
        text = re.sub(r'^\s*[-•]\s*', '', text, flags=re.MULTILINE)
        return text

# Initialize the agent
agent = Agent()

@app.post("/api/travel/plan")
async def plan_travel(request: TravelRequest) -> Dict[str, Any]:
    logging.info(f"Received travel plan request: {request}") 
    try:
        result = await agent.plan_travel(request)
        
        # Ensure we always have a valid response structure
        return {
            "itinerary": result.get("itinerary", []),
            "flights": result.get("flights", []),
            "hotels": result.get("hotels", []),
            "messages": result.get("messages", [{"role": "assistant", "content": ""}])
        }
    except Exception as e:
        logging.error(f"Error in plan_travel endpoint: {str(e)}")
        # Return a structured error response
        return {
            "error": str(e),
            "itinerary": [],
            "flights": [],
            "hotels": [],
            "messages": [{"role": "assistant", "content": "Error generating travel plan"}]
        } 

@app.post("/api/chat")
async def chat(request: dict):
    try:
        message = request.get("message")
        context = request.get("context", {})
        
        # Format weather information
        weather_info = ""
        if context.get('weather'):
            weather_info = "Weather during your stay:\n"
            for day in context.get('weather', []):
                date = day.get('date', '')
                temp = day.get('temperature', '')
                humidity = day.get('humidity', '')
                weather_info += f"- {date}: {temp}°C, {humidity}% humidity\n"
        
        # Create a Dubai-specific system message using agent methods
        system_message = f"""You are Sayih, a friendly and knowledgeable Dubai tourism assistant. You have extensive expertise about Dubai's attractions, culture, and practical travel information. You represent the Dubai Department of Economy and Tourism.

        Current Trip Context:
        - Travel Dates: {context.get('dateRange', {})}
        - Group Size: {context.get('groupSize', '')}
        - Budget: ${context.get('budget', 0)} per day
        - Interests: {context.get('interests', '')}
        
        {weather_info}
        
        Planned Itinerary:
        {agent.format_itinerary_for_context(context.get('itinerary', []))}
        
        Selected Flights:
        {agent.format_flights_for_context(context.get('flights', []))}
        
        Hotel Options:
        {agent.format_hotels_for_context(context.get('hotels', []))}

        Guidelines:
        1. Always maintain a warm, professional tone
        2. Provide accurate information about Dubai's attractions and customs
        3. Share cultural insights and local etiquette tips
        4. Recommend activities based on weather and seasonal events
        5. Include practical tips about transportation, dress code, and local customs
        6. Reference specific Dubai locations and landmarks
        7. Mention relevant Dubai initiatives and tourism programs when appropriate
        8. Provide information about current events and festivals when relevant
        """
        
        # Create chat completion using OpenAI
        chat = ChatOpenAI(
            temperature=0.7,
            model="gpt-4o"
        )
        
        # Get response from OpenAI
        response = chat.invoke([
            SystemMessage(content=system_message),
            HumanMessage(content=message)
        ])
        
        # Clean the response before sending
        cleaned_response = agent.clean_markdown_formatting(response.content)
        
        return {
            "message": cleaned_response,
            "status": "success"
        }
        
    except Exception as e:
        logging.error(f"Error in chat endpoint: {str(e)}")
        return {
            "error": str(e),
            "message": "I apologize, but I encountered an error. Please try again.",
            "status": "error"
        } 

@app.post("/store_interaction")
async def store_interaction(data: dict):
    try:
        etl = ETLProcessor()
        etl.store_interaction(data)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 