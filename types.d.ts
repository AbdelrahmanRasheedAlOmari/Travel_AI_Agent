declare module 'ics' {
  interface EventAttributes {
    start: [number, number, number, number, number]
    duration: { hours: number }
    title: string
    description: string
    location: string
  }

  export function createEvents(
    events: EventAttributes[],
    callback: (error: Error | undefined, value: string) => void
  ): void
}

declare module 'react-beautiful-dnd' {
  import * as React from 'react'

  export interface DraggableProvided {
    draggableProps: any
    dragHandleProps: any
    innerRef: (element: HTMLElement | null) => void
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean
  }

  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void
    droppableProps: any
    placeholder?: React.ReactElement
  }

  export interface DraggableProps {
    draggableId: string
    index: number
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactElement
  }

  export interface DroppableProps {
    droppableId: string
    children: (provided: DroppableProvided) => React.ReactElement
  }

  export interface DragDropContextProps {
    children: React.ReactNode
    onDragEnd: (result: any) => void
  }

  export const DragDropContext: React.FC<DragDropContextProps>
  export class Droppable extends React.Component<DroppableProps> {}
  export class Draggable extends React.Component<DraggableProps> {}
}

declare module 'react-day-picker' {
  export interface DayPickerProps {
    mode?: 'single' | 'multiple' | 'range';
    selected?: Date | Date[] | { from: Date | undefined; to: Date | undefined } | undefined;
    onSelect?: (date: Date | { from: Date | undefined; to: Date | undefined } | undefined) => void;
    disabled?: (date: Date) => boolean;
    className?: string;
  }

  export const DayPicker: React.FC<DayPickerProps>
}

declare module '@radix-ui/react-popover' {
  export interface PopoverContentProps extends RadixComponentProps {
    align?: 'start' | 'center' | 'end'
    sideOffset?: number
  }

  export const Root: React.FC<RadixComponentProps>
  export const Trigger: React.FC<RadixComponentProps & { asChild?: boolean }>
  export const Content: React.FC<PopoverContentProps>
  export const Portal: React.FC<RadixComponentProps>
}

declare module '@radix-ui/react-scroll-area' {
  export interface ScrollAreaProps extends RadixComponentProps {
    type?: 'auto' | 'always' | 'scroll' | 'hover'
    scrollHideDelay?: number
  }

  export const Root: React.FC<ScrollAreaProps>
  export const Viewport: React.FC<RadixComponentProps>
  export const Scrollbar: React.FC<RadixComponentProps & { orientation?: "vertical" | "horizontal" }>
  export const ScrollAreaThumb: React.FC<RadixComponentProps>
  export const Corner: React.FC<RadixComponentProps>
}

declare module '@radix-ui/react-select' {
  export interface SelectProps extends RadixComponentProps {
    onValueChange?: (value: string) => void
    value?: string
    defaultValue?: string
  }

  export interface SelectValueProps extends RadixComponentProps {
    placeholder?: string
  }

  export const Root: React.FC<SelectProps>
  export const Trigger: React.FC<RadixComponentProps>
  export const Value: React.FC<SelectValueProps>
  export const Portal: React.FC<RadixComponentProps>
  export const Content: React.FC<RadixComponentProps>
  export const Viewport: React.FC<RadixComponentProps>
  export const Item: React.FC<RadixComponentProps & { value: string }>
  export const ItemText: React.FC<RadixComponentProps>
  export const ItemIndicator: React.FC<RadixComponentProps>
  export const Group: React.FC<RadixComponentProps>
}

declare module '@radix-ui/react-tabs' {
  export interface TabsProps extends RadixComponentProps {
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
  }

  export const Root: React.FC<TabsProps>
  export const List: React.FC<RadixComponentProps>
  export const Trigger: React.FC<RadixComponentProps & { value: string }>
  export const Content: React.FC<RadixComponentProps & { value: string }>
}

