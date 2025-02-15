import { NextResponse } from 'next/server';
import { format, addDays } from 'date-fns';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const DUBAI_LAT = 25.2048;
const DUBAI_LON = 55.2708;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!OPENWEATHER_API_KEY) {
      throw new Error('OpenWeather API key is not configured');
    }

    // If dates are within 5 days, fetch actual weather data
    const url = new URL('https://api.openweathermap.org/data/2.5/forecast');
    url.searchParams.append('lat', DUBAI_LAT.toString());
    url.searchParams.append('lon', DUBAI_LON.toString());
    url.searchParams.append('appid', OPENWEATHER_API_KEY as string);
    url.searchParams.append('units', 'metric');

    console.log('Fetching weather from:', url.toString());
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw API response:', data);

    // Extract and format the forecast data
    const forecastData = data.list.map((item: any) => ({
      date: new Date(item.dt * 1000),
      temperature: Math.round(item.main.temp),
      condition: getWeatherCondition(item.weather[0].id),
      humidity: item.main.humidity,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      main: item.main,
      weather: item.weather[0]
    })).filter((item: any) => {
      const itemDate = format(item.date, 'yyyy-MM-dd');
      return (!startDate || itemDate >= startDate) && 
             (!endDate || itemDate <= endDate);
    });

    console.log('Formatted forecast data:', forecastData);

    return NextResponse.json({
      forecast: forecastData,
      city: data.city
    });

  } catch (error) {
    console.error('Weather API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

function getWeatherCondition(weatherId: number): 'sunny' | 'cloudy' | 'rainy' {
  if (weatherId >= 200 && weatherId < 600) return 'rainy';
  if (weatherId >= 600 && weatherId < 700) return 'cloudy';
  if (weatherId >= 700 && weatherId < 800) return 'cloudy';
  if (weatherId === 800) return 'sunny';
  if (weatherId > 800) return 'cloudy';
  return 'sunny';
} 