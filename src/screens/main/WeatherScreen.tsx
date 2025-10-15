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
import { WeatherService, WeatherData, SolunarData, TideData } from '../../services/weatherService';
import { useUnits } from '../../context/UnitsContext';
import { APP_COLORS } from '../../constants/config';

export default function WeatherScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherData[]>([]);
  const [solunar, setSolunar] = useState<SolunarData | null>(null);
  const [tide, setTide] = useState<TideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getUnitLabel, convertTemperature, convertPressure, convertWindSpeed, convertTideHeight } = useUnits();

  useEffect(() => {
    getWeatherData();
  }, []);

  const getWeatherData = async () => {
    try {
      setLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for weather data');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      // Fetch all weather data
      const [currentWeather, forecastData, solunarData, tideData] = await Promise.all([
        WeatherService.getCurrentWeather(coords.lat, coords.lng),
        WeatherService.getForecast(coords.lat, coords.lng),
        WeatherService.getSolunarData(coords.lat, coords.lng, new Date()),
        WeatherService.getTideData(coords.lat, coords.lng),
      ]);

      setWeather(currentWeather);
      setForecast(forecastData);
      setSolunar(solunarData);
      setTide(tideData);

    } catch (error) {
      console.error('Error fetching weather data:', error);
      Alert.alert('Error', 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getWeatherData();
    setRefreshing(false);
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getMoonPhaseIcon = (illumination: number) => {
    if (illumination < 12.5) return 'moon-outline';
    if (illumination < 37.5) return 'moon-outline';
    if (illumination < 62.5) return 'moon-outline';
    if (illumination < 87.5) return 'moon-outline';
    return 'moon';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading weather data...</Text>
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
      {/* Current Weather */}
      {weather && (
        <View style={styles.currentWeatherCard}>
          <Text style={styles.cardTitle}>Current Conditions</Text>
          <View style={styles.currentWeatherContent}>
            <View style={styles.mainWeather}>
              <Text style={styles.temperature}>
                {Math.round(convertTemperature(weather.temperature, 'temperature'))}{getUnitLabel('temperature')}
              </Text>
              <Text style={styles.description}>{weather.description}</Text>
            </View>
            <View style={styles.weatherDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="speedometer" size={20} color={APP_COLORS.primary} />
                <Text style={styles.detailLabel}>Pressure</Text>
                <Text style={styles.detailValue}>
                  {Math.round(convertPressure(weather.pressure, 'pressure') * 100) / 100} {getUnitLabel('pressure')}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="water" size={20} color={APP_COLORS.primary} />
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>{weather.humidity}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="leaf" size={20} color={APP_COLORS.primary} />
                <Text style={styles.detailLabel}>Wind</Text>
                <Text style={styles.detailValue}>
                  {Math.round(convertWindSpeed(weather.windSpeed, 'windSpeed') * 10) / 10} {getUnitLabel('windSpeed')} {getWindDirection(weather.windDirection)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="cloud" size={20} color={APP_COLORS.primary} />
                <Text style={styles.detailLabel}>Clouds</Text>
                <Text style={styles.detailValue}>{weather.cloudCover}%</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Solunar Data */}
      {solunar && (
        <View style={styles.solunarCard}>
          <Text style={styles.cardTitle}>Solunar Times</Text>
          <View style={styles.solunarGrid}>
            <View style={styles.solunarItem}>
              <Ionicons name="sunny" size={24} color="#FFA726" />
              <Text style={styles.solunarLabel}>Sunrise</Text>
              <Text style={styles.solunarValue}>{solunar.sunrise}</Text>
            </View>
            <View style={styles.solunarItem}>
              <Ionicons name="moon" size={24} color="#5C6BC0" />
              <Text style={styles.solunarLabel}>Sunset</Text>
              <Text style={styles.solunarValue}>{solunar.sunset}</Text>
            </View>
            <View style={styles.solunarItem}>
              <Ionicons name="moon" size={24} color="#42A5F5" />
              <Text style={styles.solunarLabel}>Moonrise</Text>
              <Text style={styles.solunarValue}>{solunar.moonrise}</Text>
            </View>
            <View style={styles.solunarItem}>
              <Ionicons name="moon" size={24} color="#78909C" />
              <Text style={styles.solunarLabel}>Moonset</Text>
              <Text style={styles.solunarValue}>{solunar.moonset}</Text>
            </View>
          </View>
          <View style={styles.moonPhaseContainer}>
            <Ionicons name={getMoonPhaseIcon(solunar.moonIllumination)} size={32} color={APP_COLORS.primary} />
            <View style={styles.moonPhaseInfo}>
              <Text style={styles.moonPhaseName}>{solunar.moonPhase}</Text>
              <Text style={styles.moonPhaseIllumination}>{solunar.moonIllumination}% illuminated</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tide Data */}
      {tide && (
        <View style={styles.tideCard}>
          <Text style={styles.cardTitle}>Tide Information</Text>
          <View style={styles.tideContent}>
            <View style={styles.tideItem}>
              <Ionicons name="water" size={24} color={APP_COLORS.primary} />
              <Text style={styles.tideLabel}>Current Height</Text>
              <Text style={styles.tideValue}>
                {Math.round(convertTideHeight(tide.current, 'tideHeight') * 10) / 10}{getUnitLabel('tideHeight')}
              </Text>
            </View>
            <View style={styles.tideItem}>
              <Ionicons name="trending-up" size={24} color={APP_COLORS.success} />
              <Text style={styles.tideLabel}>Next High</Text>
              <Text style={styles.tideValue}>
                {tide.nextHigh.time} ({Math.round(convertTideHeight(tide.nextHigh.height, 'tideHeight') * 10) / 10}{getUnitLabel('tideHeight')})
              </Text>
            </View>
            <View style={styles.tideItem}>
              <Ionicons name="trending-down" size={24} color={APP_COLORS.error} />
              <Text style={styles.tideLabel}>Next Low</Text>
              <Text style={styles.tideValue}>
                {tide.nextLow.time} ({Math.round(convertTideHeight(tide.nextLow.height, 'tideHeight') * 10) / 10}{getUnitLabel('tideHeight')})
              </Text>
            </View>
            <View style={styles.tideItem}>
              <Ionicons name="thermometer" size={24} color={APP_COLORS.primary} />
              <Text style={styles.tideLabel}>Water Temp</Text>
              <Text style={styles.tideValue}>
                {Math.round(convertTemperature(tide.waterTemp, 'temperature'))}{getUnitLabel('temperature')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 7-Day Forecast */}
      <View style={styles.forecastCard}>
        <Text style={styles.cardTitle}>7-Day Forecast</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.forecastContainer}>
            {forecast.map((day, index) => (
              <View key={index} style={styles.forecastItem}>
                <Text style={styles.forecastDay}>
                  {index === 0 ? 'Today' : `+${index}d`}
                </Text>
                <Text style={styles.forecastTemp}>
                  {Math.round(convertTemperature(day.temperature, 'temperature'))}{getUnitLabel('temperature')}
                </Text>
                <Text style={styles.forecastDescription}>{day.description}</Text>
                <Text style={styles.forecastPressure}>
                  {Math.round(convertPressure(day.pressure, 'pressure') * 100) / 100} {getUnitLabel('pressure')}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Fishing Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.cardTitle}>Fishing Tips</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={20} color={APP_COLORS.warning} />
            <Text style={styles.tipText}>Best fishing times are usually 1-2 hours before and after sunrise/sunset</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={20} color={APP_COLORS.warning} />
            <Text style={styles.tipText}>Rising barometric pressure often indicates better fishing conditions</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={20} color={APP_COLORS.warning} />
            <Text style={styles.tipText}>Light winds (5-15 mph) are ideal for most fishing techniques</Text>
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
  currentWeatherCard: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 16,
  },
  currentWeatherContent: {
    gap: 16,
  },
  mainWeather: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: APP_COLORS.text,
  },
  description: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  weatherDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
    textAlign: 'center',
  },
  solunarCard: {
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
  solunarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  solunarItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
  },
  solunarLabel: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 2,
  },
  solunarValue: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  moonPhaseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    gap: 12,
  },
  moonPhaseInfo: {
    flex: 1,
  },
  moonPhaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  moonPhaseIllumination: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
  },
  tideCard: {
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
  tideContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  marginBottom: 16,
  },
  tideItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
  },
  tideLabel: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 2,
  },
  tideValue: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
    textAlign: 'center',
  },
  forecastCard: {
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
  forecastContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  forecastItem: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    minWidth: 100,
  },
  forecastDay: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginBottom: 4,
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  forecastDescription: {
    fontSize: 10,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  forecastPressure: {
    fontSize: 10,
    color: APP_COLORS.textSecondary,
  },
  tipsCard: {
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
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: APP_COLORS.text,
    lineHeight: 20,
  },
});