declare module 'lucide-react' {
  export const Clock: React.FC<{ className?: string }>
  export const MapPin: React.FC<{ className?: string }>
  export const Utensils: React.FC<{ className?: string }>
  export const Palmtree: React.FC<{ className?: string }>
  export const Camera: React.FC<{ className?: string }>
  export const Car: React.FC<{ className?: string }>
  export const Ticket: React.FC<{ className?: string }>
  export const Send: React.FC<{ className?: string }>
  export const Globe: React.FC<{ className?: string }>
  export const User: React.FC<{ className?: string }>
  export const CalendarIcon: React.FC<{ className?: string }>
  export const Cloud: React.FC<{ className?: string }>
  export const Sun: React.FC<{ className?: string }>
  export const Droplets: React.FC<{ className?: string }>
  export const RefreshCw: React.FC<{ className?: string }>
  export const Star: React.FC<{ className?: string }>
  export const ChevronRight: React.FC<{ className?: string }>
  export const ChevronLeft: React.FC<{ className?: string }>
  export const ChevronDown: React.FC<{ className?: string }>
  export const CalendarPlus: React.FC<{ className?: string }>
  export const ThumbsUp: React.FC<{ className?: string }>
  export const MessageSquare: React.FC<{ className?: string }>
  export const Share2: React.FC<{ className?: string }>
  export const DollarSign: React.FC<{ className?: string }>
  export const Percent: React.FC<{ className?: string }>
  export const Check: React.FC<{ className?: string }>
  export const MoonStar: React.FC<{ className?: string }>
  export const TriangleAlert: React.FC<{ className?: string }>
  export const Wifi: React.FC<{ className?: string }>
  export const Waves: React.FC<{ className?: string }>
  export const Sparkles: React.FC<{ className?: string }>
  export const Wine: React.FC<{ className?: string }>
  export const ChefHat: React.FC<{ className?: string }>
  export const Shirt: React.FC<{ className?: string }>
  export const Wind: React.FC<{ className?: string }>
  export const Dumbbell: React.FC<{ className?: string }>
  export const Compass: React.FC<{ className?: string }>
  export const Plane: React.FC<{ className?: string }>
  export const MonitorPlay: React.FC<{ className?: string }>
  export const CloudRain: React.FC<{ className?: string }>
  export const CloudSnow: React.FC<{ className?: string }>
  export const CloudFog: React.FC<{ className?: string }>
  export const CloudLightning: React.FC<{ className?: string }>
  export const CloudMoon: React.FC<{ className?: string }>
  export const CloudSun: React.FC<{ className?: string }>
  export const Google: React.FC<{ className?: string }>
  export const ArrowUp: React.FC<{ className?: string }>
  export const ArrowDown: React.FC<{ className?: string }>
  export const Thermometer: React.FC<{ className?: string }>
  export const Gauge: React.FC<{ className?: string }>
  export const Luggage: React.FC<{ className?: string }>
  export const Phone: React.FC<{ className?: string }>
  export const ArrowUpRight: React.FC<{ className?: string }>
  export const Calendar: React.FC<{ className?: string }>
  export const Leaf: React.FC<{ className?: string }>
  export const AlertTriangle: React.FC<{ className?: string }>
  export const Moon: React.FC<{ className?: string }>
  export const AlertCircle: React.FC<{ className?: string }>
  export const CloudDrizzle: React.FC<{ className?: string }>
  export const Heart: React.FC<{ className?: string }>

declare module 'clsx' {
  export type ClassValue = string | number | boolean | undefined | null | ClassValue[]
  export default function clsx(...inputs: ClassValue[]): string
}

declare module 'tailwind-merge' {
  export function twMerge(...inputs: string[]): string
}

interface RadixComponentProps {
  children?: React.ReactNode
  className?: string
  ref?: React.Ref<any>
}

declare module 'framer-motion' {
  export interface MotionProps {
    initial?: any
    animate?: any
    exit?: any
    transition?: any
    className?: string
    children?: React.ReactNode
  }

  export const motion: {
    div: React.FC<MotionProps & React.HTMLAttributes<HTMLDivElement>>
  }
  export const AnimatePresence: React.FC<{ children: React.ReactNode }>
}

declare module 'serpapi' {
  export function getJson(params: {
    engine: string;
    q: string;
    check_in_date: string;
    check_out_date: string;
    adults: number;
    currency: string;
    max_price?: number;
    api_key: string;
  }): Promise<any>;
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
    booking_options?: BookingOption[];
  }>;
  total_duration: number;
  carbon_emissions: {
    this_flight: number;
    typical_for_this_route: number;
    difference_percent: number;
  };
  price: string;
  type: string;
  booking_link: string;
  departure?: string;
  arrival?: string;
  duration?: string;
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

interface TravelPlanResult {
  itinerary: {
    day: number;
    activities: (string | Activity)[];
  }[];
  flights?: Flight[];
  hotels?: Hotel[];
  messages?: Array<{
    role: string;
    content: string;
  }>;
}

interface CalendarEvent {
  start: [number, number, number, number, number];
  duration: { hours: number };
  title: string;
  description: string;
  location: string;
}

// Update the TipItem interface to include the type property
interface TipItem {
  id: string;
  title: string;
  description: string;
  type?: 'basic' | 'service' | 'transport';
  logo?: string;
  services?: Array<{
    name: string;
    logo: string;
    description: string;
  }>;
  items?: Array<{
    name: string;
    description: string;
  }>;
}

// Update the tip data structure
interface Tip {
  id: string;
  title: string;
  description: string;
  category: string;
  items: TipItem[];
}

// Add this new interface for interest options
interface InterestOption {
  label: string;
  icon: string | React.ReactNode;
  description: string;
  color?: string;
  component?: React.ReactNode;
  category: string;
}

interface MessageOptions {
  type: 'destination' | 'dateRange' | 'group-size' | 'budget' | 'interests' | 'departure';
  data?: Array<InterestOption>;  // Use the new interface here
  multiSelect?: boolean;  // Make sure this is defined
  selectedOptions?: string[];
} }

interface BookingOption {
  book_with: string;
  price: number;
  local_prices?: {
    currency: string;
    price: number;
  }[];
  option_title: string;
  extensions: string[];
  baggage_prices: string[];
}