import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../../constants/config';

interface Catch {
  id: string;
  species: string;
  weight?: string;
  length?: string;
  bait?: string;
  notes?: string;
  timestamp: string;
}

export default function MyCatchesScreen() {
  const [catches, setCatches] = useState<Catch[]>([]);

  useEffect(() => {
    loadCatches();
  }, []);

  const loadCatches = () => {
    try {
      // Load from localStorage (web) or AsyncStorage (mobile)
      const stored = localStorage.getItem('fishtimes_catches');
      if (stored) {
        setCatches(JSON.parse(stored));
      }
    } catch (error) {
      console.log('No catches found or error loading:', error);
      setCatches([]);
    }
  };

  const clearAllCatches = () => {
    Alert.alert(
      'Clear All Catches',
      'Are you sure you want to delete all your logged catches?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            localStorage.removeItem('fishtimes_catches');
            setCatches([]);
            Alert.alert('Success', 'All catches have been cleared');
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Catches</Text>
        <Text style={styles.headerSubtitle}>
          {catches.length} catch{catches.length !== 1 ? 'es' : ''} logged
        </Text>
        {catches.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAllCatches}>
            <Ionicons name="trash-outline" size={16} color="#ff4444" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {catches.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="fish-outline" size={64} color={APP_COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No catches yet</Text>
          <Text style={styles.emptySubtitle}>
            Start logging your fishing adventures!
          </Text>
        </View>
      ) : (
        <View style={styles.catchesList}>
          {catches.map((catchItem, index) => (
            <View key={catchItem.id} style={styles.catchCard}>
              <View style={styles.catchHeader}>
                <Text style={styles.speciesName}>{catchItem.species}</Text>
                <Text style={styles.timestamp}>
                  {formatDate(catchItem.timestamp)}
                </Text>
              </View>
              
              <View style={styles.catchDetails}>
                {catchItem.weight && (
                  <View style={styles.detailRow}>
                    <Ionicons name="scale-outline" size={16} color={APP_COLORS.textSecondary} />
                    <Text style={styles.detailText}>{catchItem.weight} lbs</Text>
                  </View>
                )}
                
                {catchItem.length && (
                  <View style={styles.detailRow}>
                    <Ionicons name="resize-outline" size={16} color={APP_COLORS.textSecondary} />
                    <Text style={styles.detailText}>{catchItem.length} inches</Text>
                  </View>
                )}
                
                {catchItem.bait && (
                  <View style={styles.detailRow}>
                    <Ionicons name="fish-outline" size={16} color={APP_COLORS.textSecondary} />
                    <Text style={styles.detailText}>{catchItem.bait}</Text>
                  </View>
                )}
              </View>
              
              {catchItem.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{catchItem.notes}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
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
    marginBottom: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff444420',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
  catchesList: {
    paddingHorizontal: 16,
  },
  catchCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  catchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  speciesName: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  timestamp: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  catchDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: APP_COLORS.text,
    marginLeft: 8,
  },
  notesContainer: {
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.textSecondary + '20',
    paddingTop: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: APP_COLORS.text,
    lineHeight: 20,
  },
});
