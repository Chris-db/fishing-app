import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { notificationService } from '../../services/notificationService';
import { APP_COLORS } from '../../constants/config';

export default function LogCatchScreenSimple() {
  const navigation = useNavigation();
  const [speciesName, setSpeciesName] = useState<string>('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [baitUsed, setBaitUsed] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!speciesName.trim()) {
      Alert.alert('Error', 'Please enter a fish species');
      return;
    }

    setLoading(true);
    try {
      // Create catch object
      const newCatch = {
        id: Date.now().toString(),
        species: speciesName.trim(),
        weight: weight.trim() || undefined,
        length: length.trim() || undefined,
        bait: baitUsed.trim() || undefined,
        notes: notes.trim() || undefined,
        timestamp: new Date().toISOString(),
      };

      // Load existing catches
      let existingCatches = [];
      try {
        const stored = localStorage.getItem('fishtimes_catches');
        if (stored) {
          existingCatches = JSON.parse(stored);
        }
      } catch (error) {
        console.log('No existing catches found');
      }

      // Add new catch
      existingCatches.unshift(newCatch); // Add to beginning of array
      
      // Save back to localStorage
      localStorage.setItem('fishtimes_catches', JSON.stringify(existingCatches));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create notification for the catch
      notificationService.createCatchNotification(
        newCatch.species,
        newCatch.weight,
        newCatch.length
      );

      // Check for achievements
      notificationService.checkAchievements(existingCatches.concat(newCatch));
      
      // Clear the form immediately after successful logging
      resetForm();
      
      // Show simple success alert with navigation options
      Alert.alert(
        '🎣 Catch Logged!', 
        `Your ${newCatch.species} has been added to your Trophy Room. Check notifications for details!`,
        [
          { 
            text: 'Log Another', 
            onPress: () => {
              // Form is already cleared, just stay on the page
            },
            style: 'default'
          },
          { 
            text: 'View Trophy Room', 
            onPress: () => {
              navigation.navigate('TrophyRoom' as never);
            },
            style: 'default'
          },
          { 
            text: 'View Notifications', 
            onPress: () => {
              navigation.navigate('Notifications' as never);
            },
            style: 'default'
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to log catch');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSpeciesName('');
    setWeight('');
    setLength('');
    setBaitUsed('');
    setNotes('');
    // Optional: Add a brief visual feedback that form was cleared
    console.log('Form cleared successfully');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Log Your Catch</Text>
        <Text style={styles.headerSubtitle}>Record your fishing success</Text>
      </View>

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

      {/* Measurements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Measurements</Text>
        <View style={styles.measurementsContainer}>
          <View style={styles.measurementInput}>
            <Text style={styles.inputLabel}>Weight (lbs)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.0"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.measurementInput}>
            <Text style={styles.inputLabel}>Length (inches)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.0"
              value={length}
              onChangeText={setLength}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Bait Used */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bait Used</Text>
        <TextInput
          style={styles.textInput}
          placeholder="What bait or lure did you use?"
          value={baitUsed}
          onChangeText={setBaitUsed}
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.textInput, styles.notesInput]}
          placeholder="Any additional notes about your catch..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
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
  header: {
    backgroundColor: APP_COLORS.surface,
    padding: 24,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
  },
  section: {
    backgroundColor: APP_COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: APP_COLORS.textSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: APP_COLORS.text,
    backgroundColor: 'white',
  },
  measurementsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  measurementInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginBottom: 8,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: APP_COLORS.primary,
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
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
