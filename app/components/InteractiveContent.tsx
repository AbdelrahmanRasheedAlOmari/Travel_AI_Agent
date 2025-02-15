'use client'

import * as React from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { CheckIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';



declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

import { 
  Clock, 
  MapPin, 
  Utensils, 
  Palmtree, 
  Camera, 
  Car, 
  Ticket, 
  Send, 
  Globe, 
  User, 
  CalendarIcon, 
  Cloud, 
  Sun, 
  Droplets, 
  RefreshCw, 
  Star, 
  ChevronRight, 
  CalendarPlus, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  DollarSign, 
  Percent,
  Cloud as CloudRain,
  MoonStar,
  TriangleAlert,
  Wifi,
  Waves,
  Sparkles,
  Wine,
  ChefHat,
  Shirt,
  Check,
  Wind,
  Dumbbell,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Thermometer,
  Gauge,
  Compass,
  ChevronDown,
  Calendar,
  Plane,
  Leaf,
  AlertTriangle,
  Moon,
  AlertCircle,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Heart,
} from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { format, addDays, isToday, differenceInDays } from "date-fns"
import { createEvents } from 'ics'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { DateRange, RangeKeyDict } from 'react-date-range';
import { enUS } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import ItineraryMap from './ItineraryMap';
// import { TravelAgent } from '@/lib/agents/travelAgent';

// Add these imports at the top of the file
import { useRouter } from 'next/navigation';
import LanguageSelector from './LanguageSelector';

// Add this to the head of your file with other imports
import Script from 'next/script'

// Interfaces
interface Activity {
  id: string;
  day: number;
  time: string;
  title: string;
  description: string;
  location?: string;
  type?: string;
  price: number | string;
  tips: string[];
}

interface DayPlan {
  day: number
  activities: Activity[]
}

interface MessageOptions {
  type: 'destination' | 'dateRange' | 'group-size' | 'budget' | 'interests' | 'departure';
  data?: Array<{
    label: string;
    icon: string | React.ReactNode;
    description: string;
    color?: string;
    component?: React.ReactNode;
  }>;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  options?: MessageOptions;
  translationKey?: string;
  translationParams?: Record<string, any>;
}

interface Weather {
  date: Date;
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy';
  humidity: number;
  description: string;
  icon: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  };
}

interface InterestOption {
  label: string;
  icon: string | React.ReactNode;
  description: string;
  color?: string;
  component?: React.ReactNode;
  category: string;
}

interface Hotel {
  id?: string;
  name: string;
  description: string;
  image?: string;
  price: string;
  rating: number;
  amenities: string[];
  location?: string;
  images?: Array<{
    thumbnail: string;
    original_image: string;
  }>;
  reviews?: number | null;
  booking_link?: string;
}

interface AgencyConfig {
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  destinations: string[];
}

interface CalendarEvent {
  start: [number, number, number, number, number];
  duration: { hours: number };
  title: string;
  description: string;
  location: string;
}

interface Tip {
  id: string;
  title: string;
  description: string;
  category: string;
  items: TipItem[];
}


interface Flight {
  id?: string;
  airline: string;
  airline_logo: string;
  flights: Array<{
    airline: string;
    flight_number: string;
    airplane: string;
    travel_class: string;
    legroom?: string;
    duration: number;
    departure_airport: {
      name: string;
      id: string;
      time: string;
    };
    arrival_airport: {
      name: string;
      id: string;
      time: string;
    };
    extensions?: string[];
    overnight?: boolean;
    often_delayed_by_over_30_min?: boolean;
  }>;
  total_duration: number;
  carbon_emissions: {
    this_flight: number;
    typical_for_this_route: number;
    difference_percent: number;
  };
  price: string;
  type: string;
  booking_link?: string;
  departure?: string;
  arrival?: string;
  duration?: string;
  booking_options?: BookingOption[];
}

interface DayItinerary {
  day: number;
  activities: Activity[];
}


// Add this type at the top of your file
interface TravelPlan {
  itinerary: string | { day: number; activities: (string | Activity)[] }[];
  flights?: Flight[];
  hotels?: Hotel[];
  messages?: Array<{ role: string; content: string }>;
}

// Add this interface near your other interfaces at the top of the file
interface AssistantMessage {
  role: 'assistant' | 'user';
  content: string;
}

