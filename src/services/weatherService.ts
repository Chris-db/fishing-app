import { WEATHER_API_KEY, SOLUNAR_API_KEY } from '../constants/config';

export interface WeatherData {
  temperature: number;
  pressure: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  description: string;
  icon: string;
  visibility?: number;
  uvIndex?: number;
  dewPoint?: number;
  feelsLike?: number;
}

export interface SolunarData {
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  moonPhase: string;
  moonIllumination: number;
  moonAge: number;
  moonDistance: number;
  sunDistance: number;
  solunarPeriods: SolunarPeriod[];
  bestFishingTimes: string[];
  moonPhaseIcon: string;
}

export interface SolunarPeriod {
  type: 'major' | 'minor';
  start: string;
  end: string;
  rating: number;
}

export interface TideData {
  current: number;
  nextHigh: { time: string; height: number };
  nextLow: { time: string; height: number };
  waterTemp: number;
  tidePhase: string;
  tideRange: number;
  tideVelocity: number;
  nextTideChange: { time: string; type: 'high' | 'low' };
  tideChart: TidePoint[];
}

export interface TidePoint {
  time: string;
  height: number;
}

export interface WaterConditions {
  temperature: number;
  clarity: 'clear' | 'slightly_murky' | 'murky' | 'very_murky';
  color: string;
  depth: number;
  current: 'none' | 'light' | 'moderate' | 'strong';
  structure: string[];
  vegetation: string[];
}

export interface FishingConditions {
  rating: number;
  conditions: string;
  factors: string[];
  recommendation: string;
}

