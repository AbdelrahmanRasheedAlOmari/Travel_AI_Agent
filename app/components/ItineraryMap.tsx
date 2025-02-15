import React, { useEffect, useRef, useState } from 'react';
import { GoogleMapsService } from '../services/googleMapsService';
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Card } from "./ui/card";

interface Activity {
  location: string;
  title: string;
  description: string;
  time: string;
  tip?: string;
  placeImage?: string;
}

interface DayItinerary {
  day: number;
  activities: Activity[];
}

interface ItineraryMapProps {
  itinerary: DayItinerary[];
}

const ItineraryMap: React.FC<ItineraryMapProps> = ({ itinerary }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [hoveredActivity, setHoveredActivity] = useState<string | null>(null);
  const [activitiesWithImages, setActivitiesWithImages] = useState<Map<string, string>>(new Map());
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  // Initialize map once and keep it mounted
  useEffect(() => {
    const initMap = async () => {
      try {
        await GoogleMapsService.initialize();
        
        if (!mapRef.current) return;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 25.2048, lng: 55.2708 },
          zoom: 12,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        setMap(mapInstance);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, []);

  // Load locations and place images when map is ready
  useEffect(() => {
    const loadLocationsAndImages = async () => {
      if (!map || !itinerary) return;

      setIsLoading(true);
      
      // Clear all existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current.clear();
      
      const bounds = new google.maps.LatLngBounds();
      const newImages = new Map<string, string>();

      try {
        const dayActivities = itinerary.find(day => day.day === selectedDay)?.activities || [];
        
        // Reset activities with images for the new day
        setActivitiesWithImages(new Map());

        for (const activity of dayActivities) {
          try {
            const position = await GoogleMapsService.getCoordinates(activity.location);
            bounds.extend(position);

            const placeImage = await GoogleMapsService.getPlacePhoto(activity.location);
            if (placeImage) {
              newImages.set(activity.title, placeImage);
            }

            // Create marker with label
            const marker = new google.maps.Marker({
              position,
              map,
              title: activity.title,
              label: hoveredActivity === activity.title ? {
                text: activity.title,
                color: '#FFFFFF',
                fontSize: '14px',
                className: 'marker-label'
              } : null,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#C5A059',
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: '#FFFFFF',
                scale: hoveredActivity === activity.title ? 12 : 8
              }
            });

            markersRef.current.set(activity.title, marker);
          } catch (error) {
            console.error(`Error loading location: ${activity.location}`, error);
          }
        }

        setActivitiesWithImages(newImages);

        if (markersRef.current.size > 0) {
          map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        }
      } catch (error) {
        console.error('Error loading locations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocationsAndImages();
  }, [map, itinerary, selectedDay]);

  // Add styles for marker labels
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .marker-label {
        background-color: #C5A059;
        padding: 4px 8px;
        border-radius: 4px;
        white-space: nowrap;
        transform: translateY(-24px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(style);

    // Return a cleanup function that removes the style element
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Update markers on hover
  useEffect(() => {
    markersRef.current.forEach((marker, title) => {
      marker.setLabel(hoveredActivity === title ? {
        text: title,
        color: '#FFFFFF',
        fontSize: '14px',
        className: 'marker-label'
      } : null);
      
      const icon = marker.getIcon() as google.maps.Symbol;
      marker.setIcon({
        ...icon,
        scale: hoveredActivity === title ? 12 : 8
      });
    });
  }, [hoveredActivity]);

  return (
    <div className="space-y-6 pt-6">
      <h2 className="text-2xl font-bold text-gray-900 text-center">Visualize Your Journey</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div ref={mapRef} className="h-[600px] w-full rounded-lg overflow-hidden" />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
            <Button
              onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
              disabled={selectedDay === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="font-semibold">Day {selectedDay}</span>
            
            <Button
              onClick={() => setSelectedDay(Math.min(itinerary.length, selectedDay + 1))}
              disabled={selectedDay === itinerary.length}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
            {itinerary
              .find(day => day.day === selectedDay)
              ?.activities.map((activity, index) => (
                <Card 
                  key={index} 
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onMouseEnter={() => setHoveredActivity(activity.title)}
                  onMouseLeave={() => setHoveredActivity(null)}
                >
                  {activitiesWithImages.get(activity.title) && (
                    <img
                      src={activitiesWithImages.get(activity.title)}
                      alt={activity.title}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{activity.title}</h3>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{activity.location}</span>
                    </div>
                    {activity.tip && (
                      <p className="text-sm italic text-gray-500">Tip: {activity.tip}</p>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryMap; 