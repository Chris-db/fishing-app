import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase, FishSpecies, Catch } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useUnits } from '../../context/UnitsContext';
import { useNetwork } from '../../context/NetworkContext';
import { offlineStorage } from '../../utils/offlineStorage';
import { APP_COLORS } from '../../constants/config';

export default function LogCatchScreen() {
  const [species, setSpecies] = useState<FishSpecies[]>([]);
  const [speciesName, setSpeciesName] = useState<string>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [baitUsed, setBaitUsed] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<string>('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { getUnitLabel, convertWeight, convertLength } = useUnits();
  const { isOnline, pendingSyncCount } = useNetwork();

  useEffect(() => {
    loadSpecies();
    getCurrentLocation();
  }, []);

  const loadSpecies = async () => {
    try {
      const { data, error } = await supabase
        .from('fish_species')
        .select('*')
        .order('name');

      if (error) throw error;
      setSpecies(data || []);
    } catch (error) {
      console.error('Error loading species:', error);
      Alert.alert('Error', 'Failed to load fish species');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCoordinates({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      // Get location name
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        setLocation(`${addr.city}, ${addr.region}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileName = `${user?.id}_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('catch-photos')
        .upload(fileName, blob);

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('catch-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!speciesName.trim()) {
      Alert.alert('Error', 'Please enter a fish species');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to log a catch');
      return;
    }

    setLoading(true);
    try {
      // Convert user input to database units (lbs and inches)
      const weightValue = weight ? parseFloat(weight) : null;
      const lengthValue = length ? parseFloat(length) : null;
      
      // Convert to database units if needed
      const dbWeight = weightValue ? convertWeight(weightValue, 'weight') : null;
      const dbLength = lengthValue ? convertLength(lengthValue, 'length') : null;

      let photoUrls: string[] = [];
      if (photo) {
        if (isOnline) {
          // Upload photo to server when online
          const photoUrl = await uploadPhoto(photo);
          if (photoUrl) photoUrls.push(photoUrl);
        } else {
          // Save photo locally when offline
          const offlinePhotoPath = await offlineStorage.saveOfflinePhoto(photo, `catch_${Date.now()}`);
          photoUrls.push(offlinePhotoPath);
        }
      }

      if (isOnline) {
        // Online: Save directly to database
        const catchData = {
          user_id: user.id,
          species: speciesName.trim(),
          photo_url: photoUrls[0] || null,
          weight: dbWeight,
          length: dbLength,
          bait_used: baitUsed || null,
          location: location || null,
          coordinates: coordinates ? `POINT(${coordinates.lng} ${coordinates.lat})` : null,
          time: new Date().toTimeString().split(' ')[0],
          date: new Date().toISOString().split('T')[0],
          privacy,
          notes: notes || null,
        };

        const { error } = await supabase
          .from('catches')
          .insert(catchData);

        if (error) throw error;

        Alert.alert('Success', 'Catch logged successfully!', [
          { text: 'OK', onPress: () => resetForm() }
        ]);
      } else {
        // Offline: Save to local storage
        const offlineCatch = {
          species: speciesName.trim(),
          weight: dbWeight || 0,
          length: dbLength || 0,
          location: {
            latitude: coordinates?.lat || 0,
            longitude: coordinates?.lng || 0,
            accuracy: 0,
          },
          timestamp: new Date().toISOString(),
          weather: undefined, // Could be enhanced to capture current weather
          bait: baitUsed || undefined,
          technique: undefined,
          notes: notes || undefined,
          photos: photoUrls,
        };

        await offlineStorage.saveCatch(offlineCatch);

        Alert.alert(
          'Catch Saved Offline', 
          'Your catch has been saved locally and will sync when you\'re back online.',
          [{ text: 'OK', onPress: () => resetForm() }]
        );
      }

    } catch (error) {
      console.error('Error logging catch:', error);
      Alert.alert('Error', 'Failed to log catch');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSpeciesName('');
    setPhoto(null);
    setWeight('');
    setLength('');
    setBaitUsed('');
    setNotes('');
    setPrivacy('public');
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Offline Status Indicator */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={20} color="#fff" />
          <Text style={styles.offlineText}>
            Offline Mode - Catches will sync when online
          </Text>
        </View>
      )}
      
      {/* Pending Sync Indicator */}
      {pendingSyncCount > 0 && (
        <View style={styles.syncBanner}>
          <Ionicons name="sync" size={20} color="#fff" />
          <Text style={styles.syncText}>
            {pendingSyncCount} catch{pendingSyncCount > 1 ? 'es' : ''} pending sync
          </Text>
        </View>
      )}

      {/* Species Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fish Species *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter fish species (e.g., Bass, Trout, Salmon)"
          value={speciesName}
          onChangeText={setSpeciesName}
          autoCapitalize="words"
        />
      </View>

      {/* Photo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photo</Text>
        {photo ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photo }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => setPhoto(null)}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addPhotoButton} onPress={showImageOptions}>
            <Ionicons name="camera" size={32} color={APP_COLORS.primary} />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Measurements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Measurements</Text>
        <View style={styles.measurementsContainer}>
          <View style={styles.measurementInput}>
            <Text style={styles.inputLabel}>Weight ({getUnitLabel('weight')})</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="0.0"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.measurementInput}>
            <Text style={styles.inputLabel}>Length ({getUnitLabel('length')})</Text>
            <TextInput
              style={styles.input}
              value={length}
              onChangeText={setLength}
              placeholder="0.0"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Bait Used */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bait Used</Text>
        <TextInput
          style={styles.input}
          value={baitUsed}
          onChangeText={setBaitUsed}
          placeholder="What bait did you use?"
        />
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Where did you catch this fish?"
        />
        {coordinates && (
          <Text style={styles.coordinatesText}>
            📍 {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </Text>
        )}
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.privacyContainer}>
          {(['public', 'friends', 'private'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.privacyOption,
                privacy === option && styles.privacyOptionActive
              ]}
              onPress={() => setPrivacy(option)}
            >
              <Ionicons
                name={
                  option === 'public' ? 'globe' :
                  option === 'friends' ? 'people' : 'lock-closed'
                }
                size={20}
                color={privacy === option ? 'white' : APP_COLORS.primary}
              />
              <Text style={[
                styles.privacyText,
                privacy === option && styles.privacyTextActive
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes about this catch..."
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading || !selectedSpecies}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Logging Catch...' : 'Log Catch'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  offlineBanner: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  offlineText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  syncBanner: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
  },
  syncText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
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
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 12,
  },
  speciesSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  speciesText: {
    fontSize: 16,
    color: APP_COLORS.text,
  },
  placeholderText: {
    color: APP_COLORS.textSecondary,
  },
  speciesPicker: {
    marginTop: 8,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 200,
  },
  speciesList: {
    maxHeight: 200,
  },
  speciesOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  speciesOptionText: {
    fontSize: 16,
    color: APP_COLORS.text,
    fontWeight: '500',
  },
  speciesOptionScientific: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: APP_COLORS.background,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 16,
    color: APP_COLORS.primary,
    marginTop: 8,
  },
  measurementsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  measurementInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: APP_COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: APP_COLORS.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  coordinatesText: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginTop: 4,
  },
  privacyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  privacyOptionActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  privacyText: {
    fontSize: 14,
    color: APP_COLORS.primary,
    fontWeight: '500',
  },
  privacyTextActive: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: APP_COLORS.primary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: APP_COLORS.textSecondary,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
