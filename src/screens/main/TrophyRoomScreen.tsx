import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, FishSpecies, Catch } from '../../services/supabase';
import { FishService, FishSpeciesWithStats, TrophyRoomStats, SpeciesFilter } from '../../services/fishService';
import { useAuth } from '../../context/AuthContext';
import { useUnits } from '../../context/UnitsContext';
import { APP_COLORS } from '../../constants/config';

interface UserCatch {
  species: FishSpecies;
  count: number;
  avgWeight?: number;
  maxWeight?: number;
  minWeight?: number;
  avgLength?: number;
  maxLength?: number;
  minLength?: number;
}

export default function TrophyRoomScreen() {
  const [species, setSpecies] = useState<FishSpeciesWithStats[]>([]);
  const [userCatches, setUserCatches] = useState<UserCatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'caught' | 'uncaught'>('all');
  const [waterTypeFilter, setWaterTypeFilter] = useState<'all' | 'freshwater' | 'saltwater' | 'estuary'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<FishSpeciesWithStats | null>(null);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [trophyStats, setTrophyStats] = useState<TrophyRoomStats | null>(null);
  const { user } = useAuth();
  const { getUnitLabel, convertWeightFromDb, convertLengthFromDb } = useUnits();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      // Load species with user stats using FishService
      const [speciesData, statsData] = await Promise.all([
        FishService.getSpeciesByRegion('North America', user.id),
        FishService.getTrophyRoomStats(user.id),
      ]);

      setSpecies(speciesData);
      setTrophyStats(statsData);

      // Legacy user catches for backward compatibility
      const { data: catchesData, error: catchesError } = await supabase
        .from('catches')
        .select(`
          species_id,
          weight,
          length,
          species:fish_species(*)
        `)
        .eq('user_id', user.id);

      if (catchesError) throw catchesError;

      // Process catches data
      const catchMap = new Map<string, UserCatch>();
      
      catchesData?.forEach((catchItem: any) => {
        const speciesId = catchItem.species_id;
        const speciesData = catchItem.species;
        
        if (!catchMap.has(speciesId)) {
          catchMap.set(speciesId, {
            species: speciesData,
            count: 0,
            weights: [],
            lengths: [],
          });
        }
        
        const userCatch = catchMap.get(speciesId)!;
        userCatch.count++;
        
        if (catchItem.weight) {
          userCatch.weights = userCatch.weights || [];
          userCatch.weights.push(catchItem.weight);
        }
        
        if (catchItem.length) {
          userCatch.lengths = userCatch.lengths || [];
          userCatch.lengths.push(catchItem.length);
        }
      });

      // Calculate averages and min/max
      const processedCatches = Array.from(catchMap.values()).map(catchData => ({
        ...catchData,
        avgWeight: catchData.weights?.length ? catchData.weights.reduce((a, b) => a + b, 0) / catchData.weights.length : undefined,
        maxWeight: catchData.weights?.length ? Math.max(...catchData.weights) : undefined,
        minWeight: catchData.weights?.length ? Math.min(...catchData.weights) : undefined,
        avgLength: catchData.lengths?.length ? catchData.lengths.reduce((a, b) => a + b, 0) / catchData.lengths.length : undefined,
        maxLength: catchData.lengths?.length ? Math.max(...catchData.lengths) : undefined,
        minLength: catchData.lengths?.length ? Math.min(...catchData.lengths) : undefined,
      }));

      setUserCatches(processedCatches);

    } catch (error) {
      console.error('Error loading trophy room data:', error);
      Alert.alert('Error', 'Failed to load trophy room data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!user) return;
    
    try {
      const searchResults = await FishService.searchSpecies(searchQuery, user.id, {
        water_type: waterTypeFilter !== 'all' ? waterTypeFilter : undefined,
        unlocked_only: selectedFilter === 'caught',
      });
      setSpecies(searchResults);
    } catch (error) {
      console.error('Error searching species:', error);
    }
  };

  const handleSpeciesPress = (fish: FishSpeciesWithStats) => {
    setSelectedSpecies(fish);
    setShowSpeciesModal(true);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return APP_COLORS.success;
      case 'uncommon': return APP_COLORS.primary;
      case 'rare': return APP_COLORS.warning;
      case 'legendary': return '#9C27B0';
      default: return APP_COLORS.textSecondary;
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'star-outline';
      case 'uncommon': return 'star-half';
      case 'rare': return 'star';
      case 'legendary': return 'diamond';
      default: return 'help-outline';
    }
  };

  const getFilteredSpecies = () => {
    let filtered = species;

    // Filter by caught/uncaught
    if (selectedFilter === 'caught') {
      const caughtSpeciesIds = userCatches.map(c => c.species.id);
      filtered = filtered.filter(s => caughtSpeciesIds.includes(s.id));
    } else if (selectedFilter === 'uncaught') {
      const caughtSpeciesIds = userCatches.map(c => c.species.id);
      filtered = filtered.filter(s => !caughtSpeciesIds.includes(s.id));
    }

    // Filter by water type
    if (waterTypeFilter !== 'all') {
      filtered = filtered.filter(s => s.water_type === waterTypeFilter);
    }

    return filtered;
  };

  const getSpeciesUserData = (speciesId: string) => {
    return userCatches.find(c => c.species.id === speciesId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your trophy room...</Text>
      </View>
    );
  }

  const filteredSpecies = getFilteredSpecies();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Stats */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Your Trophy Room</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{trophyStats?.unlocked_species || 0}</Text>
            <Text style={styles.statLabel}>Species Caught</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{trophyStats?.total_species || 0}</Text>
            <Text style={styles.statLabel}>Total Species</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{trophyStats?.completion_percentage || 0}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{trophyStats?.total_catches || 0}</Text>
            <Text style={styles.statLabel}>Total Catches</Text>
          </View>
        </View>
        
        {trophyStats?.biggest_fish && (
          <View style={styles.biggestFishContainer}>
            <Text style={styles.biggestFishLabel}>Biggest Catch:</Text>
            <Text style={styles.biggestFishText}>
              {trophyStats.biggest_fish.species} - {convertWeightFromDb(trophyStats.biggest_fish.weight).toFixed(1)} {getUnitLabel('weight')}
            </Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={APP_COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search species..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color={APP_COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === 'all' && styles.filterTextActive
              ]}>All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'caught' && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter('caught')}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === 'caught' && styles.filterTextActive
              ]}>Caught</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'uncaught' && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter('uncaught')}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === 'uncaught' && styles.filterTextActive
              ]}>Uncaught</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                waterTypeFilter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => setWaterTypeFilter('all')}
            >
              <Text style={[
                styles.filterText,
                waterTypeFilter === 'all' && styles.filterTextActive
              ]}>All Water</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                waterTypeFilter === 'freshwater' && styles.filterButtonActive
              ]}
              onPress={() => setWaterTypeFilter('freshwater')}
            >
              <Text style={[
                styles.filterText,
                waterTypeFilter === 'freshwater' && styles.filterTextActive
              ]}>Freshwater</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                waterTypeFilter === 'saltwater' && styles.filterButtonActive
              ]}
              onPress={() => setWaterTypeFilter('saltwater')}
            >
              <Text style={[
                styles.filterText,
                waterTypeFilter === 'saltwater' && styles.filterTextActive
              ]}>Saltwater</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                waterTypeFilter === 'estuary' && styles.filterButtonActive
              ]}
              onPress={() => setWaterTypeFilter('estuary')}
            >
              <Text style={[
                styles.filterText,
                waterTypeFilter === 'estuary' && styles.filterTextActive
              ]}>Estuary</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Species Grid */}
      <View style={styles.speciesGrid}>
        {filteredSpecies.map((fish) => {
          const isCaught = fish.is_unlocked;
          
          return (
            <TouchableOpacity
              key={fish.id}
              style={[
                styles.speciesCard,
                !isCaught && styles.speciesCardUncaught
              ]}
              onPress={() => handleSpeciesPress(fish)}
            >
              <View style={styles.speciesImageContainer}>
                {fish.photo_url ? (
                  <Image 
                    source={{ uri: fish.photo_url }} 
                    style={[
                      styles.speciesImage,
                      !isCaught && styles.speciesImageUncaught
                    ]}
                  />
                ) : (
                  <View style={[
                    styles.speciesImagePlaceholder,
                    !isCaught && styles.speciesImageUncaught
                  ]}>
                    <Ionicons 
                      name="fish" 
                      size={32} 
                      color={isCaught ? APP_COLORS.primary : APP_COLORS.textSecondary} 
                    />
                  </View>
                )}
                
                {isCaught && (
                  <View style={styles.caughtBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={APP_COLORS.success} />
                  </View>
                )}
              </View>

              <View style={styles.speciesInfo}>
                <View style={styles.speciesHeader}>
                  <Text style={[
                    styles.speciesName,
                    !isCaught && styles.speciesNameUncaught
                  ]}>
                    {fish.name}
                  </Text>
                  <View style={styles.rarityContainer}>
                    <Ionicons 
                      name={getRarityIcon(fish.rarity)} 
                      size={16} 
                      color={getRarityColor(fish.rarity)} 
                    />
                    <Text style={[
                      styles.rarityText,
                      { color: getRarityColor(fish.rarity) }
                    ]}>
                      {fish.rarity.charAt(0).toUpperCase() + fish.rarity.slice(1)}
                    </Text>
                  </View>
                </View>

                <Text style={[
                  styles.speciesScientific,
                  !isCaught && styles.speciesScientificUncaught
                ]}>
                  {fish.scientific_name}
                </Text>

                <Text style={[
                  styles.speciesWaterType,
                  !isCaught && styles.speciesWaterTypeUncaught
                ]}>
                  {fish.water_type.charAt(0).toUpperCase() + fish.water_type.slice(1)}
                </Text>

                {isCaught && (
                  <View style={styles.catchStats}>
                    <Text style={styles.catchCount}>Caught {fish.times_caught} times</Text>
                    {fish.average_weight > 0 && (
                      <Text style={styles.catchStat}>
                        Avg: {convertWeightFromDb(fish.average_weight).toFixed(1)} {getUnitLabel('weight')}
                      </Text>
                    )}
                    {fish.biggest_catch > 0 && (
                      <Text style={styles.catchStat}>
                        Max: {convertWeightFromDb(fish.biggest_catch).toFixed(1)} {getUnitLabel('weight')}
                      </Text>
                    )}
                  </View>
                )}

                {!isCaught && (
                  <Text style={styles.uncaughtText}>
                    Not yet caught
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {filteredSpecies.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="fish-outline" size={64} color={APP_COLORS.textSecondary} />
          <Text style={styles.emptyText}>No species found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      )}

      {/* Species Detail Modal */}
      <Modal
        visible={showSpeciesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSpeciesModal(false)}>
              <Ionicons name="close" size={24} color={APP_COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Species Details</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedSpecies && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.speciesHeader}>
                {selectedSpecies.photo_url ? (
                  <Image source={{ uri: selectedSpecies.photo_url }} style={styles.modalSpeciesImage} />
                ) : (
                  <View style={[styles.modalSpeciesImage, styles.placeholderImage]}>
                    <Ionicons name="fish" size={60} color={APP_COLORS.primary} />
                  </View>
                )}
                
                <View style={styles.speciesHeaderInfo}>
                  <Text style={styles.modalSpeciesName}>{selectedSpecies.name}</Text>
                  <Text style={styles.modalScientificName}>{selectedSpecies.scientific_name}</Text>
                  
                  <View style={styles.rarityContainer}>
                    <Ionicons 
                      name={getRarityIcon(selectedSpecies.rarity)} 
                      size={20} 
                      color={getRarityColor(selectedSpecies.rarity)} 
                    />
                    <Text style={[styles.modalRarityText, { color: getRarityColor(selectedSpecies.rarity) }]}>
                      {selectedSpecies.rarity.charAt(0).toUpperCase() + selectedSpecies.rarity.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedSpecies.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.sectionText}>{selectedSpecies.description}</Text>
                </View>
              )}

              {selectedSpecies.habitat && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Habitat</Text>
                  <Text style={styles.sectionText}>{selectedSpecies.habitat}</Text>
                </View>
              )}

              {selectedSpecies.feeding_habits && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Feeding Habits</Text>
                  <Text style={styles.sectionText}>{selectedSpecies.feeding_habits}</Text>
                </View>
              )}

              {selectedSpecies.best_baits && selectedSpecies.best_baits.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Best Baits</Text>
                  <View style={styles.baitContainer}>
                    {selectedSpecies.best_baits.map((bait, index) => (
                      <View key={index} style={styles.baitTag}>
                        <Text style={styles.baitText}>{bait}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {selectedSpecies.is_unlocked && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Stats</Text>
                  <View style={styles.userStatsGrid}>
                    <View style={styles.userStatItem}>
                      <Text style={styles.userStatValue}>{selectedSpecies.times_caught}</Text>
                      <Text style={styles.userStatLabel}>Times Caught</Text>
                    </View>
                    {selectedSpecies.average_weight > 0 && (
                      <View style={styles.userStatItem}>
                        <Text style={styles.userStatValue}>{convertWeightFromDb(selectedSpecies.average_weight).toFixed(1)}</Text>
                        <Text style={styles.userStatLabel}>Avg Weight ({getUnitLabel('weight')})</Text>
                      </View>
                    )}
                    {selectedSpecies.biggest_catch > 0 && (
                      <View style={styles.userStatItem}>
                        <Text style={styles.userStatValue}>{convertWeightFromDb(selectedSpecies.biggest_catch).toFixed(1)}</Text>
                        <Text style={styles.userStatLabel}>Biggest ({getUnitLabel('weight')})</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
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
  headerCard: {
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
  filtersCard: {
    backgroundColor: APP_COLORS.surface,
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: APP_COLORS.background,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: APP_COLORS.text,
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  speciesCard: {
    width: '48%',
    backgroundColor: APP_COLORS.surface,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speciesCardUncaught: {
    opacity: 0.6,
  },
  speciesImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  speciesImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: APP_COLORS.background,
  },
  speciesImageUncaught: {
    opacity: 0.3,
  },
  speciesImagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: APP_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caughtBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  speciesInfo: {
    flex: 1,
  },
  speciesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    flex: 1,
  },
  speciesNameUncaught: {
    color: APP_COLORS.textSecondary,
  },
  rarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  speciesScientific: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  speciesScientificUncaught: {
    color: APP_COLORS.textSecondary,
    opacity: 0.6,
  },
  speciesWaterType: {
    fontSize: 12,
    color: APP_COLORS.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  speciesWaterTypeUncaught: {
    color: APP_COLORS.textSecondary,
  },
  catchStats: {
    gap: 2,
  },
  catchCount: {
    fontSize: 12,
    color: APP_COLORS.success,
    fontWeight: '600',
  },
  catchStat: {
    fontSize: 10,
    color: APP_COLORS.textSecondary,
  },
  uncaughtText: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: APP_COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
  },
  // New styles for enhanced features
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surface,
    margin: 16,
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: APP_COLORS.text,
  },
  searchButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: APP_COLORS.background,
  },
  biggestFishContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    alignItems: 'center',
  },
  biggestFishLabel: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    marginBottom: 4,
  },
  biggestFishText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.primary,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: APP_COLORS.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  speciesHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalSpeciesImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: APP_COLORS.background,
    marginBottom: 16,
  },
  modalSpeciesName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalScientificName: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalRarityText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    color: APP_COLORS.text,
    lineHeight: 24,
  },
  baitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  baitTag: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  baitText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  userStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: APP_COLORS.surface,
    padding: 16,
    borderRadius: 12,
  },
  userStatItem: {
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
    marginBottom: 4,
  },
  userStatLabel: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
  placeholderImage: {
    backgroundColor: APP_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
