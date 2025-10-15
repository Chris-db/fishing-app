import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UnitPreferences {
  weight: 'lbs' | 'kg';
  length: 'in' | 'cm' | 'ft';
  temperature: 'celsius' | 'fahrenheit';
  pressure: 'hpa' | 'inHg' | 'mb';
  windSpeed: 'm/s' | 'mph' | 'km/h' | 'knots';
  tideHeight: 'm' | 'ft';
}

const defaultUnits: UnitPreferences = {
  weight: 'lbs',
  length: 'in',
  temperature: 'celsius',
  pressure: 'hpa',
  windSpeed: 'm/s',
  tideHeight: 'm',
};

interface UnitsContextType {
  units: UnitPreferences;
  updateUnits: (newUnits: Partial<UnitPreferences>) => Promise<void>;
  convertWeight: (value: number, fromUnit?: keyof UnitPreferences) => number;
  convertLength: (value: number, fromUnit?: keyof UnitPreferences) => number;
  convertTemperature: (value: number, fromUnit?: keyof UnitPreferences) => number;
  convertPressure: (value: number, fromUnit?: keyof UnitPreferences) => number;
  convertWindSpeed: (value: number, fromUnit?: keyof UnitPreferences) => number;
  convertTideHeight: (value: number, fromUnit?: keyof UnitPreferences) => number;
  convertWeightFromDb: (value: number) => number;
  convertLengthFromDb: (value: number) => number;
  getUnitLabel: (unitType: keyof UnitPreferences) => string;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export const useUnits = () => {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
};

interface UnitsProviderProps {
  children: ReactNode;
}

export const UnitsProvider: React.FC<UnitsProviderProps> = ({ children }) => {
  const [units, setUnits] = useState<UnitPreferences>(defaultUnits);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    // For now, just use default units
    // TODO: Add AsyncStorage back when the import issue is resolved
    setUnits(defaultUnits);
  };

  const updateUnits = async (newUnits: Partial<UnitPreferences>) => {
    try {
      const updatedUnits = { ...units, ...newUnits };
      setUnits(updatedUnits);
      // TODO: Add AsyncStorage persistence back when the import issue is resolved
      // await AsyncStorage.setItem('unitPreferences', JSON.stringify(updatedUnits));
    } catch (error) {
      console.error('Error saving unit preferences:', error);
    }
  };

  // Conversion functions - convert FROM user's preferred unit TO database unit (lbs/inches)
  const convertWeight = (value: number, fromUnit: keyof UnitPreferences = 'weight'): number => {
    if (fromUnit !== 'weight') return value; // Only convert if it's a weight value
    
    // Convert from user's preferred unit to database unit (lbs)
    if (units.weight === 'lbs') {
      return value; // Already in lbs
    } else if (units.weight === 'kg') {
      return value / 0.453592; // Convert kg to lbs
    }
    return value;
  };

  const convertLength = (value: number, fromUnit: keyof UnitPreferences = 'length'): number => {
    if (fromUnit !== 'length') return value; // Only convert if it's a length value
    
    // Convert from user's preferred unit to database unit (inches)
    switch (units.length) {
      case 'in':
        return value; // Already in inches
      case 'cm':
        return value / 2.54; // Convert cm to inches
      case 'ft':
        return value * 12; // Convert feet to inches
      default:
        return value;
    }
  };

  const convertTemperature = (value: number, fromUnit: keyof UnitPreferences = 'temperature'): number => {
    if (fromUnit !== 'temperature') return value; // Only convert if it's a temperature value
    
    if (units.temperature === 'celsius' && fromUnit === 'temperature') {
      return value; // Already in Celsius
    } else if (units.temperature === 'fahrenheit' && fromUnit === 'temperature') {
      return (value * 9/5) + 32; // Convert Celsius to Fahrenheit
    }
    return value;
  };

  const convertPressure = (value: number, fromUnit: keyof UnitPreferences = 'pressure'): number => {
    if (fromUnit !== 'pressure') return value; // Only convert if it's a pressure value
    
    switch (units.pressure) {
      case 'hpa':
        return value; // Already in hPa
      case 'inHg':
        return value * 0.02953; // Convert hPa to inHg
      case 'mb':
        return value; // hPa and mb are equivalent
      default:
        return value;
    }
  };

  const convertWindSpeed = (value: number, fromUnit: keyof UnitPreferences = 'windSpeed'): number => {
    if (fromUnit !== 'windSpeed') return value; // Only convert if it's a wind speed value
    
    switch (units.windSpeed) {
      case 'm/s':
        return value; // Already in m/s
      case 'mph':
        return value * 2.237; // Convert m/s to mph
      case 'km/h':
        return value * 3.6; // Convert m/s to km/h
      case 'knots':
        return value * 1.944; // Convert m/s to knots
      default:
        return value;
    }
  };

  const convertTideHeight = (value: number, fromUnit: keyof UnitPreferences = 'tideHeight'): number => {
    if (fromUnit !== 'tideHeight') return value; // Only convert if it's a tide height value
    
    if (units.tideHeight === 'm' && fromUnit === 'tideHeight') {
      return value; // Already in meters
    } else if (units.tideHeight === 'ft' && fromUnit === 'tideHeight') {
      return value * 3.28084; // Convert meters to feet
    }
    return value;
  };

  // Conversion functions - convert FROM database unit TO user's preferred unit for display
  const convertWeightFromDb = (value: number): number => {
    if (units.weight === 'lbs') {
      return value; // Already in lbs
    } else if (units.weight === 'kg') {
      return value * 0.453592; // Convert lbs to kg
    }
    return value;
  };

  const convertLengthFromDb = (value: number): number => {
    switch (units.length) {
      case 'in':
        return value; // Already in inches
      case 'cm':
        return value * 2.54; // Convert inches to cm
      case 'ft':
        return value / 12; // Convert inches to feet
      default:
        return value;
    }
  };

  const getUnitLabel = (unitType: keyof UnitPreferences): string => {
    const labels = {
      weight: units.weight === 'lbs' ? 'lbs' : 'kg',
      length: units.length === 'in' ? 'in' : units.length === 'cm' ? 'cm' : 'ft',
      temperature: units.temperature === 'celsius' ? '°C' : '°F',
      pressure: units.pressure === 'hpa' ? 'hPa' : units.pressure === 'inHg' ? 'inHg' : 'mb',
      windSpeed: units.windSpeed === 'm/s' ? 'm/s' : units.windSpeed === 'mph' ? 'mph' : units.windSpeed === 'km/h' ? 'km/h' : 'knots',
      tideHeight: units.tideHeight === 'm' ? 'm' : 'ft',
    };
    return labels[unitType];
  };

  const value: UnitsContextType = {
    units,
    updateUnits,
    convertWeight,
    convertLength,
    convertTemperature,
    convertPressure,
    convertWindSpeed,
    convertTideHeight,
    convertWeightFromDb,
    convertLengthFromDb,
    getUnitLabel,
  };

  return (
    <UnitsContext.Provider value={value}>
      {children}
    </UnitsContext.Provider>
  );
};
