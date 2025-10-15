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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase, User } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useUnits } from '../../context/UnitsContext';
import { APP_COLORS } from '../../constants/config';

interface UserStats {
  totalCatches: number;
  speciesCount: number;
  avgWeight: number;
  maxWeight: number;
  avgLength: number;
  maxLength: number;
}

export default function ProfileScreen() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, signOut, updateProfile } = useAuth();
  const navigation = useNavigation();
  const { getUnitLabel, convertWeightFromDb, convertLengthFromDb } = useUnits();

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's catch statistics
      const { data: catchesData, error: catchesError } = await supabase
        .from('catches')
        .select('weight, length, species_id')
        .eq('user_id', user.id);

      if (catchesError) throw catchesError;

      // Calculate stats
      const totalCatches = catchesData?.length || 0;
      const uniqueSpecies = new Set(catchesData?.map(c => c.species_id)).size;
      const weights = catchesData?.filter(c => c.weight).map(c => c.weight) || [];
      const lengths = catchesData?.filter(c => c.length).map(c => c.length) || [];

      const stats: UserStats = {
        totalCatches,
        speciesCount: uniqueSpecies,
        avgWeight: weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : 0,
        maxWeight: weights.length ? Math.max(...weights) : 0,
        avgLength: lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0,
        maxLength: lengths.length ? Math.max(...lengths) : 0,
      };

      setUserStats(stats);

    } catch (error) {
      console.error('Error loading user stats:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserStats();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // TODO: Implement profile editing
    Alert.alert('Coming Soon', 'Profile editing will be available in a future update');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
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
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            {user?.profile_pic ? (
              <Image source={{ uri: user.profile_pic }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color={APP_COLORS.primary} />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{user?.username}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {user?.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color={APP_COLORS.textSecondary} />
                <Text style={styles.locationText}>{user.location}</Text>
              </View>
            )}
          </View>
        </View>
        
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="create" size={20} color={APP_COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      {userStats && (
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Your Fishing Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="fish" size={24} color={APP_COLORS.primary} />
              <Text style={styles.statNumber}>{userStats.totalCatches}</Text>
              <Text style={styles.statLabel}>Total Catches</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={24} color={APP_COLORS.warning} />
              <Text style={styles.statNumber}>{userStats.speciesCount}</Text>
              <Text style={styles.statLabel}>Species</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="scale" size={24} color={APP_COLORS.success} />
              <Text style={styles.statNumber}>
                {convertWeightFromDb(userStats.avgWeight).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Avg Weight ({getUnitLabel('weight')})</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="resize" size={24} color={APP_COLORS.primary} />
              <Text style={styles.statNumber}>
                {convertLengthFromDb(userStats.avgLength).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Avg Length ({getUnitLabel('length')})</Text>
            </View>
          </View>
        </View>
      )}

      {/* Personal Records */}
      {userStats && (userStats.maxWeight > 0 || userStats.maxLength > 0) && (
        <View style={styles.recordsCard}>
          <Text style={styles.cardTitle}>Personal Records</Text>
          <View style={styles.recordsList}>
            {userStats.maxWeight > 0 && (
              <View style={styles.recordItem}>
                <Ionicons name="trophy" size={20} color={APP_COLORS.warning} />
                <View style={styles.recordInfo}>
                  <Text style={styles.recordLabel}>Heaviest Fish</Text>
                  <Text style={styles.recordValue}>
                    {convertWeightFromDb(userStats.maxWeight).toFixed(1)} {getUnitLabel('weight')}
                  </Text>
                </View>
              </View>
            )}
            
            {userStats.maxLength > 0 && (
              <View style={styles.recordItem}>
                <Ionicons name="resize" size={20} color={APP_COLORS.primary} />
                <View style={styles.recordInfo}>
                  <Text style={styles.recordLabel}>Longest Fish</Text>
                  <Text style={styles.recordValue}>
                    {convertLengthFromDb(userStats.maxLength).toFixed(1)} {getUnitLabel('length')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Achievements */}
      <View style={styles.achievementsCard}>
        <Text style={styles.cardTitle}>Achievements</Text>
        <View style={styles.achievementsList}>
          <View style={styles.achievementItem}>
            <Ionicons name="star" size={24} color={APP_COLORS.warning} />
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>First Catch</Text>
              <Text style={styles.achievementDescription}>Caught your first fish</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={APP_COLORS.success} />
          </View>
          
          <View style={styles.achievementItem}>
            <Ionicons name="trophy" size={24} color={APP_COLORS.warning} />
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Species Collector</Text>
              <Text style={styles.achievementDescription}>Catch 5 different species</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={APP_COLORS.success} />
          </View>
          
          <View style={styles.achievementItem}>
            <Ionicons name="fish" size={24} color={APP_COLORS.primary} />
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Angler</Text>
              <Text style={styles.achievementDescription}>Catch 10 fish</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={APP_COLORS.success} />
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>Settings</Text>
        <View style={styles.settingsList}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Ionicons name="settings" size={24} color={APP_COLORS.primary} />
            <Text style={styles.settingText}>Units & Measurements</Text>
            <Ionicons name="chevron-forward" size={20} color={APP_COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications" size={24} color={APP_COLORS.primary} />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={APP_COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="shield-checkmark" size={24} color={APP_COLORS.primary} />
            <Text style={styles.settingText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color={APP_COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle" size={24} color={APP_COLORS.primary} />
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={APP_COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="information-circle" size={24} color={APP_COLORS.primary} />
            <Text style={styles.settingText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color={APP_COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out" size={20} color={APP_COLORS.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: APP_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  editButton: {
    padding: 8,
    backgroundColor: APP_COLORS.background,
    borderRadius: 20,
  },
  statsCard: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
  recordsCard: {
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
  recordsList: {
    gap: 12,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    gap: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordLabel: {
    fontSize: 14,
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  recordValue: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.primary,
  },
  achievementsCard: {
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
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    gap: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  settingsCard: {
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
  settingsList: {
    gap: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    color: APP_COLORS.text,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 12,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    color: APP_COLORS.error,
    fontWeight: '600',
  },
});
