import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../../constants/config';

interface LoggedCatch {
  id: string;
  species: string;
  weight?: string;
  length?: string;
  bait?: string;
  notes?: string;
  timestamp: string;
}

interface SpeciesStats {
  species: string;
  count: number;
  totalWeight: number;
  totalLength: number;
  maxWeight: number;
  maxLength: number;
  avgWeight: number;
  avgLength: number;
  catches: LoggedCatch[];
}

type FilterType = 'all' | 'size' | 'rarity' | 'recent';
type SizeFilter = 'all' | 'trophy' | 'large' | 'medium' | 'small';

export default function TrophyRoomScreenNew() {
  const [loggedCatches, setLoggedCatches] = useState<LoggedCatch[]>([]);
  const [speciesStats, setSpeciesStats] = useState<SpeciesStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatch, setSelectedCatch] = useState<LoggedCatch | null>(null);
  const [showCatchModal, setShowCatchModal] = useState(false);

  useEffect(() => {
    loadCatches();
  }, []);

  const loadCatches = () => {
    try {
      const stored = localStorage.getItem('fishtimes_catches');
      if (stored) {
        const catches: LoggedCatch[] = JSON.parse(stored);
        setLoggedCatches(catches);
        calculateSpeciesStats(catches);
      } else {
        setLoggedCatches([]);
        setSpeciesStats([]);
      }
    } catch (error) {
      console.log('Error loading catches:', error);
      setLoggedCatches([]);
      setSpeciesStats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateSpeciesStats = (catches: LoggedCatch[]) => {
    const statsMap = new Map<string, SpeciesStats>();

    catches.forEach(catchItem => {
      const species = catchItem.species;
      const weight = catchItem.weight ? parseFloat(catchItem.weight) : 0;
      const length = catchItem.length ? parseFloat(catchItem.length) : 0;

      if (!statsMap.has(species)) {
        statsMap.set(species, {
          species,
          count: 0,
          totalWeight: 0,
          totalLength: 0,
          maxWeight: 0,
          maxLength: 0,
          avgWeight: 0,
          avgLength: 0,
          catches: []
        });
      }

      const stats = statsMap.get(species)!;
      stats.count++;
      stats.totalWeight += weight;
      stats.totalLength += length;
      stats.maxWeight = Math.max(stats.maxWeight, weight);
      stats.maxLength = Math.max(stats.maxLength, length);
      stats.catches.push(catchItem);
    });

    // Calculate averages
    statsMap.forEach(stats => {
      stats.avgWeight = stats.count > 0 ? stats.totalWeight / stats.count : 0;
      stats.avgLength = stats.count > 0 ? stats.totalLength / stats.count : 0;
    });

    const sortedStats = Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
    setSpeciesStats(sortedStats);
  };

  const getFilteredCatches = () => {
    let filtered = [...loggedCatches];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(catchItem =>
        catchItem.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (catchItem.bait && catchItem.bait.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (catchItem.notes && catchItem.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply size filter
    if (sizeFilter !== 'all') {
      filtered = filtered.filter(catchItem => {
        const weight = catchItem.weight ? parseFloat(catchItem.weight) : 0;
        const length = catchItem.length ? parseFloat(catchItem.length) : 0;
        
        switch (sizeFilter) {
          case 'trophy':
            return weight >= 5 || length >= 24;
          case 'large':
            return (weight >= 3 && weight < 5) || (length >= 18 && length < 24);
          case 'medium':
            return (weight >= 1 && weight < 3) || (length >= 12 && length < 18);
          case 'small':
            return weight < 1 || length < 12;
          default:
            return true;
        }
      });
    }

    // Apply main filter
    switch (selectedFilter) {
      case 'recent':
        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      case 'size':
        return filtered.sort((a, b) => {
          const weightA = a.weight ? parseFloat(a.weight) : 0;
          const weightB = b.weight ? parseFloat(b.weight) : 0;
          return weightB - weightA;
        });
      case 'rarity':
        // Sort by species rarity (less common species first)
        return filtered.sort((a, b) => {
          const countA = speciesStats.find(s => s.species === a.species)?.count || 0;
          const countB = speciesStats.find(s => s.species === b.species)?.count || 0;
          return countA - countB;
        });
      default:
        return filtered;
    }
  };

  const getRarityColor = (species: string) => {
    const stats = speciesStats.find(s => s.species === species);
    if (!stats) return APP_COLORS.textSecondary;
    
    if (stats.count === 1) return '#ff6b6b'; // Rare - red
    if (stats.count <= 3) return '#ffa726'; // Uncommon - orange
    if (stats.count <= 10) return '#66bb6a'; // Common - green
    return APP_COLORS.textSecondary; // Very common - gray
  };

  const getRarityLabel = (species: string) => {
    const stats = speciesStats.find(s => s.species === species);
    if (!stats) return 'Unknown';
    
    if (stats.count === 1) return 'Rare';
    if (stats.count <= 3) return 'Uncommon';
    if (stats.count <= 10) return 'Common';
    return 'Very Common';
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
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
            setLoggedCatches([]);
            setSpeciesStats([]);
            Alert.alert('Success', 'All catches have been cleared');
          }
        }
      ]
    );
  };

  const renderCatchCard = ({ item }: { item: LoggedCatch }) => (
    <TouchableOpacity
      style={styles.catchCard}
      onPress={() => {
        setSelectedCatch(item);
        setShowCatchModal(true);
      }}
    >
      <View style={styles.catchHeader}>
        <View style={styles.speciesInfo}>
          <Text style={styles.speciesName}>{item.species}</Text>
          <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.species) + '20' }]}>
            <Text style={[styles.rarityText, { color: getRarityColor(item.species) }]}>
              {getRarityLabel(item.species)}
            </Text>
          </View>
        </View>
        <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
      </View>
      
      <View style={styles.catchDetails}>
        {item.weight && (
          <View style={styles.detailRow}>
            <Ionicons name="scale-outline" size={16} color={APP_COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.weight} lbs</Text>
          </View>
        )}
        
        {item.length && (
          <View style={styles.detailRow}>
            <Ionicons name="resize-outline" size={16} color={APP_COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.length} inches</Text>
          </View>
        )}
        
        {item.bait && (
          <View style={styles.detailRow}>
            <Ionicons name="fish-outline" size={16} color={APP_COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.bait}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderStatsCard = ({ item }: { item: SpeciesStats }) => (
    <View style={styles.statsCard}>
      <Text style={styles.statsSpecies}>{item.species}</Text>
      <View style={styles.statsRow}>
        <Text style={styles.statsCount}>{item.count} caught</Text>
        {item.maxWeight > 0 && (
          <Text style={styles.statsDetail}>Best: {item.maxWeight} lbs</Text>
        )}
      </View>
      {item.avgWeight > 0 && (
        <Text style={styles.statsDetail}>Avg: {item.avgWeight.toFixed(1)} lbs</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your trophy room...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadCatches} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏆 Trophy Room</Text>
          <Text style={styles.headerSubtitle}>
            {loggedCatches.length} catch{loggedCatches.length !== 1 ? 'es' : ''} • {speciesStats.length} species
          </Text>
          {loggedCatches.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearAllCatches}>
              <Ionicons name="trash-outline" size={16} color="#ff4444" />
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={APP_COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search catches, species, or bait..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={APP_COLORS.textSecondary}
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {(['all', 'recent', 'size', 'rarity'] as FilterType[]).map(filter => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    selectedFilter === filter && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedFilter === filter && styles.filterButtonTextActive
                  ]}>
                    {filter === 'all' ? 'All' : filter === 'recent' ? 'Recent' : filter === 'size' ? 'Size' : 'Rarity'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Size Filter */}
        {selectedFilter === 'size' && (
          <View style={styles.sizeFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {(['all', 'trophy', 'large', 'medium', 'small'] as SizeFilter[]).map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeFilterButton,
                      sizeFilter === size && styles.sizeFilterButtonActive
                    ]}
                    onPress={() => setSizeFilter(size)}
                  >
                    <Text style={[
                      styles.sizeFilterButtonText,
                      sizeFilter === size && styles.sizeFilterButtonTextActive
                    ]}>
                      {size === 'all' ? 'All Sizes' : size === 'trophy' ? 'Trophy' : size === 'large' ? 'Large' : size === 'medium' ? 'Medium' : 'Small'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {loggedCatches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color={APP_COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No catches yet</Text>
            <Text style={styles.emptySubtitle}>
              Start logging your fishing adventures to build your trophy room!
            </Text>
          </View>
        ) : (
          <>
            {/* Species Stats */}
            {speciesStats.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Species Summary</Text>
                <FlatList
                  data={speciesStats.slice(0, 5)}
                  renderItem={renderStatsCard}
                  keyExtractor={(item) => item.species}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.statsList}
                />
              </View>
            )}

            {/* Catches List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Your Catches ({getFilteredCatches().length})
              </Text>
              <FlatList
                data={getFilteredCatches()}
                renderItem={renderCatchCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.catchesList}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Catch Detail Modal */}
      <Modal
        visible={showCatchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCatchModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Catch Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCatchModal(false)}
            >
              <Ionicons name="close" size={24} color={APP_COLORS.text} />
            </TouchableOpacity>
          </View>
          
          {selectedCatch && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalCatchCard}>
                <Text style={styles.modalSpeciesName}>{selectedCatch.species}</Text>
                <Text style={styles.modalTimestamp}>{formatDate(selectedCatch.timestamp)}</Text>
                
                <View style={styles.modalDetails}>
                  {selectedCatch.weight && (
                    <View style={styles.modalDetailRow}>
                      <Ionicons name="scale-outline" size={20} color={APP_COLORS.primary} />
                      <Text style={styles.modalDetailLabel}>Weight:</Text>
                      <Text style={styles.modalDetailValue}>{selectedCatch.weight} lbs</Text>
                    </View>
                  )}
                  
                  {selectedCatch.length && (
                    <View style={styles.modalDetailRow}>
                      <Ionicons name="resize-outline" size={20} color={APP_COLORS.primary} />
                      <Text style={styles.modalDetailLabel}>Length:</Text>
                      <Text style={styles.modalDetailValue}>{selectedCatch.length} inches</Text>
                    </View>
                  )}
                  
                  {selectedCatch.bait && (
                    <View style={styles.modalDetailRow}>
                      <Ionicons name="fish-outline" size={20} color={APP_COLORS.primary} />
                      <Text style={styles.modalDetailLabel}>Bait:</Text>
                      <Text style={styles.modalDetailValue}>{selectedCatch.bait}</Text>
                    </View>
                  )}
                </View>
                
                {selectedCatch.notes && (
                  <View style={styles.modalNotesContainer}>
                    <Text style={styles.modalNotesLabel}>Notes:</Text>
                    <Text style={styles.modalNotesText}>{selectedCatch.notes}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: APP_COLORS.text,
    marginLeft: 12,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: APP_COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: APP_COLORS.text,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  sizeFilterContainer: {
    marginBottom: 16,
  },
  sizeFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 16,
  },
  sizeFilterButtonActive: {
    backgroundColor: APP_COLORS.primary,
  },
  sizeFilterButtonText: {
    fontSize: 12,
    color: APP_COLORS.text,
    fontWeight: '500',
  },
  sizeFilterButtonTextActive: {
    color: 'white',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statsList: {
    paddingHorizontal: 16,
  },
  statsCard: {
    backgroundColor: APP_COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 140,
  },
  statsSpecies: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statsCount: {
    fontSize: 14,
    color: APP_COLORS.primary,
    fontWeight: '500',
  },
  statsDetail: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  speciesInfo: {
    flex: 1,
  },
  speciesName: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
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
    paddingHorizontal: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: APP_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.textSecondary + '20',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalCatchCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 12,
    padding: 20,
  },
  modalSpeciesName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 8,
  },
  modalTimestamp: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginBottom: 20,
  },
  modalDetails: {
    marginBottom: 20,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalDetailLabel: {
    fontSize: 16,
    color: APP_COLORS.text,
    marginLeft: 12,
    marginRight: 8,
    fontWeight: '500',
  },
  modalDetailValue: {
    fontSize: 16,
    color: APP_COLORS.text,
    fontWeight: '600',
  },
  modalNotesContainer: {
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.textSecondary + '20',
    paddingTop: 16,
  },
  modalNotesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginBottom: 8,
  },
  modalNotesText: {
    fontSize: 16,
    color: APP_COLORS.text,
    lineHeight: 24,
  },
});
