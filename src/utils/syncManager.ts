import { offlineStorage, OfflineCatch } from './offlineStorage';
import { supabase } from '../services/supabase';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

class SyncManager {
  private isSyncing = false;

  async syncOfflineCatches(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ['Sync already in progress'],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      const pendingCatches = await offlineStorage.getPendingCatches();
      
      for (const catchData of pendingCatches) {
        try {
          // Convert offline catch to database format
          const dbCatch = {
            species: catchData.species,
            weight: catchData.weight,
            length: catchData.length,
            latitude: catchData.location.latitude,
            longitude: catchData.location.longitude,
            caught_at: catchData.timestamp,
            weather_temperature: catchData.weather?.temperature,
            weather_pressure: catchData.weather?.pressure,
            weather_wind_speed: catchData.weather?.windSpeed,
            weather_conditions: catchData.weather?.conditions,
            bait_used: catchData.bait,
            technique: catchData.technique,
            notes: catchData.notes,
            photos: catchData.photos || [],
          };

          // Insert into database
          const { error } = await supabase
            .from('catches')
            .insert([dbCatch]);

          if (error) {
            throw error;
          }

          // Mark as synced
          await offlineStorage.markCatchAsSynced(catchData.id);
          result.syncedCount++;
          
        } catch (error) {
          console.error('Failed to sync catch:', catchData.id, error);
          result.failedCount++;
          result.errors.push(`Catch ${catchData.id}: ${error.message}`);
        }
      }

      // Clean up synced catches
      await offlineStorage.removeSyncedCatches();
      
    } catch (error) {
      console.error('Sync failed:', error);
      result.success = false;
      result.errors.push(`Sync failed: ${error.message}`);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  async syncWeatherData(location: { latitude: number; longitude: number }): Promise<void> {
    try {
      // Check if we have cached weather data
      const cachedWeather = await offlineStorage.getCachedWeather(location);
      
      if (cachedWeather) {
        return; // Use cached data
      }

      // Fetch fresh weather data
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&appid=YOUR_API_KEY&units=metric`
      );
      
      if (response.ok) {
        const weatherData = await response.json();
        await offlineStorage.cacheWeatherData(weatherData, location);
      }
    } catch (error) {
      console.error('Failed to sync weather data:', error);
    }
  }

  async syncSpeciesData(): Promise<void> {
    try {
      // Check if we have cached species data
      const cachedSpecies = await offlineStorage.getCachedSpeciesData();
      
      if (cachedSpecies) {
        return; // Use cached data
      }

      // Fetch fresh species data from database
      const { data: species, error } = await supabase
        .from('fish_species')
        .select('*');

      if (error) {
        throw error;
      }

      if (species) {
        await offlineStorage.cacheSpeciesData(species);
      }
    } catch (error) {
      console.error('Failed to sync species data:', error);
    }
  }

  async performFullSync(): Promise<SyncResult> {
    const results: SyncResult[] = [];

    // Sync catches
    const catchResult = await this.syncOfflineCatches();
    results.push(catchResult);

    // Sync weather and species data in background
    this.syncWeatherData({ latitude: 0, longitude: 0 }).catch(console.error);
    this.syncSpeciesData().catch(console.error);

    // Combine results
    return {
      success: results.every(r => r.success),
      syncedCount: results.reduce((sum, r) => sum + r.syncedCount, 0),
      failedCount: results.reduce((sum, r) => sum + r.failedCount, 0),
      errors: results.flatMap(r => r.errors),
    };
  }

  getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

export const syncManager = new SyncManager();
