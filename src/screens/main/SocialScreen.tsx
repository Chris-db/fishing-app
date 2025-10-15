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
import { supabase, Catch, User } from '../../services/supabase';
import { SocialService, SocialFeedItem, Comment, SocialStats } from '../../services/socialService';
import { useAuth } from '../../context/AuthContext';
import { useUnits } from '../../context/UnitsContext';
import { APP_COLORS } from '../../constants/config';

export default function SocialScreen() {
  const [feedItems, setFeedItems] = useState<SocialFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'feed' | 'nearby' | 'friends' | 'search'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedCatch, setSelectedCatch] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const { user } = useAuth();
  const { getUnitLabel, convertWeightFromDb, convertLengthFromDb } = useUnits();

  useEffect(() => {
    loadFeed();
  }, [selectedTab]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      let feedData: SocialFeedItem[] = [];

      switch (selectedTab) {
        case 'feed':
          feedData = await SocialService.getSocialFeed(user.id);
          break;
        case 'friends':
          feedData = await SocialService.getSocialFeed(user.id);
          break;
        case 'nearby':
          // TODO: Implement nearby catches with location
          feedData = [];
          break;
        case 'search':
          // Search is handled separately
          return;
      }

      setFeedItems(feedData);

      // Load social stats
      const stats = await SocialService.getSocialStats(user.id);
      setSocialStats(stats);

    } catch (error) {
      console.error('Error loading feed:', error);
      Alert.alert('Error', 'Failed to load social feed');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const handleLike = async (item: SocialFeedItem) => {
    if (!user) return;
    
    try {
      if (item.is_liked) {
        if (item.type === 'catch') {
          await SocialService.unlikeCatch(user.id, item.content.id);
        } else if (item.type === 'fishing_report') {
          await SocialService.unlikeReport(user.id, item.content.id);
        }
      } else {
        if (item.type === 'catch') {
          await SocialService.likeCatch(user.id, item.content.id);
        } else if (item.type === 'fishing_report') {
          await SocialService.likeReport(user.id, item.content.id);
        }
      }
      
      // Update local state
      setFeedItems(prev => prev.map(feedItem => 
        feedItem.id === item.id 
          ? { 
              ...feedItem, 
              is_liked: !feedItem.is_liked,
              likes_count: feedItem.is_liked ? feedItem.likes_count - 1 : feedItem.likes_count + 1
            }
          : feedItem
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (item: SocialFeedItem) => {
    if (item.type === 'catch') {
      setSelectedCatch(item.content.id);
      await loadComments(item.content.id);
      setShowComments(true);
    }
  };

  const loadComments = async (catchId: string) => {
    try {
      const commentsData = await SocialService.getComments(catchId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const addComment = async () => {
    if (!user || !selectedCatch || !newComment.trim()) return;
    
    try {
      await SocialService.addComment(user.id, selectedCatch, newComment.trim());
      setNewComment('');
      await loadComments(selectedCatch);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = await SocialService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;
    
    try {
      await SocialService.followUser(user.id, targetUserId);
      Alert.alert('Success', 'You are now following this user!');
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert('Error', 'Failed to follow user');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading social feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'feed' && styles.tabButtonActive
          ]}
          onPress={() => setSelectedTab('feed')}
        >
          <Ionicons 
            name={selectedTab === 'feed' ? 'globe' : 'globe-outline'} 
            size={20} 
            color={selectedTab === 'feed' ? 'white' : APP_COLORS.primary} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'feed' && styles.tabTextActive
          ]}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'friends' && styles.tabButtonActive
          ]}
          onPress={() => setSelectedTab('friends')}
        >
          <Ionicons 
            name={selectedTab === 'friends' ? 'people' : 'people-outline'} 
            size={20} 
            color={selectedTab === 'friends' ? 'white' : APP_COLORS.primary} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'friends' && styles.tabTextActive
          ]}>Friends</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'nearby' && styles.tabButtonActive
          ]}
          onPress={() => setSelectedTab('nearby')}
        >
          <Ionicons 
            name={selectedTab === 'nearby' ? 'location' : 'location-outline'} 
            size={20} 
            color={selectedTab === 'nearby' ? 'white' : APP_COLORS.primary} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'nearby' && styles.tabTextActive
          ]}>Nearby</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'search' && styles.tabButtonActive
          ]}
          onPress={() => setSelectedTab('search')}
        >
          <Ionicons 
            name={selectedTab === 'search' ? 'search' : 'search-outline'} 
            size={20} 
            color={selectedTab === 'search' ? 'white' : APP_COLORS.primary} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'search' && styles.tabTextActive
          ]}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Search Tab */}
      {selectedTab === 'search' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Ionicons name="search" size={20} color={APP_COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.searchResults}>
            {searchResults.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    {user.profile_pic ? (
                      <Image source={{ uri: user.profile_pic }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person" size={20} color={APP_COLORS.primary} />
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.username}>{user.username}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.followButton}
                  onPress={() => handleFollow(user.id)}
                >
                  <Text style={styles.followButtonText}>Follow</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Feed */}
      {selectedTab !== 'search' && (
        <ScrollView 
          style={styles.feedContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {feedItems.map((item) => (
            <View key={item.id} style={styles.catchCard}>
              {/* User Header */}
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    {item.user?.profile_pic ? (
                      <Image 
                        source={{ uri: item.user.profile_pic }} 
                        style={styles.avatarImage} 
                      />
                    ) : (
                      <Ionicons name="person" size={20} color={APP_COLORS.primary} />
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.username}>{item.user?.username}</Text>
                    <Text style={styles.catchTime}>{formatTimeAgo(item.created_at)}</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Ionicons name="ellipsis-horizontal" size={20} color={APP_COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Content based on type */}
              {item.type === 'catch' && (
                <View style={styles.catchContent}>
                  <Text style={styles.speciesName}>{item.content.species?.name}</Text>
                  {item.content.species?.scientific_name && (
                    <Text style={styles.scientificName}>{item.content.species.scientific_name}</Text>
                  )}
                  
                  {(item.content.weight || item.content.length) && (
                    <View style={styles.catchStats}>
                      {item.content.weight && (
                        <Text style={styles.catchStat}>
                          <Ionicons name="scale" size={14} color={APP_COLORS.primary} /> {convertWeightFromDb(item.content.weight).toFixed(1)} {getUnitLabel('weight')}
                        </Text>
                      )}
                      {item.content.length && (
                        <Text style={styles.catchStat}>
                          <Ionicons name="resize" size={14} color={APP_COLORS.primary} /> {convertLengthFromDb(item.content.length).toFixed(1)} {getUnitLabel('length')}
                        </Text>
                      )}
                    </View>
                  )}

                  {item.content.location && (
                    <View style={styles.locationContainer}>
                      <Ionicons name="location" size={14} color={APP_COLORS.textSecondary} />
                      <Text style={styles.locationText}>{item.content.location}</Text>
                    </View>
                  )}

                  {item.content.notes && (
                    <Text style={styles.catchNotes}>{item.content.notes}</Text>
                  )}
                </View>
              )}

              {item.type === 'achievement' && (
                <View style={styles.achievementContent}>
                  <Ionicons name="trophy" size={32} color={APP_COLORS.warning} />
                  <Text style={styles.achievementTitle}>{item.content.title}</Text>
                  <Text style={styles.achievementDescription}>{item.content.description}</Text>
                </View>
              )}

              {item.type === 'fishing_report' && (
                <View style={styles.reportContent}>
                  <Text style={styles.reportTitle}>Fishing Report</Text>
                  <Text style={styles.reportLocation}>{item.content.location_name}</Text>
                  <Text style={styles.reportSummary}>{item.content.weather_summary}</Text>
                  <Text style={styles.reportActivity}>
                    Activity Rating: {item.content.fish_activity_rating}/10
                  </Text>
                </View>
              )}

              {item.type === 'tip' && (
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{item.content.title}</Text>
                  <Text style={styles.tipContent}>{item.content.content}</Text>
                </View>
              )}

              {/* Photo */}
              {item.type === 'catch' && item.content.photo_url && (
                <Image source={{ uri: item.content.photo_url }} style={styles.catchPhoto} />
              )}

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleLike(item)}
                >
                  <Ionicons 
                    name={item.is_liked ? "heart" : "heart-outline"} 
                    size={20} 
                    color={item.is_liked ? APP_COLORS.error : APP_COLORS.textSecondary} 
                  />
                  <Text style={styles.actionText}>
                    {item.likes_count > 0 ? item.likes_count : ''} Like{item.likes_count !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>

                {item.type === 'catch' && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleComment(item)}
                  >
                    <Ionicons name="chatbubble-outline" size={20} color={APP_COLORS.textSecondary} />
                    <Text style={styles.actionText}>
                      {item.comments_count > 0 ? item.comments_count : ''} Comment{item.comments_count !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-outline" size={20} color={APP_COLORS.textSecondary} />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {feedItems.length === 0 && selectedTab !== 'search' && (
            <View style={styles.emptyContainer}>
              <Ionicons name="fish-outline" size={64} color={APP_COLORS.textSecondary} />
              <Text style={styles.emptyText}>No posts to show</Text>
              <Text style={styles.emptySubtext}>
                {selectedTab === 'friends' 
                  ? 'Follow some friends to see their posts!' 
                  : 'Be the first to share something!'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <Ionicons name="close" size={24} color={APP_COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.commentsContainer}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  {comment.user?.profile_pic ? (
                    <Image source={{ uri: comment.user.profile_pic }} style={styles.commentAvatarImage} />
                  ) : (
                    <Ionicons name="person" size={16} color={APP_COLORS.primary} />
                  )}
                </View>
                <View style={styles.commentContent}>
                  <Text style={styles.commentUsername}>{comment.user?.username}</Text>
                  <Text style={styles.commentText}>{comment.content}</Text>
                  <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity onPress={addComment} style={styles.sendButton}>
              <Ionicons name="send" size={20} color={APP_COLORS.primary} />
            </TouchableOpacity>
          </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.surface,
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: APP_COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: APP_COLORS.primary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: 'white',
  },
  feedContainer: {
    flex: 1,
  },
  catchCard: {
    backgroundColor: APP_COLORS.surface,
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  catchTime: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  catchContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  speciesName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  catchStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  catchStat: {
    fontSize: 14,
    color: APP_COLORS.text,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  catchNotes: {
    fontSize: 14,
    color: APP_COLORS.text,
    lineHeight: 20,
  },
  catchPhoto: {
    width: '100%',
    height: 200,
    backgroundColor: APP_COLORS.background,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
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
    textAlign: 'center',
  },
  // New styles for enhanced social features
  searchContainer: {
    flex: 1,
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
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
  searchResults: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  followButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  // Content type styles
  achievementContent: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: APP_COLORS.background,
    margin: 16,
    borderRadius: 12,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
  reportContent: {
    padding: 16,
    backgroundColor: APP_COLORS.background,
    margin: 16,
    borderRadius: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 8,
  },
  reportLocation: {
    fontSize: 14,
    color: APP_COLORS.primary,
    marginBottom: 4,
  },
  reportSummary: {
    fontSize: 14,
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  reportActivity: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  tipContent: {
    padding: 16,
    backgroundColor: APP_COLORS.background,
    margin: 16,
    borderRadius: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 8,
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
  commentsContainer: {
    flex: 1,
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: APP_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: APP_COLORS.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: APP_COLORS.surface,
  },
  commentInput: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: APP_COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
