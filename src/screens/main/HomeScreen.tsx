import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WeatherService, WeatherData, FishingConditions } from '../../services/weatherService';
import { APP_COLORS, FISHING_CONDITIONS } from '../../constants/config';

export default function HomeScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [fishingConditions, setFishingConditions] = useState<FishingConditions | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getLocationAndWeather();
  }, []);

  const getLocationAndWeather = async () => {
    try {
      setLoading(true);
      
      // Get location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for weather data');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setLocation(coords);

      // Get weather data
      const weatherData = await WeatherService.getCurrentWeather(coords.lat, coords.lng);
      setWeather(weatherData);

      // Calculate fishing conditions
      const conditions = WeatherService.calculateFishingConditions(weatherData);
      setFishingConditions(conditions);

    } catch (error) {
      console.error('Error fetching weather:', error);
      Alert.alert('Error', 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getLocationAndWeather();
    setRefreshing(false);
  };

  const getConditionColor = (rating: number) => {
    if (rating >= 8) return FISHING_CONDITIONS.EXCELLENT.color;
    if (rating >= 6) return FISHING_CONDITIONS.GOOD.color;
    if (rating >= 4) return FISHING_CONDITIONS.FAIR.color;
    if (rating >= 2) return FISHING_CONDITIONS.POOR.color;
    return FISHING_CONDITIONS.TERRIBLE.color;
  };

  const getConditionLabel = (rating: number) => {
    if (rating >= 8) return FISHING_CONDITIONS.EXCELLENT.label;
    if (rating >= 6) return FISHING_CONDITIONS.GOOD.label;
    if (rating >= 4) return FISHING_CONDITIONS.FAIR.label;
    if (rating >= 2) return FISHING_CONDITIONS.POOR.label;
    return FISHING_CONDITIONS.TERRIBLE.label;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading fishing conditions...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning, Angler!</Text>
        <Text style={styles.subtitle}>Here's your fishing forecast</Text>
      </View>

      {/* Fishing Conditions Card */}
      {fishingConditions && (
        <View style={styles.conditionsCard}>
          <View style={styles.conditionsHeader}>
            <Text style={styles.conditionsTitle}>Today's Conditions</Text>
            <View style={[
              styles.ratingBadge,
              { backgroundColor: getConditionColor(fishingConditions.rating) }
            ]}>
              <Text style={styles.ratingText}>
                {getConditionLabel(fishingConditions.rating)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.recommendation}>
            {fishingConditions.recommendation}
          </Text>
          
          <View style={styles.factorsContainer}>
            {fishingConditions.factors.map((factor, index) => (
              <View key={index} style={styles.factorItem}>
                <Ionicons name="checkmark-circle" size={16} color={APP_COLORS.success} />
                <Text style={styles.factorText}>{factor}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Weather Summary */}
      {weather && (
        <View style={styles.weatherCard}>
          <Text style={styles.cardTitle}>Current Weather</Text>
          <View style={styles.weatherGrid}>
            <View style={styles.weatherItem}>
              <Ionicons name="thermometer" size={24} color={APP_COLORS.primary} />
              <Text style={styles.weatherLabel}>Temperature</Text>
              <Text style={styles.weatherValue}>{Math.round(weather.temperature)}°C</Text>
            </View>
            
            <View style={styles.weatherItem}>
              <Ionicons name="speedometer" size={24} color={APP_COLORS.primary} />
              <Text style={styles.weatherLabel}>Pressure</Text>
              <Text style={styles.weatherValue}>{weather.pressure} hPa</Text>
            </View>
            
            <View style={styles.weatherItem}>
              <Ionicons name="water" size={24} color={APP_COLORS.primary} />
              <Text style={styles.weatherLabel}>Humidity</Text>
              <Text style={styles.weatherValue}>{weather.humidity}%</Text>
            </View>
            
            <View style={styles.weatherItem}>
              <Ionicons name="leaf" size={24} color={APP_COLORS.primary} />
              <Text style={styles.weatherLabel}>Wind</Text>
              <Text style={styles.weatherValue}>{weather.windSpeed} m/s</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={32} color={APP_COLORS.primary} />
            <Text style={styles.actionText}>Log Catch</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="trophy" size={32} color={APP_COLORS.primary} />
            <Text style={styles.actionText}>Trophy Room</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people" size={32} color={APP_COLORS.primary} />
            <Text style={styles.actionText}>Social Feed</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="location" size={32} color={APP_COLORS.primary} />
            <Text style={styles.actionText}>Find Spots</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity Preview */}
      <View style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Ionicons name="fish" size={20} color={APP_COLORS.primary} />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>You caught a Largemouth Bass</Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
        </View>
        
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Ionicons name="trophy" size={20} color={APP_COLORS.warning} />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>New achievement: First Catch!</Text>
            <Text style={styles.activityTime}>Yesterday</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
  },
  conditionsCard: {
    backgroundColor: APP_COLORS.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conditionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  conditionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  recommendation: {
    fontSize: 16,
    color: APP_COLORS.text,
    marginBottom: 16,
    lineHeight: 22,
  },
  factorsContainer: {
    gap: 8,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factorText: {
    fontSize: 14,
    color: APP_COLORS.text,
  },
  weatherCard: {
    backgroundColor: APP_COLORS.surface,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 16,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  weatherItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
  },
  weatherLabel: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 2,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  actionsCard: {
    backgroundColor: APP_COLORS.surface,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    color: APP_COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: APP_COLORS.surface,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: APP_COLORS.primary,
    fontSize: 14,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
});