const FlightBookingOptions = ({ options, onSelect }: { 
  options: BookingOption[]; 
  onSelect: (option: BookingOption) => void; 
}) => {
  return (
    <div className="mt-4 space-y-4">
      {options?.map((option, index) => (
        <div 
          key={index}
          className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
          onClick={() => onSelect(option)}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">{option.option_title}</h3>
              <span className="text-sm text-gray-600">Book with {option.book_with}</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">${option.price}</div>
              {option.local_prices?.[0] && (
                <div className="text-sm text-gray-500">
                  {option.local_prices[0].price} {option.local_prices[0].currency}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            {option.extensions.map((ext, i) => (
              <div key={i} className="flex items-center text-sm">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                {ext}
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            {option.baggage_prices.map((baggage, i) => (
              <div key={i} className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                {baggage}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Mock Data
const agencyConfig: AgencyConfig = {
  name: "Sayih AI",
  logo: "/images/sayih-avatar.png", // Make sure this path is correct
  primaryColor: "#C5A059",
  secondaryColor: "#ffffff",
  destinations: ["Downtown Dubai", "Palm Jumeirah", "Dubai Marina", "Old Dubai", "Dubai Creek"]
}

const hotels: Hotel[] = [
  {
    id: "1",
    name: "Burj Al Arab Jumeirah",
    description: "Experience unparalleled luxury in Dubai's iconic sail-shaped hotel with stunning views of the Arabian Gulf.",
    image: "https://example.com/burj-al-arab.jpg",
    rating: 5,
    price: "AED 5,000/night",
    amenities: ["Private Beach", "Spa", "Helipad", "9 Restaurants", "Butler Service"]
  },
  {
    id: "2",
    name: "Atlantis, The Palm",
    description: "A majestic resort featuring the Aquaventure Waterpark and underwater suites with views of marine life.",
    image: "https://example.com/atlantis.jpg",
    rating: 5,
    price: "AED 2,500/night",
    amenities: ["Waterpark Access", "Marine Activities", "Private Beach", "Celebrity Restaurants"]
  },
  {
    id: "3",
    name: "Address Downtown",
    description: "Luxury hotel in the heart of Downtown Dubai with spectacular views of Burj Khalifa.",
    image: "https://example.com/address.jpg",
    rating: 5,
    price: "AED 1,800/night",
    amenities: ["Infinity Pool", "Spa", "Multiple Restaurants", "Direct Mall Access"]
  },
]

// Update the tips data with service logos
const tips = [
  {
    id: "1",
    title: "Cultural Etiquette",
    description: "Important customs and practices to respect in Dubai",
    category: "culture",
    logo: "/images/culture.svg",
    items: [
      {
        description: "Dress modestly in public places, especially religious sites",
      },
      {
        description: "Public displays of affection should be minimal",
      },
      {
        description: "Ask permission before photographing people",
      },
      {
        description: "During Ramadan, avoid eating, drinking, or smoking in public during daylight hours",
      }
    ]
  },
  {
    id: "2",
    title: "Getting Around Dubai",
    description: "Transportation options and services",
    category: "transport",
    logo: "/images/transport.svg",
    services: [
      {
        name: "RTA Dubai Metro & Bus",
        logo: "/images/rta-logo.png",
        description: "Public transportation system including metro, buses, and water taxis"
      },
      {
        name: "Uber",
        logo: "/images/uber-logo.png",
        description: "Ride-hailing service available throughout Dubai"
      },
      {
        name: "Careem",
        logo: "/images/careem-logo.png",
        description: "Local ride-hailing service with multiple vehicle options"
      }
    ],
    items: [
      {
        description: "The Dubai Metro is clean, efficient, and has dedicated Gold Class and Women & Children sections",
      },
      {
        description: "Water taxis and abras offer scenic transport across Dubai Creek",
      }
    ]
  },
  {
    id: "3",
    title: "Food Delivery Services",
    description: "Popular food delivery platforms",
    category: "food",
    logo: "/images/food.svg",
    services: [
      {
        name: "Deliveroo",
        logo: "/images/deliveroo-logo.png",
        description: "Premium restaurant delivery service"
      },
      {
        name: "Talabat",
        logo: "/images/talabat-logo.png",
        description: "Wide range of restaurants and quick delivery"
      }
    ],
    items: [
      {
        description: "Most restaurants offer delivery through multiple platforms",
      },
      {
        description: "Delivery is available late into the night in many areas",
      }
    ]
  }
];

// Define interfaces for our tip structures
interface Service {
  name: string;
  logo: string;
  description: string;
}

interface TransportItem {
  name: string;
  description: string;
}

interface TipItem {
  id: string;
  title: string;
  description: string;
  type?: 'basic' | 'service' | 'transport';
  logo?: string;  // Add this line to support the RTA logo
  services?: Service[];
  items?: TransportItem[];
}

interface TipCategory {
  id: string;
  title: string;
  description: string;
  category: string;
  items: TipItem[];
}

// Helper Components
function WeatherDisplay({ weather }: { weather: Weather[] }) {
  const [selectedDate, setSelectedDate] = React.useState<string>('');
  
  // Group weather data by date
  const weatherByDate = React.useMemo(() => {
    const grouped = weather.reduce((acc, item) => {
      const date = format(new Date(item.date), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, Weather[]>);
    
    // Set initial selected date
    if (!selectedDate && Object.keys(grouped).length > 0) {
      setSelectedDate(Object.keys(grouped)[0]);
    }
    
    return grouped;
  }, [weather]);

  const getWeatherIcon = (condition: string | undefined) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="h-6 w-6 text-yellow-500" />
      case 'cloudy':
        return <Cloud className="h-6 w-6 text-gray-500" />
      case 'rainy':
        return <CloudRain className="h-6 w-6 text-blue-500" />
      default:
        return <Sun className="h-6 w-6 text-yellow-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#C5A059] scrollbar-track-transparent">
        {Object.keys(weatherByDate).map((date) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`flex-shrink-0 px-4 py-2 rounded-full transition-all ${
              selectedDate === date 
                ? 'bg-[#C5A059] text-white' 
                : 'bg-white/50 hover:bg-white text-gray-600'
            }`}
          >
            {format(new Date(date), 'EEE, MMM d')}
          </button>
        ))}
      </div>

      {/* Selected date weather details */}
      {selectedDate && weatherByDate[selectedDate] && (
        <div className="space-y-4">
          {/* Daily overview */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {format(new Date(selectedDate), 'EEEE, MMMM d')}
                </h3>
                <p className="text-sm text-gray-500">
                  {weatherByDate[selectedDate][0].weather.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#C5A059]">
                  {Math.round(weatherByDate[selectedDate][0].main.temp)}°C
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ArrowUp className="h-4 w-4" />
                  {Math.round(weatherByDate[selectedDate][0].main.temp_max)}°C
                  <ArrowDown className="h-4 w-4" />
                  {Math.round(weatherByDate[selectedDate][0].main.temp_min)}°C
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <Droplets className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-sm text-gray-600">Humidity</p>
                <p className="font-semibold">{weatherByDate[selectedDate][0].main.humidity}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <Thermometer className="h-5 w-5 mx-auto mb-1 text-red-500" />
                <p className="text-sm text-gray-600">Feels Like</p>
                <p className="font-semibold">{Math.round(weatherByDate[selectedDate][0].main.feels_like)}°C</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <Gauge className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                <p className="text-sm text-gray-600">Pressure</p>
                <p className="font-semibold">{weatherByDate[selectedDate][0].main.pressure} hPa</p>
              </div>
            </div>
          </div>

          {/* Hourly forecast */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h4 className="text-lg font-semibold mb-4">Hourly Forecast</h4>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {weatherByDate[selectedDate].map((item, index) => (
                <div 
                  key={index}
                  className="flex-shrink-0 text-center p-3 bg-gray-50 rounded-lg w-24"
                >
                  <p className="text-sm text-gray-500">
                    {format(new Date(item.date), 'HH:mm')}
                  </p>
                  <div className="my-2">
                    {getWeatherIcon(item.condition)}
                  </div>
                  <p className="font-semibold">{Math.round(item.main.temp)}°C</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TypingAnimation() {
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-[#C5A059] rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  )
}

function HotelSuggestion({ hotel, onSuggestAnother }: { hotel: Hotel; onSuggestAnother: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-3xl shadow-lg overflow-hidden"
    >
      <div className="relative h-64">
        <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white mb-2">{hotel.name}</h3>
          <div className="flex items-center space-x-2">
            {Array.from({ length: hotel.rating }).map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
          </div>
        </div>
      </div>
      <div className="p-6">
        <p className="text-gray-600 mb-4">{hotel.description}</p>
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Amenities:</h4>
          <ul className="list-disc list-inside">
            {hotel.amenities.map((amenity, index) => (
              <li key={index} className="text-sm text-gray-600">{amenity}</li>
            ))}
          </ul>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-black">{hotel.price}</span>
          <Button 
            onClick={onSuggestAnother} 
            className="bg-black hover:bg-gray-800 text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Suggest Another
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// First, update the HotelImageGallery component
const HotelImageGallery = ({ hotel, index }: { hotel: Hotel; index: number }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [imageErrors, setImageErrors] = React.useState<{ [key: string]: boolean }>({});
  const galleryId = `hotel-${index}`;

  const handleImageError = (imageIndex: number) => {
    setImageErrors(prev => ({
      ...prev,
      [imageIndex]: true
    }));
  };

  const getImageUrl = (image: { thumbnail: string; original_image: string }, isThumb: boolean = false) => {
    if (imageErrors[currentIndex] || !image) {
      return '/images/hotel-placeholder.jpg'; // Fallback image
    }
    return isThumb ? image.thumbnail : (image.original_image || image.thumbnail);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % (hotel.images?.length || 1));
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + (hotel.images?.length || 1)) % (hotel.images?.length || 1));
  };

  if (!hotel.images || hotel.images.length === 0) {
    return (
      <div className="relative px-6">
        <div className="relative h-[400px] w-full overflow-hidden rounded-lg">
          <img
            src="/images/hotel-placeholder.jpg"
            alt={`${hotel.name} placeholder`}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-6">
      <div className="relative h-[400px] w-full overflow-hidden rounded-lg">
        <img
          src={getImageUrl(hotel.images[currentIndex])}
          alt={`${hotel.name} view`}
          className="w-full h-full object-cover"
          onError={() => handleImageError(currentIndex)}
          loading="lazy"
        />
        
        {hotel.images.length > 1 && (
          <>
            <div className="absolute inset-0 flex items-center justify-between p-4">
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 rounded-full bg-white/70 hover:bg-white/90 backdrop-blur-sm flex items-center justify-center"
                onClick={handlePrevImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 rounded-full bg-white/70 hover:bg-white/90 backdrop-blur-sm flex items-center justify-center"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <span className="text-white text-sm">
                {currentIndex + 1} / {hotel.images.length}
              </span>
            </div>
            
            <div className="absolute bottom-4 left-4 right-20 overflow-x-auto">
              <div className="flex gap-2">
                {hotel.images.map((image, i) => (
                  <button
                    key={`${galleryId}-thumb-${i}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentIndex(i);
                    }}
                    className={`flex-none w-16 h-16 rounded-lg overflow-hidden transition-all ${
                      i === currentIndex
                        ? 'ring-2 ring-white opacity-100'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getImageUrl(image, true)}
                      alt={`${hotel.name} thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(i)}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Add this helper function at the top of the file
const formatPrice = (price: string | number): string => {
  // Remove any non-numeric characters except decimal point, and parse to number
  const numericPrice = typeof price === 'string' ? 
    parseFloat(price.replace(/[^0-9.]/g, '')) : 
    price;
  
  // Format with thousand separators
  return numericPrice.toLocaleString('en-US');
};

// Keep only one version of the type guard at the top of the file
const isActivity = (activity: string | Activity): activity is Activity => {
  return typeof activity !== 'string' && 'time' in activity;
};

// Main Component
export default function InteractiveContent() {
  const router = useRouter();
  const { t, currentLanguage } = useLanguage();
  const [messages, setMessages] = React.useState<Message[]>([
    { 
      id: "1", 
      content: t('welcome'), 
      isUser: false,
      options: undefined
    },
  ])
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [input, setInput] = React.useState("")
  const [isSpeaking, setIsSpeaking] = React.useState(true)
  const [isTyping, setIsTyping] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });
  const [selectedDestination, setSelectedDestination] = React.useState<string | null>(null)
  const [weather, setWeather] = React.useState<Weather[]>([])
  const [budget, setBudget] = React.useState<number>(0)
  const [itinerary, setItinerary] = React.useState<DayPlan[]>([])
  const [suggestedHotel, setSuggestedHotel] = React.useState<Hotel>({
    id: '',
    name: '',
    description: '',
    image: '',
    price: '',
    rating: 0,
    amenities: []
  })
  const [selectedCategory, setSelectedCategory] = React.useState<string>("")
  const [likedTips, setLikedTips] = React.useState<Set<string>>(new Set())
  const [groupSize, setGroupSize] = React.useState<string>("")
  const [autoScroll, setAutoScroll] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState('chat');
  const [travelPlan, setTravelPlan] = React.useState<TravelPlan | null>(null);
  const [selectedInterest, setSelectedInterest] = React.useState<string[]>([]);
  const [selectedDeparture, setSelectedDeparture] = React.useState<string>("");

  const scrollRef = React.useRef<HTMLDivElement>(null)

  const [currentImageIndex, setCurrentImageIndex] = React.useState<{ [key: string]: number }>({});

  // Add this state at the top of your component
  const [currentImageIndices, setCurrentImageIndices] = React.useState<{ [key: number]: number }>({});

  // Add these state declarations near your other state variables
  const [favoriteHotels, setFavoriteHotels] = React.useState<string[]>([]);
  const [favoriteFlights, setFavoriteFlights] = React.useState<string[]>([]);

  // Add this state variable
  const [isItineraryGenerated, setIsItineraryGenerated] = React.useState(false);

  // Add these handler functions
  const toggleFavoriteHotel = (hotelId: string) => {
    setFavoriteHotels(prev => 
      prev.includes(hotelId) 
        ? prev.filter(id => id !== hotelId)
        : [...prev, hotelId]
    );
  };

  const toggleFavoriteFlight = (flightId: string) => {
    setFavoriteFlights(prev => 
      prev.includes(flightId) 
        ? prev.filter(id => id !== flightId)
        : [...prev, flightId]
    );
  };

  // Add this function to handle dot clicks
  const handleImageChange = (hotelIndex: number, imageIndex: number) => {
    setCurrentImageIndices(prev => ({
      ...prev,
      [hotelIndex]: imageIndex
    }));
  };

  // Speaking animation effect
  React.useEffect(() => {
    const timer = setInterval(() => {
      setIsSpeaking(prev => !prev)
    }, 500)
    return () => clearInterval(timer)
  }, [])

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }]);
    // Multiple scroll attempts with increasing delays
    [50, 150, 300].forEach(delay => {
      setTimeout(scrollToBottom, delay);
    });
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleDestinationSelect = async (destination: string) => {
    setSelectedDestination(destination);
    addMessage({ 
      id: Date.now().toString(), 
      content: t('interestedIn', { destination }), 
      isUser: true 
    });
    
    await simulateTyping(
      'datePrompt', 
      { 
        type: 'dateRange',
        data: [
          {
            label: t('selectDates'),
            icon: <CalendarIcon className="h-5 w-5" />,
            description: t('Pick your travel dates'),
            component: (
              <div className="mt-4">
                <DateRange
                  editableDateInputs={true}
                  onChange={(ranges: RangeKeyDict) => {
                    const selection = ranges.selection;
                    setDateRange({
                      from: selection.startDate,
                      to: selection.endDate
                    });
                    if (selection.startDate && selection.endDate) {
                      handleDateRangeSelect({
                        from: selection.startDate,
                        to: selection.endDate
                      });
                    }
                  }}
                  moveRangeOnFirstSelection={false}
                  ranges={[{
                    startDate: dateRange.from,
                    endDate: dateRange.to,
                    key: 'selection'
                  }]}
                  minDate={new Date()}
                  className="border rounded-md"
                  locale={enUS}
                  months={2}
                  direction="horizontal"
                />
              </div>
            )
          }
        ]
      }
    );
  };

  const handleDateRangeSelect = async (dates: { from: Date; to: Date }) => {
    console.log('Date range selected:', dates);
    
    const formattedFrom = format(dates.from, 'yyyy-MM-dd');
    const formattedTo = format(dates.to, 'yyyy-MM-dd');
    const days = differenceInDays(dates.to, dates.from) + 1;
    
    // Format dates for display
    const displayFrom = format(dates.from, 'MMMM d, yyyy');
    const displayTo = format(dates.to, 'MMMM d, yyyy');
    
    addMessage({ 
      id: Date.now().toString(), 
      content: t('selectedDateRange', { 
        startDate: displayFrom, 
        endDate: displayTo,
        days: days.toString()
      }), 
      isUser: true,
      translationKey: 'selectedDateRange',
      translationParams: { 
        startDate: displayFrom, 
        endDate: displayTo,
        days: days.toString()
      }
    });
    
    // Add logging before weather fetch
    console.log('Fetching weather for selected dates:', dates);
    await fetchWeather(dates.from, dates.to);
    
    // Add logging after weather fetch
    console.log('Current weather state:', weather);
    
    // Update dateRange state
    setDateRange({
      from: dates.from,
      to: dates.to
    });
    
    // Continue with group size prompt...
    await simulateTyping('groupSizePrompt', {
      type: 'group-size',
      data: [
        { 
          label: 'Solo', 
          icon: '👤', 
          description: t('soloTravelerDesc')
        },
        { 
          label: 'Couple', 
          icon: '👫', 
          description: t('coupleDesc')
        },
        { 
          label: 'Family', 
          icon: '👨‍👧', 
          description: t('familyDesc')
        },
        { 
          label: 'Group', 
          icon: '👥', 
          description: t('groupDesc')
        }
      ]
    });
  };

  const handleGroupSizeSelect = async (size: string) => {
    setGroupSize(size);
    addMessage({ 
      id: Date.now().toString(), 
      content: t('selectedAs') + ' ' + t(size.toLowerCase()), 
      isUser: true 
    });
    
    await simulateTyping('budgetPrompt', {
      type: 'budget',
      data: [
        { 
          label: t('Basic'),
          icon: '🎒',  // Backpack for budget/explorer
          description: t('budgetBasicDesc')
        },
        { 
          label: t('Comfort'),
          icon: '🏨',  // Hotel for mid-range
          description: t('budgetMidRangeDesc')
        },
        { 
          label: t('Luxury'),
          icon: '👑',  // Crown for luxury
          description: t('budgetLuxuryDesc')
        }
      ]
    });
  };

  const handleBudgetSelect = async (value: string) => {
    // Convert budget ranges to actual numbers
    let budgetValue = 0;
    switch (value) {
      case 'Basic':
        budgetValue = 1000; // Average of 100-200
        break;
      case 'Comfort':
        budgetValue = 2500; // Average of 200-500
        break;
      case 'Luxury':
        budgetValue = 5000; // Average of 500-1000
        break;
    }
    
    setBudget(budgetValue);
    
    addMessage({ 
      id: Date.now().toString(), 
      content: t('selectedBudget', { budget: value }), 
      isUser: true 
    });

    const interestOptions: InterestOption[] = [
      { 
        label: 'Culture & Heritage', 
        icon: '🕌', 
        description: 'Museums, historical sites, and traditional experiences',
        category: 'Cultural'
      },
      { 
        label: 'Sports & Recreation', 
        icon: <Dumbbell className="h-6 w-6" />, 
        description: 'Sports events, facilities, and activities',
        category: 'Activities'
      },
      { 
        label: 'Education & Learning', 
        icon: '🎓', 
        description: 'Universities, workshops, and educational tours',
        category: 'Education'
      },
      { 
        label: 'Adventure & Outdoors', 
        icon: '🏜️', 
        description: 'Desert safaris, water sports, and outdoor activities',
        category: 'Activities'
      },
      { 
        label: 'Shopping & Lifestyle', 
        icon: '🛍️', 
        description: 'Malls, souks, and luxury shopping',
        category: 'Lifestyle'
      },
      { 
        label: 'Food & Dining', 
        icon: '🍽️', 
        description: 'Local cuisine, fine dining, and food tours',
        category: 'Lifestyle'
      },
      { 
        label: 'Technology & Innovation', 
        icon: '🚀', 
        description: 'Tech hubs, smart city features, and innovation centers',
        category: 'Modern'
      },
      { 
        label: 'Arts & Entertainment', 
        icon: '🎭', 
        description: 'Galleries, theaters, and performances',
        category: 'Cultural'
      },
      { 
        label: 'Wellness & Relaxation', 
        icon: '🧘‍♀️', 
        description: 'Spas, yoga, and wellness centers',
        category: 'Lifestyle'
      },
      { 
        label: 'Business & Networking', 
        icon: '💼', 
        description: 'Business districts, conferences, and networking events',
        category: 'Professional'
      },
      { 
        label: 'Family Activities', 
        icon: '👨‍👩‍👧‍👦', 
        description: 'Theme parks, family-friendly attractions',
        category: 'Activities'
      },
      { 
        label: 'Nature & Wildlife', 
        icon: '🌳', 
        description: 'Wildlife sanctuaries, gardens, and nature experiences',
        category: 'Nature'
      }
    ];

    await simulateTyping(
      'interestsPrompt',
      {
        type: 'interests',
        data: interestOptions.map(option => ({
          label: option.label,
          icon: option.icon,
          description: option.description,
          category: option.category,
          // Only include properties that exist in MessageOptions
        }))
      } as MessageOptions
    );
  };

  const handleInterestSelect = async (interests: string) => {
    try {
      setIsTyping(true);
      addMessage({
        id: Date.now().toString(),
        content: "I'm crafting your perfect Dubai experience! Give me a moment...",
        isUser: false
      });

      const response = await fetch('/api/travel/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: "Dubai",
          dateRange: {
            from: format(dateRange.from!, 'yyyy-MM-dd'),
            to: format(dateRange.to!, 'yyyy-MM-dd')
          },
          groupSize,
          budget,
          interests,
          departureLocation: selectedDeparture
        })
      });

      const data = await response.json();

      // Add this block to store analytics data
      await fetch('/api/analytics/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departureLocation: selectedDeparture,
          dateRange: JSON.stringify({
            from: format(dateRange.from!, 'yyyy-MM-dd'),
            to: format(dateRange.to!, 'yyyy-MM-dd')
          }),
          groupSize,
          budget,
          interests,
          travelPlan: data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch travel plan');
      }

      // Hide typing animation
      setIsTyping(false);

      if (data && data.messages && data.messages.length > 0) {
        const lastMessage = data.messages[data.messages.length - 1];
        
        if (lastMessage && lastMessage.content) {
          setTravelPlan({
            itinerary: data.itinerary || [],
            flights: data.flights || [],
            hotels: data.hotels || [],
            messages: data.messages || []
          });

          // Set itinerary generated to true
          setIsItineraryGenerated(true);

          // Add success messages with emojis
          addMessage({
            id: Date.now().toString(),
            content: "Perfect! 🎉 I've crafted your dream Dubai experience based on your preferences! You can explore:\n\n" +
                    "🗺️ Your daily activities in the 'Your Dubai Journey' tab\n" +
                    "🏨 Handpicked hotels in the 'Hotels' tab\n" +
                    "✈️ Flight options in the 'Flights' tab\n\n" +
                    "Feel free to ask me anything about Dubai, your stay, or local recommendations - I'm here to help make your trip amazing! 😊",
            isUser: false
          });

          setActiveTab('itinerary');
        }
      } else {
        throw new Error('Invalid response data');
      }
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
      addMessage({
        id: Date.now().toString(),
        content: "I apologize, but I'm having trouble creating your itinerary at the moment. Please try again in a few moments. 🙏",
        isUser: false
      });
    }
  };

  const formatItinerary = (itineraryString: string) => {
    console.log('Formatting itinerary string:', itineraryString); // Debug log
    
    // Split into days using the actual format (#### Day X:)
    const days = itineraryString.split(/#### Day \d+:/g).filter(Boolean);
    
    return days.map((day, index) => {
      // Split day content into activities
      const activities = day
        .split(/- \*\*TIME:\*\*/)  // Split on TIME marker
        .filter(line => line.trim())
        .map((activity, actIndex) => {
          // Clean up the activity text
          const cleanActivity = activity.trim();
          
          // Extract components using more specific patterns
          const timeMatch = cleanActivity.match(/^([0-9:]+\s*(?:AM|PM))/i);
          const titleMatch = cleanActivity.match(/\*\*TITLE:\*\*\s*(.*?)(?=\n\*\*|\n-|\n$)/i);
          const descriptionMatch = cleanActivity.match(/\*\*DESCRIPTION:\*\*\s*(.*?)(?=\n\*\*|\n-|\n$)/i);
          const locationMatch = cleanActivity.match(/\*\*LOCATION:\*\*\s*(.*?)(?=\n\*\*|\n-|\n$)/i);
          const priceMatch = cleanActivity.match(/\*\*PRICE:\*\*\s*\$?(\d+)/i);
          const tipMatch = cleanActivity.match(/\*\*TIP:\*\*\s*(.*?)(?=\n\*\*|\n-|\n$)/i);

          console.log('Parsing activity:', {
            clean: cleanActivity,
            time: timeMatch?.[1],
            title: titleMatch?.[1],
            desc: descriptionMatch?.[1],
            loc: locationMatch?.[1],
            price: priceMatch?.[1],
            tip: tipMatch?.[1]
          }); // Debug log

          return {
            id: `${index + 1}-${actIndex}`,
            day: index + 1,
            time: timeMatch ? timeMatch[1].trim() : '09:00 AM',
            title: titleMatch ? titleMatch[1].trim() : 'Activity',
            description: descriptionMatch ? descriptionMatch[1].trim() : '',
            location: locationMatch ? locationMatch[1].trim() : '',
            type: 'activity',
            price: priceMatch ? parseFloat(priceMatch[1]) : 0,
            tips: tipMatch ? [tipMatch[1].trim()] : []
          };
        });

      return {
        day: index + 1,
        activities: activities.filter(activity => activity.title && activity.title !== 'Activity') // Filter out empty activities
      };
    });
  };

  const formatFlights = (data: any): Flight[] => {
    if (data.flights && Array.isArray(data.flights)) {
      return data.flights.map((flight: any): Flight => {
        const firstLeg = flight.flights[0];
        const lastLeg = flight.flights[flight.flights.length - 1];
        
        return {
          id: flight.id,
          airline: firstLeg.airline,
          airline_logo: flight.airline_logo,
          flights: [{
            airline: firstLeg.airline,
            flight_number: firstLeg.flight_number,
            airplane: firstLeg.airplane,
            travel_class: firstLeg.travel_class,
            legroom: firstLeg.legroom,
            duration: firstLeg.duration,
            departure_airport: {
              name: firstLeg.departure_airport.name,
              id: firstLeg.departure_airport.id,
              time: firstLeg.departure_airport.time
            },
            arrival_airport: {
              name: firstLeg.arrival_airport.name,
              id: firstLeg.arrival_airport.id,
              time: firstLeg.arrival_airport.time
            },
            extensions: firstLeg.extensions || [],
            overnight: firstLeg.overnight || false,
            often_delayed_by_over_30_min: firstLeg.often_delayed_by_over_30_min || false
          }],
          total_duration: flight.total_duration,
          carbon_emissions: flight.carbon_emissions,
          price: flight.price,
          type: flight.type || 'flight',
          booking_link: flight.booking_link ? 
            `https://www.google.com/flights?hl=en#flt=${flight.departure_token}` : 
            undefined,
          departure: firstLeg.departure_airport.time,
          arrival: lastLeg.arrival_airport.time,
          duration: flight.total_duration?.toString(),
          booking_options: data.booking_options?.filter((option: any) => 
            option.marketed_as?.some((flightNum: string) => 
              flight.flights.some((leg: any) => leg.flight_number === flightNum)
            )
          )
        };
      });
    }
    return [];
  };

  const formatHotels = (data: string): Hotel[] => {
    // Extract hotel section
    const hotelSection = data.match(/\*\*Hotel Recommendations\*\*([^#]+)/)?.[1];
    const hotels: Hotel[] = [];

    // Parse each hotel option
    const hotelRegex = /\d+\.\s\*\*([^*]+)\*\*([^#]+)/g;
    let match;
    while ((match = hotelRegex.exec(hotelSection || '')) !== null) {
      const name = match[1];
      const details = match[2];

      // Get the booking link, converting null to undefined
      const bookingLink = details.match(/Booking: ([^\n]+)/)?.[1] || undefined;

      hotels.push({
        id: `hotel-${hotels.length + 1}`,
        name,
        description: details.match(/Description: ([^\n]+)/)?.[1] || '',
        price: details.match(/Price: \$(\d+)/)?.[1] || '',
        rating: parseFloat(details.match(/Rating: (\d+\.?\d*)/)?.[1] || '0'),
        amenities: (details.match(/Amenities: ([^\n]+)/)?.[1] || '').split(', '),
        image: '/images/hotel-placeholder.jpg',
        location: details.match(/Location: ([^\n]+)/)?.[1] || '',
        booking_link: bookingLink  // Use undefined instead of null
      });
    }

    return hotels;
  };

  const handleDepartureSelect = async (departure: string) => {
    setSelectedDeparture(departure);
    addMessage({ 
      id: Date.now().toString(), 
      content: t('selectedDeparture', { departure }), 
      isUser: true 
    });

    try {
      const response = await fetch('/api/travel/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: "Dubai",
          dateRange: {
            from: format(dateRange.from!, 'yyyy-mm-dd'),
            to: format(dateRange.to!, 'yyyy-mm-dd')
          },
          groupSize,
          budget,
          interests: selectedInterest,
          departureLocation: departure
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch travel plan');
      }

      const data = await response.json();
      console.log('Travel plan response:', data);

      // Get the last message which contains the complete travel plan
      const lastMessage = data.messages?.[data.messages.length - 1];
      console.log('Last message:', lastMessage);
      if (lastMessage && lastMessage.role === 'assistant') {
        // Extract the Daily Itinerary section using the actual format
        const itinerarySection = lastMessage.content.match(/(?:#{1,4}\s*)?(?:\d+\.\s*)?Daily Itinerary([\s\S]*?)(?=###|$)/i);
        console.log('Itinerary section:', itinerarySection);
        if (itinerarySection) {
          console.log('Found itinerary section:', itinerarySection[1]); // Debug log
          const formattedItinerary = formatItinerary(itinerarySection[1]);
          console.log('Formatted itinerary:', formattedItinerary); // Debug log
          
          setTravelPlan({
            itinerary: formattedItinerary,
            flights: formatFlights(data.flights) || [],
            hotels: formatHotels(data.hotels) || [],
            messages: data.messages || []
          });

          // Switch to itinerary tab
          setActiveTab('itinerary');
        } else {
          console.log('No itinerary section found in:', lastMessage.content); // Debug log
        }
      }
    } catch (error) {
      console.error('Error:', error);
      addMessage({
        id: Date.now().toString(),
        content: t('errorMessage'),
        isUser: false
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    addMessage({ id: Date.now().toString(), content: userMessage, isUser: true });
    setInput("");

    // If no departure city is set yet, this is the first message
    if (!selectedDeparture) {
      setSelectedDeparture(userMessage);
      
      // Get city-specific response
      const cityKey = userMessage.toLowerCase().replace(/\s+/g, '_');
      const response = t('datePromptResponses', { city: cityKey });
      
      // If no specific response exists, use default datePrompt
      const promptMessage = response === 'datePromptResponses' ? t('datePrompt') : response;
      
      // Move to date selection after city is entered
      await simulateTyping(promptMessage, {
        type: 'dateRange',
        data: [{
          label: t('selectDates'),
          icon: <CalendarIcon className="h-5 w-5" />,
          description: t('Pick your travel dates'),
          component: (
            <div className="mt-4">
              <DateRange
                editableDateInputs={true}
                onChange={(ranges: RangeKeyDict) => {
                  const selection = ranges.selection;
                  setDateRange({
                    from: selection.startDate,
                    to: selection.endDate
                  });
                  if (selection.startDate && selection.endDate) {
                    handleDateRangeSelect({
                      from: selection.startDate,
                      to: selection.endDate
                    });
                  }
                }}
                moveRangeOnFirstSelection={false}
                ranges={[{
                  startDate: dateRange.from,
                  endDate: dateRange.to,
                  key: 'selection'
                }]}
                minDate={new Date()}
                className="border rounded-md"
                locale={enUS}
                months={2}
                direction="horizontal"
              />
            </div>
          )
        }]
      });
    } else if (isItineraryGenerated) {
      // Call the chat API route here
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            context: {
              itinerary: travelPlan?.itinerary || [],
              flights: travelPlan?.flights || [],
              hotels: travelPlan?.hotels || [],
              dateRange,
              groupSize,
              budget,
              interests: selectedInterest,
              weather: weather
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send message to Sayih');
        }

        const data = await response.json();
        addMessage({ 
          id: Date.now().toString(), 
          content: data.message, 
          isUser: false 
        });
      } catch (error) {
        console.error('Error sending message to Sayih:', error);
      }
    }

    scrollToBottom();
  };

  const handleExportToCalendar = () => {
    if (!travelPlan?.itinerary || !dateRange.from) {
      console.error('No itinerary or dates available');
      return;
    }

    const events: CalendarEvent[] = Array.isArray(travelPlan.itinerary) 
      ? travelPlan.itinerary.flatMap(day => {
          return day.activities.map(activity => {
            if (!isActivity(activity)) {
              return null;
            }

            // Parse the time string (e.g., "09:00 AM")
            const [timeStr, period] = activity.time.split(' ');
            const [hours, minutes] = timeStr.split(':').map(Number);
            
            // Convert to 24-hour format
            let hour = hours;
            if (period === 'PM' && hours !== 12) {
              hour += 12;
            } else if (period === 'AM' && hours === 12) {
              hour = 0;
            }

            // Calculate the event date by adding days to the start date
            const eventDate = new Date(dateRange.from!);
            eventDate.setDate(eventDate.getDate() + (day.day - 1));

            // Create calendar event
            return {
              start: [
                eventDate.getFullYear(),
                eventDate.getMonth() + 1,
                eventDate.getDate(),
                hour,
                minutes
              ],
              duration: { hours: 2 }, // Default 2-hour duration for activities
              title: activity.title,
              description: `${activity.description}\n\nPrice: ${activity.price}\n${activity.tips?.[0] ? `\nTip: ${activity.tips[0]}` : ''}`,
              location: activity.location || ''
            };
          }).filter((event): event is CalendarEvent => event !== null);
        })
      : [];

    // Create the calendar events
    createEvents(events, (error: Error | undefined, value: string) => {
      if (error) {
        console.error('Error creating calendar events:', error);
        return;
      }

      // Create a download link for the .ics file
      const blob = new Blob([value], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dubai-itinerary.ics';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const handleSuggestAnotherHotel = () => {
    const currentIndex = hotels.findIndex(h => h.id === suggestedHotel.id)
    const nextIndex = (currentIndex + 1) % hotels.length
    setSuggestedHotel(hotels[nextIndex])
  }

  const handleLike = (tipId: string) => {
    setLikedTips(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tipId)) {
        newSet.delete(tipId)
      } else {
        newSet.add(tipId)
      }
      return newSet
    })
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const newItinerary = [...itinerary]
    const [reorderedItem] = newItinerary[result.source.droppableId].activities.splice(result.source.index, 1)
    newItinerary[result.destination.droppableId].activities.splice(result.destination.index, 0, reorderedItem)
    setItinerary(newItinerary)
  }


  const generateWeatherForecast = (date: Date): Weather => {
    const conditions: ('sunny' | 'cloudy' | 'rainy')[] = ['sunny', 'cloudy', 'rainy']
    return {
      date,
      temperature: Math.floor(Math.random() * 15) + 25,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.floor(Math.random() * 30) + 40,
      description: '',
      icon: '',
      main: {
        temp: Math.floor(Math.random() * 15) + 25,
        feels_like: Math.floor(Math.random() * 15) + 25,
        temp_min: Math.floor(Math.random() * 15) + 25,
        temp_max: Math.floor(Math.random() * 15) + 25,
        pressure: Math.floor(Math.random() * 1000) + 1000,
        humidity: Math.floor(Math.random() * 30) + 40
      },
      weather: {
        id: Math.floor(Math.random() * 100) + 1,
        main: conditions[Math.floor(Math.random() * conditions.length)],
        description: '',
        icon: ''
      }
    }
  }

  const filteredTips = selectedCategory === "all" || !selectedCategory
    ? tips
    : tips.filter(tip => tip.category === selectedCategory)

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'food':
        return <Utensils className="h-5 w-5" />
      case 'sightseeing':
        return <Camera className="h-5 w-5" />
      case 'transport':
        return <Car className="h-5 w-5" />
      case 'nature':
        return <Palmtree className="h-5 w-5" />
      case 'cultural':
        return <Globe className="h-5 w-5" />
      case 'shopping':
        return <DollarSign className="h-5 w-5" />
      default:
        return <MapPin className="h-5 w-5" />
    }
  }

  const simulateTyping = async (messageKey: string, options?: MessageOptions) => {
    setIsTyping(true);
    scrollToBottom();
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsTyping(false);
    addMessage({
      id: Date.now().toString(),
      content: t(messageKey),
      isUser: false,
      options: options ? {
        ...options,
        data: options.data?.map(item => ({
          ...item,
          label: t(item.label),
          description: t(item.description)
        }))
      } : undefined
    });
    scrollToBottom();
  };

  React.useEffect(() => {
    const timeouts = [100, 200, 500].map(delay => 
      setTimeout(scrollToBottom, delay)
    );
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [messages, isTyping]);

  React.useEffect(() => {
    console.log('Current travel details:', {
      destination: selectedDestination,
      dateRange,
      groupSize,
      budget,
    });
  }, [selectedDestination, dateRange, groupSize, budget]);

  React.useEffect(() => {
    if (currentLanguage) {
      // Update all messages with translations
      setMessages(prev => prev.map(message => {
        // If it's a user message with a translation key, translate it
        if (message.translationKey) {
          return {
            ...message,
            content: message.isUser ? 
              t(message.translationKey, message.translationParams || {}) : 
              t(message.content)
          };
        }
        
        // For system messages, translate content and options
        if (!message.isUser) {
          return {
            ...message,
            content: t(message.content),
            options: message.options ? {
              ...message.options,
              data: message.options.data?.map(item => ({
                ...item,
                label: t(item.label),
                description: t(item.description)
              }))
            } : undefined
          };
        }
        
        return message;
      }));

      // Update itinerary
      if (itinerary.length > 0) {
        setItinerary(prev => prev.map(day => ({
          ...day,
          activities: day.activities.map(activity => ({
            ...activity,
            title: t(activity.title),
            description: activity.description ? t(activity.description) : '',
            location: activity.location ? t(activity.location) : '',
            tips: activity.tips?.map(tip => t(tip)) || []
          }))
        })));
      }
    }
  }, [currentLanguage, t]);

  // Add this helper function for amenity icons
  const getAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Free Wi-Fi': <Wifi className="h-4 w-4" />,
      'Pool': <Waves className="h-4 w-4" />,
      'Spa': <Sparkles className="h-4 w-4" />,
      'Restaurant': <Utensils className="h-4 w-4" />,
      'Gym': <Dumbbell className="h-4 w-4" />,
      'Parking': <Car className="h-4 w-4" />,
      'Air conditioning': <Wind className="h-4 w-4" />,
      'Bar': <Wine className="h-4 w-4" />,
      'Kitchen': <ChefHat className="h-4 w-4" />,
      'Laundry': <Shirt className="h-4 w-4" />,
      // Add more mappings as needed
    };

    // Return the icon if it exists, otherwise a default icon
    return iconMap[amenity] || <Check className="h-4 w-4" />;
  };

  const nextImage = (hotelId: string, maxLength: number) => {
    const identifier = hotelId || Date.now().toString(); // Fallback to timestamp if no ID
    setCurrentImageIndex(prev => ({
      ...prev,
      [identifier]: ((prev[identifier] || 0) + 1) % maxLength
    }));
  };

  const prevImage = (hotelId: string, maxLength: number) => {
    const identifier = hotelId || Date.now().toString(); // Fallback to timestamp if no ID
    setCurrentImageIndex(prev => ({
      ...prev,
      [identifier]: ((prev[identifier] || 0) - 1 + maxLength) % maxLength
    }));
  };

  // Add a safe translation helper
  const safeTranslate = (text: string | undefined): string => {
    return text ? t(text) : '';
  };

  // Add this helper function to filter messages
  const shouldShowMessage = (message: Message) => {
    // Check if message.content exists before using includes
    if (!message.content) return true;
    
    // Don't show AI planning messages
    if (!message.isUser && (
      message.content.includes('Travel Itinerary') ||
      message.content.includes('Flight Options:') ||
      message.content.includes('Hotel Recommendations:') ||
      message.content.includes('You are a travel planning assistant')
    )) {
      return false;
    }
    
    return true;
  };

  const fetchWeather = async (from?: Date, to?: Date) => {
    if (!from || !to) {
      console.log('No dates provided for weather fetch');
      return;
    }
    
    try {
      const formattedFrom = format(from, 'yyyy-MM-dd');
      const formattedTo = format(to, 'yyyy-MM-dd');
      console.log('Fetching weather for dates:', { formattedFrom, formattedTo });
      
      const params = new URLSearchParams({
        startDate: formattedFrom,
        endDate: formattedTo
      });
      
      const response = await fetch(`/api/weather?${params}`);
      if (!response.ok) throw new Error('Failed to fetch weather');
      
      const data = await response.json();
      console.log('Weather data received:', data);
      
      if (data.forecast && data.forecast.length > 0) {
        setWeather(data.forecast); // Set the entire forecast array
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  // Add this helper function to format the WhatsApp message
  const formatWhatsAppMessage = (travelPlan: TravelPlan | null) => {
    if (!travelPlan?.itinerary) return '';
    
    let message = "🌟 *My Dubai Trip with Sayih AI* 🌟\n\n";
    
    // Add dates if available
    if (dateRange.from && dateRange.to) {
      message += `📅 *Dates:* ${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}\n\n`;
    }

    // Add itinerary summary
    if (Array.isArray(travelPlan.itinerary)) {
      travelPlan.itinerary.forEach((day) => {
        message += `*Day ${day.day}:*\n`;
        day.activities.forEach((activity) => {
          if (isActivity(activity)) {
            message += `• ${activity.time} - ${activity.title}\n`;
            message += `  📍 ${activity.location}\n`;
            if (activity.price) message += `  💰 AED ${activity.price}\n`;
          }
        });
        message += '\n';
      });
    }

    // Add hotel info if available
    if (travelPlan.hotels && travelPlan.hotels.length > 0) {
      message += "*Selected Hotel:*\n";
      const hotel = travelPlan.hotels[0];
      message += `🏨 ${hotel.name}\n`;
      message += `💰 ${hotel.price}\n\n`;
    }

    return encodeURIComponent(message);
  };

  const renderMessageOptions = (options: MessageOptions) => {
    switch (options.type) {
      case 'dateRange':
        return (
          <div className="mt-4">
            <DateRange
              editableDateInputs={true}
              onChange={(ranges: RangeKeyDict) => {
                const selection = ranges.selection;
                setDateRange({
                  from: selection.startDate,
                  to: selection.endDate
                });
                if (selection.startDate && selection.endDate) {
                  handleDateRangeSelect({
                    from: selection.startDate,
                    to: selection.endDate
                  });
                }
              }}
              moveRangeOnFirstSelection={false}
              ranges={[{
                startDate: dateRange.from,
                endDate: dateRange.to,
                key: 'selection'
              }]}
              minDate={new Date()}
              className="border rounded-md"
              locale={enUS}
              months={2}
              direction="horizontal"
            />
          </div>
        );

      case 'group-size':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {options.data?.map((option) => (
              <button
                key={option.label}
                onClick={() => handleGroupSizeSelect(option.label)}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-[#C5A059] transition-all"
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </button>
            ))}
          </div>
        );

      case 'interests':
        return (
          <div className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {options.data?.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedInterest(prev => {
                      if (prev.includes(option.label)) {
                        return prev.filter(i => i !== option.label);
                      }
                      return [...prev, option.label];
                    });
                  }}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    selectedInterest.includes(option.label)
                      ? 'border-[#C5A059] bg-[#C5A059]/5'
                      : 'border-gray-200 hover:border-[#C5A059]/50'
                  }`}
                >
                  {/* Selection Circle */}
                  <div 
                    className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedInterest.includes(option.label)
                        ? 'border-[#C5A059] bg-[#C5A059]'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedInterest.includes(option.label) && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </div>

                  <div className="text-2xl mb-3">{option.icon}</div>
                  <div className="font-medium mb-1">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </button>
              ))}
            </div>

            {/* Done button */}
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => {
                  if (selectedInterest.length > 0) {
                    handleInterestSelect(selectedInterest.join(', '));
                  }
                }}
                disabled={selectedInterest.length === 0}
                className={`
                  w-full max-w-md py-4 rounded-xl font-medium text-lg
                  transition-all transform hover:scale-[1.02]
                  ${selectedInterest.length === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#C5A059] text-white hover:bg-[#B48D4C] shadow-lg hover:shadow-xl'
                  }
                `}
              >
                {selectedInterest.length === 0 
                  ? 'Select at least one interest'
                  : `Continue with ${selectedInterest.length} selected`
                }
              </button>
            </div>
          </div>
        );

      case 'budget':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {options.data?.map((option) => (
              <button
                key={option.label}
                onClick={() => handleBudgetSelect(option.label)}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-[#C5A059] transition-all"
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </button>
            ))}
          </div>
        );

      // Add other cases as needed...
      default:
        return null;
    }
  };

  // Update the main content layout section
  return (
    <div className="relative min-h-screen bg-white">
      {/* Adaptive Header */}
      <div className="group h-16 hover:h-24 transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-lg border-b border-[#C5A059]/20 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-[#C5A059] p-2 group-hover:p-3 rounded-lg transition-all">
              <Compass className="h-6 w-6 group-hover:h-8 group-hover:w-8 text-white transition-all" />
            </div>
            <span className="text-xl group-hover:text-2xl font-bold text-[#C5A059] transition-all">
              Sayih AI
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-12">
            <a 
              onClick={() => router.push('/')} 
              className="text-lg text-gray-600 hover:text-[#C5A059] transition-colors cursor-pointer"
            >
              Home
            </a>
            <a href="#" className="text-lg text-gray-600 hover:text-[#C5A059] transition-colors">Explore Dubai</a>
            <a href="#" className="text-lg text-gray-600 hover:text-[#C5A059] transition-colors">About</a>
            <a href="#" className="text-lg text-gray-600 hover:text-[#C5A059] transition-colors">Contact</a>
          </nav>
          <div className="flex items-center">
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Main Content with Split Layout */}
      <div className="flex h-[calc(100vh-4rem)] pt-16">
        {/* Left Side - Chat Interface */}
        <div className="w-1/2 h-[calc(100vh-4rem)] fixed left-0 flex flex-col bg-white">
          {/* Avatar and Status */}
          <div className="flex-shrink-0 p-6 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <motion.div
                  animate={{ scale: isSpeaking ? 1 : 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="h-16 w-16 rounded-full border-2 border-[#C5A059] overflow-hidden">
                    <img
                      src={agencyConfig.logo}
                      alt="Sayih"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <motion.div
                    animate={{ 
                      opacity: isSpeaking ? 1 : 0.5,
                      scale: isSpeaking ? 1.1 : 1
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute -bottom-1 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-[#C5A059]"
                  />
                </motion.div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#C5A059]">Sayih</h3>
                <p className="text-sm text-gray-600">Your Dubai Travel Agent</p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 mb-[80px]"
          >
            {messages.filter(shouldShowMessage).map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex items-start ${
                  message.isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Place Sayih's avatar BEFORE the message for non-user messages */}
                {!message.isUser && (
                  <div className="mr-3 flex-shrink-0">
                    <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-[#C5A059]">
                      <img
                        src={agencyConfig.logo}
                        alt="Sayih"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                <div 
                  className={`max-w-[85%] rounded-2xl p-6 ${
                    message.isUser 
                      ? 'bg-[#C5A059] text-white' 
                      : 'bg-gray-50 border border-[#C5A059]/20 text-black'
                  }`}
                >
                  <span className="text-base whitespace-pre-wrap block">
                    {message.content}
                  </span>
                  {message.options && renderMessageOptions(message.options)}
                </div>

                {/* User avatar stays on the right */}
                {message.isUser && (
                  <div className="ml-3 flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
            
            {/* Typing Animation with Avatar */}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src="/images/sayih-avatar.png" 
                    alt="Sayih" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <TypingAnimation />
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('askSayih')}
                className="flex-1"
              />
              <Button 
                type="submit" 
                className="bg-[#C5A059] hover:bg-[#B08040] text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side - Tabs Interface */}
        <div className="w-1/2 h-[calc(100vh-4rem)] fixed right-0 overflow-y-auto bg-gray-50">
          <Tabs 
            defaultValue="itinerary" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
            orientation="horizontal"
          >
            <TabsList className="w-full grid grid-cols-2 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
              {/* Dropdown for Journey tabs */}
              <div className="relative group">
                <TabsTrigger 
                  value="journey" 
                  className="w-full flex items-center justify-center gap-2"
                >
                  Your Dubai Journey
                  <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform duration-200" />
                </TabsTrigger>
                
                <div className="absolute hidden group-hover:block w-full bg-white shadow-lg rounded-b-lg overflow-hidden z-[60]">
                  <button
                    onClick={() => setActiveTab('itinerary')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    Itinerary
                  </button>
                  <button
                    onClick={() => setActiveTab('tips')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    Travel Tips
                  </button>
                </div>
              </div>
              
              <TabsTrigger value="hotels">Hotels & Flights</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
            </TabsList>

            <div className="p-6 pb-24"> {/* Added bottom padding */}
              <TabsContent value="itinerary" className="mt-0">
                {travelPlan?.itinerary && Array.isArray(travelPlan.itinerary) && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">Daily Itinerary</h2>
                      <Button 
                        onClick={handleExportToCalendar}
                        className="bg-[#C5A059] hover:bg-[#B08040] text-white"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Export to Calendar
                      </Button>
                    </div>
                    {travelPlan.itinerary.map((day, index) => (
                      <div key={`day-${index}`} className="bg-white rounded-xl shadow-md p-6">
                        {/* Add weather widget at the top right of the card */}
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-black">Day {day.day}</h3>
                          {weather?.find(w => {
                            const weatherDate = w.date ? new Date(w.date) : null;
                            const planDate = dateRange.from ? 
                              addDays(new Date(dateRange.from), day.day - 1) : null;
                            
                            return weatherDate && planDate ? 
                              format(weatherDate, 'yyyy-MM-dd') === format(planDate, 'yyyy-MM-dd') : 
                              false;
                          }) && (
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                              <div className="flex items-center gap-2">
                                {getWeatherIcon(weather.find(w => {
                                  const weatherDate = w.date ? new Date(w.date) : null;
                                  const planDate = dateRange.from ? 
                                    addDays(new Date(dateRange.from), day.day - 1) : null;
                                  
                                  return weatherDate && planDate ? 
                                    format(weatherDate, 'yyyy-MM-dd') === format(planDate, 'yyyy-MM-dd') : 
                                    false;
                                })?.weather.main)}
                                <div className="text-sm">
                                  <span className="font-medium">
                                    {Math.round(weather.find(w => {
                                      const weatherDate = w.date ? new Date(w.date) : null;
                                      const planDate = dateRange.from ? 
                                        addDays(new Date(dateRange.from), day.day - 1) : null;
                                      
                                      return weatherDate && planDate ? 
                                        format(weatherDate, 'yyyy-MM-dd') === format(planDate, 'yyyy-MM-dd') : 
                                        false;
                                    })?.main.temp_max || 0)}°
                                  </span>
                                  <span className="text-gray-500 mx-1">/</span>
                                  <span className="text-gray-500">
                                    {Math.round(weather.find(w => {
                                      const weatherDate = w.date ? new Date(w.date) : null;
                                      const planDate = dateRange.from ? 
                                        addDays(new Date(dateRange.from), day.day - 1) : null;
                                      
                                      return weatherDate && planDate ? 
                                        format(weatherDate, 'yyyy-MM-dd') === format(planDate, 'yyyy-MM-dd') : 
                                        false;
                                    })?.main.temp_min || 0)}°
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-400 italic ml-1">
                                Powered by OpenWeather
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-6">
                          {day.activities.map((activity, actIndex) => (
                            <div 
                              key={`activity-${index}-${actIndex}`}
                              className="border-l-2 border-gray-200 pl-4 relative"
                            >
                              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#C5A059]"></div>
                              {typeof activity === 'string' ? (
                                <p className="text-gray-600">{activity}</p>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-500">{activity.time}</span>
                                  </div>
                                  <h4 className="text-lg font-semibold text-black">{activity.title}</h4>
                                  <p className="text-gray-600">{activity.description}</p>
                                  {activity.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm text-gray-500">{activity.location}</span>
                                    </div>
                                  )}
                                  {activity.price !== undefined && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <DollarSign className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm text-gray-500">
                                        {activity.price === 0 ? (
                                          <span className="text-[#C5A059] font-large">Free</span>
                                        ) : (
                                          `$${activity.price} per person`
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {activity.tips && activity.tips.length > 0 && (
                                    <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-yellow-500" />
                                        <span className="text-sm text-gray-600">Tip: {activity.tips[0]}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="hotels" className="mt-0">
                <div className="flex gap-6">
                  {/* Hotels Section - Left Half */}
                  <div className="w-1/2">
                    <div className="sticky top-0 bg-gray-50 z-40 pb-4">
                      <h2 className="text-2xl font-bold">Recommended Hotels</h2>
                    </div>
                    <div className="space-y-6 pr-3">
                      {travelPlan?.hotels && travelPlan.hotels.map((hotel, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                          {/* Image Gallery */}
                          {hotel.images && hotel.images.length > 0 ? (
                            <div className="relative h-48 overflow-hidden">
                              <div 
                                className="flex h-full transition-transform duration-300"
                                style={{ 
                                  transform: `translateX(-${currentImageIndices[index] || 0}00%)` 
                                }}
                              >
                                {hotel.images.map((image, imgIndex) => (
                                  <img 
                                    key={imgIndex}
                                    src={`/api/image-proxy?url=${encodeURIComponent(image.original_image)}`}
                                    alt={`${hotel.name} - Image ${imgIndex + 1}`} 
                                    className="w-full h-full object-cover flex-shrink-0"
                                  />
                                ))}
                              </div>
                              {/* Navigation Dots */}
                              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                {hotel.images.map((_, dotIndex) => (
                                  <button
                                    key={dotIndex}
                                    onClick={() => handleImageChange(index, dotIndex)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                      (currentImageIndices[index] || 0) === dotIndex 
                                        ? 'bg-white' 
                                        : 'bg-white/50 hover:bg-white/75'
                                    }`}
                                    aria-label={`View image ${dotIndex + 1}`}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : hotel.image ? (
                            <div className="h-48 overflow-hidden">
                              <img 
                                src={hotel.image} 
                                alt={hotel.name} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          ) : null}

                          <div className="p-6 relative"> {/* Add relative positioning */}
                            {/* Move heart button to top right */}
                            <button 
                              onClick={() => toggleFavoriteHotel(hotel.id || index.toString())}
                              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              <Heart 
                                className={`h-4 w-4 transition-colors ${
                                  favoriteHotels.includes(hotel.id || index.toString()) 
                                    ? 'fill-red-500 text-red-500' 
                                    : 'text-gray-400'
                                }`}
                              />
                            </button>

                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-xl font-semibold">{hotel.name}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="h-4 w-4 text-yellow-400" />
                                  <span className="text-sm font-medium">{hotel.rating}/5</span>
                                  {hotel.reviews && (
                                    <span className="text-sm text-gray-500">
                                      ({hotel.reviews} reviews)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Rest of the hotel card content... */}
                            <div className="flex items-center gap-2 mb-4">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{hotel.location}</span>
                            </div>

                            <p className="text-gray-600 mb-4">{hotel.description}</p>

                            {/* Amenities */}
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Amenities</h4>
                              <div className="flex flex-wrap gap-2">
                                {hotel.amenities.map((amenity, amenityIndex) => (
                                  <span 
                                    key={amenityIndex}
                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                              <span className="text-lg font-bold text-[#C5A059]">
                                ${formatPrice(hotel.price)}/night
                              </span>
                              {hotel.booking_link && (
                                <Button 
                                  className="bg-[#C5A059] hover:bg-[#B08040] text-white"
                                  onClick={() => window.open(hotel.booking_link, '_blank')}
                                >
                                  Book Now
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="w-px bg-gray-200"></div>

                  {/* Flights Section - Right Half */}
                  <div className="w-1/2">
                    <div className="sticky top-0 bg-gray-50 z-40 pb-4">
                      <h2 className="text-2xl font-bold">Available Flights</h2>
                    </div>
                    <div className="space-y-4 pl-3">
                      {travelPlan?.flights && travelPlan.flights.map((flight, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm p-6 relative"> {/* Add relative positioning */}
                          {/* Move heart button to top right */}
                          <button 
                            onClick={() => toggleFavoriteFlight(flight.flights[0].flight_number || index.toString())}
                            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <Heart 
                              className={`h-4 w-4 transition-colors ${
                                favoriteFlights.includes(flight.flights[0].flight_number || index.toString()) 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-400'
                              }`}
                            />
                          </button>

                          <div 
                            className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer"
                            onClick={() => setSelectedFlight(flight)}
                          >
                            {/* Airline Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16">
                                  <img 
                                    src={flight.airline_logo} 
                                    alt={flight.airline} 
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div>
                                  <span className="text-lg font-semibold">{flight.airline}</span>
                                  <div className="text-sm text-gray-500">
                                    <span>Flight {flight.flights[0].flight_number}</span>
                                    <span className="mx-2">•</span>
                                    <span>{flight.flights[0].airplane}</span>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    <span>{flight.flights[0].travel_class}</span>
                                    {flight.flights[0].legroom && (
                                      <>
                                        <span className="mx-2">•</span>
                                        <span>{flight.flights[0].legroom} legroom</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className="text-lg font-bold text-[#C5A059]">
                                ${formatPrice(flight.price)}
                              </span>
                            </div>

                            {/* Flight Route */}
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                              <div>
                                <p className="text-sm text-gray-500">Departure</p>
                                <p className="font-medium">{flight.flights[0].departure_airport.time}</p>
                                <p className="text-sm text-gray-600">{flight.flights[0].departure_airport.name}</p>
                              </div>
                              <Plane className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-500">Arrival</p>
                                <p className="font-medium">{flight.flights[0].arrival_airport.time}</p>
                                <p className="text-sm text-gray-600">{flight.flights[0].arrival_airport.name}</p>
                              </div>
                            </div>

                            {/* Booking Options - only show when flight is selected */}
                            {selectedFlight?.id === flight.id && flight.booking_options && (
                              <FlightBookingOptions 
                                options={flight.booking_options}
                                onSelect={() => {
                                  if (flight.booking_link) {
                                    window.open(flight.booking_link, '_blank');
                                  }
                                }}
                            />
                            )}

                            {/* Duration - Moved here */}
                            <div className="mt-4 mb-2 flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Duration:</span>
                              <span className="text-sm text-gray-600">{formatDuration(flight.flights[0].duration)}</span>
                            </div>

                            {/* Flight Features */}
                            {flight.flights[0].extensions && (
                              <div className="mt-4 space-y-2">
                                {flight.flights[0].extensions.map((feature, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-400" />
                                    <p className="text-sm text-gray-600">{feature}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Carbon Emissions */}
                            {flight.carbon_emissions && (
                              <div className="mt-4 flex items-center gap-2">
                                <Leaf className="h-4 w-4 text-green-500" />
                                <p className="text-sm text-gray-600">
                                  Carbon emissions: {(flight.carbon_emissions.this_flight / 1000).toFixed(0)}kg CO₂
                                  <span className={flight.carbon_emissions.difference_percent > 0 ? 'text-red-500' : 'text-green-500'}>
                                    {' '}({flight.carbon_emissions.difference_percent > 0 ? '+' : ''}
                                    {flight.carbon_emissions.difference_percent}% vs average)
                                  </span>
                                </p>
                              </div>
                            )}

                            {/* Warnings */}
                            {(flight.flights[0].overnight || flight.flights[0].often_delayed_by_over_30_min) && (
                              <div className="mt-4 space-y-2">
                                {flight.flights[0].overnight && (
                                  <div className="flex items-center gap-2">
                                    <Moon className="h-4 w-4 text-amber-500" />
                                    <p className="text-sm text-amber-600">Overnight flight</p>
                                  </div>
                                )}
                                {flight.flights[0].often_delayed_by_over_30_min && (
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    <p className="text-sm text-red-600">Often delayed by over 30 minutes</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Booking Button */}
                            {flight.booking_link && (
                              <div className="mt-6 flex justify-end">
                                <Button 
                                  className="bg-[#C5A059] hover:bg-[#B08040] text-white"
                                  onClick={() => window.open(flight.booking_link, '_blank')}
                                >
                                  Book Flight
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tips" className="mt-0">
                <div className="space-y-6">
                  {tips.map((tip) => (
                    <div key={tip.id} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-start gap-4">
                        {tip.logo && (
                          <div className="w-12 h-12 flex-shrink-0">
                            <img 
                              src={tip.logo} 
                              alt={tip.title} 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#C5A059] mb-2">{tip.title}</h3>
                          <p className="text-gray-600">{tip.description}</p>
                          
                          {/* Service Logos Section */}
                          {tip.services && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                              {tip.services.map((service, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                  <div className="h-12 mb-2">
                                    <img 
                                      src={service.logo} 
                                      alt={service.name} 
                                      className="h-full w-auto object-contain mx-auto"
                                    />
                                  </div>
                                  <h4 className="text-sm font-medium text-center mb-1">{service.name}</h4>
                                  <p className="text-xs text-gray-600 text-center">{service.description}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Regular Tips Items */}
                          {tip.items && (
                            <div className="mt-4 space-y-2">
                              {tip.items.map((item, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <div className="h-2 w-2 rounded-full bg-[#C5A059] mt-2" />
                                  <p className="text-sm text-gray-600">{item.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="map" className="mt-0">
                {travelPlan?.itinerary ? (
                  <ItineraryMap itinerary={travelPlan.itinerary}/>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Generate an itinerary to view the interactive map</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Add this at the end, just before the closing div */}
      <div className="fixed bottom-4 right-4 z-50">
        <elevenlabs-convai agent-id="AuSkt4mCZj4WDLTrAm3w"></elevenlabs-convai>
        <Script 
          src="https://elevenlabs.io/convai-widget/index.js" 
          async type ="text/javascript"></Script>
      </div>
    </div>
  )
} 

// Add the weather icon helper function near your other utility functions
const getWeatherIcon = (weatherMain: string | undefined) => {
  switch (weatherMain?.toLowerCase()) {
    case 'clear':
      return <Sun className="h-5 w-5 text-yellow-500" />;
    case 'clouds':
      return <Cloud className="h-5 w-5 text-gray-500" />;
    case 'rain':
      return <CloudRain className="h-5 w-5 text-blue-500" />;
    case 'thunderstorm':
      return <AlertTriangle className="h-5 w-5 text-purple-500" />;
    case 'snow':
      return <Cloud className="h-5 w-5 text-blue-200" />;
    case 'mist':
    case 'fog':
      return <Cloud className="h-5 w-5 text-gray-400" />;
    default:
      return <Sun className="h-5 w-5 text-yellow-500" />;
  }
};

// Add this helper function near your other utility functions
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  
  return remainingMinutes === 0 
    ? `${hours}h` 
    : `${hours}h ${remainingMinutes}m`;
};

// Add this custom style object near your other styles
const calendarStyles = {
  '.rdrDayToday .rdrDayNumber span:after': {
    background: '#C5A059' // Gold color matching your primaryColor
  },
  '.rdrSelected, .rdrInRange, .rdrStartEdge, .rdrEndEdge': {
    background: '#C5A059'
  },
  '.rdrDayHovered .rdrDayNumber span': {
    borderColor: '#C5A059'
  },
  '.rdrDayStartPreview, .rdrDayInPreview, .rdrDayEndPreview': {
    borderColor: '#C5A059',
    color: '#C5A059'
  },
  '.rdrDateRangeWrapper .rdrDateDisplayWrapper': {
    backgroundColor: '#fff'
  },
  '.rdrDateDisplayItem input': {
    color: '#C5A059'
  }
};

