import * as FileSystem from 'expo-file-system';

export interface OfflineCatch {
  id: string;
  species: string;
  weight: number;
  length: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timestamp: string;
  weather?: {
    temperature: number;
    pressure: number;
    windSpeed: number;
    conditions: string;
  };
  bait?: string;
  technique?: string;
  notes?: string;
  photos?: string[];
  isOffline: boolean;
  synced: boolean;
}

export interface CachedWeather {
  data: any;
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
  };
  expiresAt: number;
}

export interface CachedSpecies {
  data: any[];
  timestamp: number;
  expiresAt: number;
}

class OfflineStorage {
  private baseDir = `${FileSystem.documentDirectory}offline/`;
  private catchesFile = `${this.baseDir}catches.json`;
  private weatherFile = `${this.baseDir}weather.json`;
  private speciesFile = `${this.baseDir}species.json`;

  async initialize(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.baseDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.baseDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  }

  // Catch Management
  async saveCatch(catchData: Omit<OfflineCatch, 'id' | 'isOffline' | 'synced'>): Promise<string> {
    await this.initialize();
    
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineCatch: OfflineCatch = {
      ...catchData,
      id,
      isOffline: true,
      synced: false,
    };

    const existingCatches = await this.getOfflineCatches();
    existingCatches.push(offlineCatch);
    
    await FileSystem.writeAsStringAsync(
      this.catchesFile,
      JSON.stringify(existingCatches, null, 2)
    );

    return id;
  }

  async getOfflineCatches(): Promise<OfflineCatch[]> {
    try {
      await this.initialize();
      const fileInfo = await FileSystem.getInfoAsync(this.catchesFile);
      
      if (!fileInfo.exists) {
        return [];
      }

      const content = await FileSystem.readAsStringAsync(this.catchesFile);
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read offline catches:', error);
      return [];
    }
  }

  async getPendingCatches(): Promise<OfflineCatch[]> {
    const catches = await this.getOfflineCatches();
    return catches.filter(catch => !catch.synced);
  }

  async markCatchAsSynced(id: string): Promise<void> {
    const catches = await this.getOfflineCatches();
    const updatedCatches = catches.map(catch => 
      catch.id === id ? { ...catch, synced: true } : catch
    );
    
    await FileSystem.writeAsStringAsync(
      this.catchesFile,
      JSON.stringify(updatedCatches, null, 2)
    );
  }

  async removeSyncedCatches(): Promise<void> {
    const catches = await this.getOfflineCatches();
    const pendingCatches = catches.filter(catch => !catch.synced);
    
    await FileSystem.writeAsStringAsync(
      this.catchesFile,
      JSON.stringify(pendingCatches, null, 2)
    );
  }

  // Weather Caching
  async cacheWeatherData(weatherData: any, location: { latitude: number; longitude: number }): Promise<void> {
    await this.initialize();
    
    const cachedWeather: CachedWeather = {
      data: weatherData,
      timestamp: Date.now(),
      location,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };

    await FileSystem.writeAsStringAsync(
      this.weatherFile,
      JSON.stringify(cachedWeather, null, 2)
    );
  }

  async getCachedWeather(location: { latitude: number; longitude: number }): Promise<any | null> {
    try {
      await this.initialize();
      const fileInfo = await FileSystem.getInfoAsync(this.weatherFile);
      
      if (!fileInfo.exists) {
        return null;
      }

      const content = await FileSystem.readAsStringAsync(this.weatherFile);
      const cached: CachedWeather = JSON.parse(content);
      
      // Check if expired
      if (Date.now() > cached.expiresAt) {
        return null;
      }

      // Check if location is close enough (within 5km)
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        cached.location.latitude,
        cached.location.longitude
      );

      if (distance > 5) {
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Failed to read cached weather:', error);
      return null;
    }
  }

  // Species Data Caching
  async cacheSpeciesData(speciesData: any[]): Promise<void> {
    await this.initialize();
    
    const cachedSpecies: CachedSpecies = {
      data: speciesData,
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };

    await FileSystem.writeAsStringAsync(
      this.speciesFile,
      JSON.stringify(cachedSpecies, null, 2)
    );
  }

  async getCachedSpeciesData(): Promise<any[] | null> {
    try {
      await this.initialize();
      const fileInfo = await FileSystem.getInfoAsync(this.speciesFile);
      
      if (!fileInfo.exists) {
        return null;
      }

      const content = await FileSystem.readAsStringAsync(this.speciesFile);
      const cached: CachedSpecies = JSON.parse(content);
      
      // Check if expired
      if (Date.now() > cached.expiresAt) {
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Failed to read cached species data:', error);
      return null;
    }
  }

  // Photo Management
  async saveOfflinePhoto(uri: string, catchId: string): Promise<string> {
    await this.initialize();
    
    const photoDir = `${this.baseDir}photos/`;
    const dirInfo = await FileSystem.getInfoAsync(photoDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(photoDir, { intermediates: true });
    }

    const fileName = `${catchId}_${Date.now()}.jpg`;
    const destination = `${photoDir}${fileName}`;
    
    await FileSystem.copyAsync({
      from: uri,
      to: destination,
    });

    return destination;
  }

  async getOfflinePhoto(photoPath: string): Promise<string | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(photoPath);
      return fileInfo.exists ? photoPath : null;
    } catch (error) {
      console.error('Failed to get offline photo:', error);
      return null;
    }
  }

  // Utility Methods
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in kilometers
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Cleanup
  async clearExpiredData(): Promise<void> {
    try {
      // Clear expired weather data
      const weatherInfo = await FileSystem.getInfoAsync(this.weatherFile);
      if (weatherInfo.exists) {
        const content = await FileSystem.readAsStringAsync(this.weatherFile);
        const cached: CachedWeather = JSON.parse(content);
        
        if (Date.now() > cached.expiresAt) {
          await FileSystem.deleteAsync(this.weatherFile);
        }
      }

      // Clear expired species data
      const speciesInfo = await FileSystem.getInfoAsync(this.speciesFile);
      if (speciesInfo.exists) {
        const content = await FileSystem.readAsStringAsync(this.speciesFile);
        const cached: CachedSpecies = JSON.parse(content);
        
        if (Date.now() > cached.expiresAt) {
          await FileSystem.deleteAsync(this.speciesFile);
        }
      }
    } catch (error) {
      console.error('Failed to clear expired data:', error);
    }
  }
}

export const offlineStorage = new OfflineStorage();
