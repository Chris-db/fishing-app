import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUnits, UnitPreferences } from '../../context/UnitsContext';
import { APP_COLORS } from '../../constants/config';

export default function SettingsScreen() {
  const { units, updateUnits, getUnitLabel } = useUnits();
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  
  // Privacy settings
  const [locationPrecision, setLocationPrecision] = useState<'exact' | 'approximate' | 'general' | 'none'>('approximate');
  const [protectSpots, setProtectSpots] = useState(true);
  const [shareWithFriends, setShareWithFriends] = useState(true);

  const handleUnitChange = async (unitType: keyof UnitPreferences, value: any) => {
    try {
      await updateUnits({ [unitType]: value });
      setShowDropdown(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update unit preference');
    }
  };

  const renderToggle = (
    title: string,
    unitType: keyof UnitPreferences,
    options: { label: string; value: any }[]
  ) => {
    if (options.length === 2) {
      // Render as toggle
      const currentValue = units[unitType];
      const otherOption = options.find(opt => opt.value !== currentValue);
      
      return (
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{title}</Text>
            <Text style={styles.settingSubtitle}>Current: {getUnitLabel(unitType)}</Text>
          </View>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => handleUnitChange(unitType, otherOption?.value)}
          >
            <Text style={styles.toggleText}>
              {otherOption?.label}
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // Render as dropdown
      const currentOption = options.find(opt => opt.value === units[unitType]);
      const isOpen = showDropdown === unitType;
      
      return (
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{title}</Text>
            <Text style={styles.settingSubtitle}>Current: {currentOption?.label}</Text>
          </View>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(isOpen ? null : unitType)}
          >
            <Text style={styles.dropdownText}>
              {currentOption?.label}
            </Text>
            <Ionicons 
              name={isOpen ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={APP_COLORS.primary} 
            />
          </TouchableOpacity>
          
          {isOpen && (
            <View style={styles.dropdown}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownOption,
                    units[unitType] === option.value && styles.dropdownOptionSelected
                  ]}
                  onPress={() => handleUnitChange(unitType, option.value)}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    units[unitType] === option.value && styles.dropdownOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {units[unitType] === option.value && (
                    <Ionicons name="checkmark" size={20} color={APP_COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Units & Measurements</Text>
        <Text style={styles.headerSubtitle}>
          Customize how measurements are displayed throughout the app
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fish Measurements</Text>
        
        {renderToggle(
          'Weight',
          'weight',
          [
            { label: 'Pounds (lbs)', value: 'lbs' },
            { label: 'Kilograms (kg)', value: 'kg' }
          ]
        )}

        {renderToggle(
          'Length',
          'length',
          [
            { label: 'Inches (in)', value: 'in' },
            { label: 'Centimeters (cm)', value: 'cm' },
            { label: 'Feet (ft)', value: 'ft' }
          ]
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weather & Environment</Text>
        
        {renderToggle(
          'Temperature',
          'temperature',
          [
            { label: 'Celsius (°C)', value: 'celsius' },
            { label: 'Fahrenheit (°F)', value: 'fahrenheit' }
          ]
        )}

        {renderToggle(
          'Pressure',
          'pressure',
          [
            { label: 'Hectopascals (hPa)', value: 'hpa' },
            { label: 'Inches of Mercury (inHg)', value: 'inHg' },
            { label: 'Millibars (mb)', value: 'mb' }
          ]
        )}

        {renderToggle(
          'Wind Speed',
          'windSpeed',
          [
            { label: 'Meters per second (m/s)', value: 'm/s' },
            { label: 'Miles per hour (mph)', value: 'mph' },
            { label: 'Kilometers per hour (km/h)', value: 'km/h' },
            { label: 'Knots', value: 'knots' }
          ]
        )}

        {renderToggle(
          'Tide Height',
          'tideHeight',
          [
            { label: 'Meters (m)', value: 'm' },
            { label: 'Feet (ft)', value: 'ft' }
          ]
        )}
      </View>

      {/* Privacy Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Location</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Location Precision</Text>
            <Text style={styles.settingSubtitle}>
              {locationPrecision === 'exact' ? 'Exact location (friends only)' :
               locationPrecision === 'approximate' ? 'Approximate (1-5 mile radius)' :
               locationPrecision === 'general' ? 'General area (city/region only)' :
               'No location shared'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(showDropdown === 'locationPrecision' ? null : 'locationPrecision')}
          >
            <Text style={styles.dropdownText}>
              {locationPrecision === 'exact' ? 'Exact' :
               locationPrecision === 'approximate' ? 'Approximate' :
               locationPrecision === 'general' ? 'General' : 'None'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={APP_COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {showDropdown === 'locationPrecision' && (
          <View style={styles.dropdownOptions}>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setLocationPrecision('exact');
                setShowDropdown(null);
              }}
            >
              <Text style={styles.dropdownOptionText}>Exact location (friends only)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setLocationPrecision('approximate');
                setShowDropdown(null);
              }}
            >
              <Text style={styles.dropdownOptionText}>Approximate (1-5 mile radius)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setLocationPrecision('general');
                setShowDropdown(null);
              }}
            >
              <Text style={styles.dropdownOptionText}>General area (city/region only)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setLocationPrecision('none');
                setShowDropdown(null);
              }}
            >
              <Text style={styles.dropdownOptionText}>No location</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Protect Fishing Spots</Text>
            <Text style={styles.settingSubtitle}>
              Show general area only (5-10 mile radius) for all catches
            </Text>
          </View>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setProtectSpots(!protectSpots)}
          >
            <Ionicons 
              name={protectSpots ? "shield" : "shield-outline"} 
              size={20} 
              color={protectSpots ? APP_COLORS.primary : APP_COLORS.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Share with Friends</Text>
            <Text style={styles.settingSubtitle}>
              Allow friends to see exact locations
            </Text>
          </View>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShareWithFriends(!shareWithFriends)}
          >
            <Ionicons 
              name={shareWithFriends ? "people" : "people-outline"} 
              size={20} 
              color={shareWithFriends ? APP_COLORS.primary : APP_COLORS.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={APP_COLORS.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>About Units</Text>
          <Text style={styles.infoText}>
            These settings will apply to all measurements throughout the app, including 
            catch logging, weather data, and statistics. Changes are saved automatically.
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark" size={24} color={APP_COLORS.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Privacy Protection</Text>
          <Text style={styles.infoText}>
            Your privacy settings help protect your favorite fishing spots while still 
            allowing you to share helpful information with the community.
          </Text>
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
  header: {
    backgroundColor: APP_COLORS.surface,
    padding: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    lineHeight: 22,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingInfo: {
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
  },
  toggleButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  toggleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: APP_COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownText: {
    fontSize: 14,
    color: APP_COLORS.text,
  },
  dropdown: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionSelected: {
    backgroundColor: APP_COLORS.background,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: APP_COLORS.text,
  },
  dropdownOptionTextSelected: {
    color: APP_COLORS.primary,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
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
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    lineHeight: 20,
  },
});
