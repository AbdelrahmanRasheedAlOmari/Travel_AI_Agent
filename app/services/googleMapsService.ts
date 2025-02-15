import { Loader } from '@googlemaps/js-api-loader';

export class GoogleMapsService {
  private static loader: Loader;
  private static cache = new Map<string, google.maps.LatLngLiteral>();
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;

    try {
      this.loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: 'weekly',
        libraries: ['places']
      });

      await this.loader.load();
      
      // Wait for the maps library to be available
      await new Promise<void>((resolve) => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          const checkGoogle = setInterval(() => {
            if (window.google && window.google.maps) {
              clearInterval(checkGoogle);
              resolve();
            }
          }, 100);
        }
      });

      this.initialized = true;
      console.log('Google Maps Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
      throw error;
    }
  }

  static async getCoordinates(location: string): Promise<google.maps.LatLngLiteral> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.cache.has(location)) {
      return this.cache.get(location)!;
    }

    const geocoder = new google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({
        address: `${location}, Dubai, UAE`
      });

      if (response.results[0]?.geometry?.location) {
        const coords = {
          lat: response.results[0].geometry.location.lat(),
          lng: response.results[0].geometry.location.lng()
        };
        this.cache.set(location, coords);
        return coords;
      }
      
      throw new Error('Location not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      return { lat: 25.2048, lng: 55.2708 }; // Dubai downtown default
    }
  }

  static async getPlacePhoto(location: string): Promise<string | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const placesService = new google.maps.places.PlacesService(document.createElement('div'));
      
      return new Promise((resolve) => {
        placesService.findPlaceFromQuery(
          {
            query: `${location}, Dubai`,
            fields: ['photos']
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.photos?.[0]) {
              resolve(results[0].photos[0].getUrl({ maxWidth: 400 }));
            } else {
              resolve(null);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error getting place photo:', error);
      return null;
    }
  }
}