export class WeatherService {
  static async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`
      );
      const data = await response.json();
      
      return {
        temperature: data.main.temp,
        pressure: data.main.pressure,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        cloudCover: data.clouds.all,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        visibility: data.visibility ? data.visibility / 1000 : undefined,
        uvIndex: data.uvi,
        dewPoint: data.main.dew_point,
        feelsLike: data.main.feels_like,
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      throw error;
    }
  }

  static async getForecast(lat: number, lng: number): Promise<WeatherData[]> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`
      );
      const data = await response.json();
      
      return data.list.slice(0, 8).map((item: any) => ({
        temperature: item.main.temp,
        pressure: item.main.pressure,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        windDirection: item.wind.deg,
        cloudCover: item.clouds.all,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
      }));
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }

  static async getSolunarData(lat: number, lng: number, date: Date): Promise<SolunarData> {
    try {
      // Enhanced solunar calculation with more accurate data
      const dateStr = date.toISOString().split('T')[0];
      
      // For now, using enhanced mock data with realistic calculations
      // In production, integrate with solunar API like solunar.org
      const moonPhase = this.calculateMoonPhase(date);
      const solunarPeriods = this.calculateSolunarPeriods(lat, lng, date);
      
      return {
        sunrise: '06:30',
        sunset: '18:45',
        moonrise: '14:20',
        moonset: '02:15',
        moonPhase: moonPhase.name,
        moonIllumination: moonPhase.illumination,
        moonAge: moonPhase.age,
        moonDistance: 384400, // km
        sunDistance: 149600000, // km
        solunarPeriods: solunarPeriods,
        bestFishingTimes: this.getBestFishingTimes(solunarPeriods),
        moonPhaseIcon: moonPhase.icon,
      };
    } catch (error) {
      console.error('Error fetching solunar data:', error);
      throw error;
    }
  }

  private static calculateMoonPhase(date: Date) {
    // Simplified moon phase calculation
    const knownNewMoon = new Date('2024-01-11T11:57:00Z');
    const lunarCycle = 29.53059; // days
    const daysSinceNewMoon = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const phase = ((daysSinceNewMoon % lunarCycle) / lunarCycle) * 360;
    
    let name: string;
    let icon: string;
    let illumination: number;
    
    if (phase < 45) {
      name = 'New Moon';
      icon = '🌑';
      illumination = 0;
    } else if (phase < 90) {
      name = 'Waxing Crescent';
      icon = '🌒';
      illumination = Math.round((phase - 45) * 2.2);
    } else if (phase < 135) {
      name = 'First Quarter';
      icon = '🌓';
      illumination = 50;
    } else if (phase < 180) {
      name = 'Waxing Gibbous';
      icon = '🌔';
      illumination = Math.round(50 + (phase - 135) * 1.1);
    } else if (phase < 225) {
      name = 'Full Moon';
      icon = '🌕';
      illumination = 100;
    } else if (phase < 270) {
      name = 'Waning Gibbous';
      icon = '🌖';
      illumination = Math.round(100 - (phase - 225) * 1.1);
    } else if (phase < 315) {
      name = 'Last Quarter';
      icon = '🌗';
      illumination = 50;
    } else {
      name = 'Waning Crescent';
      icon = '🌘';
      illumination = Math.round(50 - (phase - 315) * 1.1);
    }
    
    return {
      name,
      icon,
      illumination: Math.max(0, Math.min(100, illumination)),
      age: Math.round(daysSinceNewMoon % lunarCycle),
    };
  }

  private static calculateSolunarPeriods(lat: number, lng: number, date: Date): SolunarPeriod[] {
    // Simplified solunar calculation
    // In production, use proper astronomical calculations
    const periods: SolunarPeriod[] = [];
    
    // Major periods (sunrise/sunset)
    periods.push({
      type: 'major',
      start: '06:30',
      end: '08:30',
      rating: 8,
    });
    
    periods.push({
      type: 'major',
      start: '18:00',
      end: '20:00',
      rating: 9,
    });
    
    // Minor periods (moonrise/moonset)
    periods.push({
      type: 'minor',
      start: '14:20',
      end: '16:20',
      rating: 6,
    });
    
    periods.push({
      type: 'minor',
      start: '02:15',
      end: '04:15',
      rating: 7,
    });
    
    return periods;
  }

  private static getBestFishingTimes(periods: SolunarPeriod[]): string[] {
    return periods
      .filter(p => p.rating >= 7)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
      .map(p => `${p.start} - ${p.end}`);
  }

  static async getTideData(lat: number, lng: number): Promise<TideData> {
    try {
      // Enhanced tide data with more comprehensive information
      // In production, integrate with tide API like WorldTides or TidesandCurrents
      const tideChart = this.generateTideChart();
      
      return {
        current: 2.1,
        nextHigh: { time: '14:30', height: 3.2 },
        nextLow: { time: '08:15', height: 0.8 },
        waterTemp: 18.5,
        tidePhase: 'Rising',
        tideRange: 2.4,
        tideVelocity: 0.3,
        nextTideChange: { time: '14:30', type: 'high' },
        tideChart: tideChart,
      };
    } catch (error) {
      console.error('Error fetching tide data:', error);
      throw error;
    }
  }

  private static generateTideChart(): TidePoint[] {
    // Generate 24-hour tide chart
    const chart: TidePoint[] = [];
    const baseHeight = 2.0;
    const amplitude = 1.5;
    
    for (let hour = 0; hour < 24; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const height = baseHeight + amplitude * Math.sin((hour - 6) * Math.PI / 12);
      chart.push({ time, height: Math.round(height * 10) / 10 });
    }
    
    return chart;
  }

  static async getWaterConditions(lat: number, lng: number): Promise<WaterConditions> {
    try {
      // In production, integrate with water quality APIs or user reports
      return {
        temperature: 18.5,
        clarity: 'clear',
        color: 'blue-green',
        depth: 15,
        current: 'light',
        structure: ['rocks', 'weed_beds', 'drop_offs'],
        vegetation: ['lily_pads', 'cattails', 'submerged_grass'],
      };
    } catch (error) {
      console.error('Error fetching water conditions:', error);
      throw error;
    }
  }

  static calculateFishingConditions(weather: WeatherData, solunar?: SolunarData, tide?: TideData, waterConditions?: WaterConditions): FishingConditions {
    let rating = 5; // Base rating
    const factors: string[] = [];
    let conditions = 'Fair';
    let recommendation = 'Decent conditions for fishing';

    // Pressure analysis (most important factor)
    if (weather.pressure > 1013) {
      rating += 2;
      factors.push('High pressure - fish are active');
    } else if (weather.pressure > 1000) {
      rating += 1;
      factors.push('Stable pressure');
    } else if (weather.pressure < 990) {
      rating -= 2;
      factors.push('Low pressure - fish may be sluggish');
    } else {
      rating -= 1;
      factors.push('Falling pressure');
    }

    // Wind analysis
    if (weather.windSpeed < 5) {
      rating += 1;
      factors.push('Calm conditions');
    } else if (weather.windSpeed < 15) {
      rating += 1;
      factors.push('Light winds - good for fishing');
    } else if (weather.windSpeed > 25) {
      rating -= 2;
      factors.push('Strong winds - difficult conditions');
    } else {
      rating -= 1;
      factors.push('Moderate winds');
    }

    // Temperature analysis
    if (weather.temperature >= 15 && weather.temperature <= 25) {
      rating += 2;
      factors.push('Optimal temperature range');
    } else if (weather.temperature >= 10 && weather.temperature <= 30) {
      rating += 1;
      factors.push('Good temperature');
    } else if (weather.temperature < 5 || weather.temperature > 35) {
      rating -= 2;
      factors.push('Extreme temperature');
    } else {
      rating -= 1;
      factors.push('Suboptimal temperature');
    }

    // Cloud cover analysis
    if (weather.cloudCover < 20) {
      rating += 1;
      factors.push('Clear skies - good visibility');
    } else if (weather.cloudCover < 50) {
      rating += 1;
      factors.push('Partly cloudy - ideal conditions');
    } else if (weather.cloudCover > 80) {
      rating -= 1;
      factors.push('Heavy cloud cover');
    }

    // Humidity analysis
    if (weather.humidity >= 40 && weather.humidity <= 70) {
      rating += 1;
      factors.push('Comfortable humidity');
    } else if (weather.humidity > 85) {
      rating -= 1;
      factors.push('High humidity');
    }

    // Solunar analysis (if available)
    if (solunar) {
      // Moon phase analysis
      if (solunar.moonIllumination > 80 || solunar.moonIllumination < 20) {
        rating += 2;
        factors.push('Excellent moon phase');
      } else if (solunar.moonIllumination > 60 || solunar.moonIllumination < 40) {
        rating += 1;
        factors.push('Good moon phase');
      }

      // Best fishing times analysis
      const currentTime = new Date().toTimeString().slice(0, 5);
      const isBestTime = solunar.bestFishingTimes.some(time => {
        const [start, end] = time.split(' - ');
        return currentTime >= start && currentTime <= end;
      });

      if (isBestTime) {
        rating += 2;
        factors.push('Prime fishing time');
      }
    }

    // Tide analysis (if available)
    if (tide) {
      if (tide.tidePhase === 'Rising' || tide.tidePhase === 'Falling') {
        rating += 1;
        factors.push('Active tide movement');
      }
      
      if (tide.current > 1.5 && tide.current < 3.0) {
        rating += 1;
        factors.push('Good tide height');
      } else if (tide.current < 1.0 || tide.current > 4.0) {
        rating -= 1;
        factors.push('Extreme tide conditions');
      }
    }

    // Water conditions analysis (if available)
    if (waterConditions) {
      if (waterConditions.clarity === 'clear') {
        rating += 1;
        factors.push('Clear water');
      } else if (waterConditions.clarity === 'very_murky') {
        rating -= 1;
        factors.push('Murky water');
      }

      if (waterConditions.current === 'light') {
        rating += 1;
        factors.push('Light current');
      } else if (waterConditions.current === 'strong') {
        rating -= 1;
        factors.push('Strong current');
      }
    }

    // Time of day analysis
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour <= 8) {
      rating += 1;
      factors.push('Early morning - prime time');
    } else if (currentHour >= 17 && currentHour <= 20) {
      rating += 1;
      factors.push('Evening - good fishing time');
    } else if (currentHour >= 11 && currentHour <= 14) {
      rating -= 1;
      factors.push('Midday - slower fishing');
    }

    // Determine conditions and recommendation
    if (rating >= 8) {
      conditions = 'Excellent';
      recommendation = 'Perfect conditions! Get out there now!';
    } else if (rating >= 6) {
      conditions = 'Good';
      recommendation = 'Great day for fishing!';
    } else if (rating >= 4) {
      conditions = 'Fair';
      recommendation = 'Decent conditions, worth trying';
    } else if (rating >= 2) {
      conditions = 'Poor';
      recommendation = 'Challenging conditions, but still possible';
    } else {
      conditions = 'Terrible';
      recommendation = 'Very difficult conditions - consider waiting';
    }

    return {
      rating: Math.max(1, Math.min(10, rating)),
      conditions,
      factors,
      recommendation,
    };
  }

  static async getComprehensiveFishingConditions(lat: number, lng: number): Promise<{
    weather: WeatherData;
    solunar: SolunarData;
    tide: TideData;
    waterConditions: WaterConditions;
    fishingConditions: FishingConditions;
  }> {
    try {
      const [weather, solunar, tide, waterConditions] = await Promise.all([
        this.getCurrentWeather(lat, lng),
        this.getSolunarData(lat, lng, new Date()),
        this.getTideData(lat, lng),
        this.getWaterConditions(lat, lng),
      ]);

      const fishingConditions = this.calculateFishingConditions(weather, solunar, tide, waterConditions);

      return {
        weather,
        solunar,
        tide,
        waterConditions,
        fishingConditions,
      };
    } catch (error) {
      console.error('Error fetching comprehensive fishing conditions:', error);
      throw error;
    }
  }
}
