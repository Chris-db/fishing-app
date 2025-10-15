import { supabase, User, Catch } from './supabase';

export interface SocialFeedItem {
  id: string;
  type: 'catch' | 'achievement' | 'fishing_report' | 'tip';
  user: User;
  content: any;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_following: boolean;
}

export interface Friendship {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower: User;
  following: User;
}

export interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: User;
}

export interface Like {
  id: string;
  user_id: string;
  created_at: string;
  user: User;
}

export interface SocialStats {
  followers_count: number;
  following_count: number;
  total_posts: number;
  total_likes_received: number;
  total_comments_received: number;
}

export class SocialService {
  // Mock data for development
  static getMockSocialFeed(): SocialFeedItem[] {
    return [
      {
        id: '1',
        type: 'catch',
        user: {
          id: 'user1',
          username: 'fisherman_joe',
          display_name: 'Joe Fisherman',
          profile_pic: null,
          bio: 'Passionate angler from the coast',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          email: 'joe@example.com',
          full_name: 'Joe Fisherman'
        },
        content: {
          species: 'Bass',
          weight: 3.2,
          length: 18.5,
          location: 'Lake Superior',
          date: '2024-01-15',
          photo_url: null,
          bait_used: 'Live minnows',
          notes: 'Great day on the water!'
        },
        created_at: '2024-01-15T10:30:00Z',
        likes_count: 12,
        comments_count: 3,
        is_liked: false,
        is_following: true
      },
      {
        id: '2',
        type: 'catch',
        user: {
          id: 'user2',
          username: 'trout_master',
          display_name: 'Trout Master',
          profile_pic: null,
          bio: 'Trout fishing specialist',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          email: 'trout@example.com',
          full_name: 'Trout Master'
        },
        content: {
          species: 'Rainbow Trout',
          weight: 2.8,
          length: 16.2,
          location: 'Mountain Stream',
          date: '2024-01-14',
          photo_url: null,
          bait_used: 'Fly fishing',
          notes: 'Beautiful catch in the early morning'
        },
        created_at: '2024-01-14T06:45:00Z',
        likes_count: 8,
        comments_count: 1,
        is_liked: true,
        is_following: false
      },
      {
        id: '3',
        type: 'tip',
        user: {
          id: 'user3',
          username: 'fishing_guru',
          display_name: 'Fishing Guru',
          profile_pic: null,
          bio: 'Sharing fishing tips and tricks',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          email: 'guru@example.com',
          full_name: 'Fishing Guru'
        },
        content: {
          title: 'Best Time to Fish',
          description: 'Early morning and late evening are the best times for bass fishing. The water is cooler and fish are more active.',
          category: 'fishing_tips'
        },
        created_at: '2024-01-13T14:20:00Z',
        likes_count: 25,
        comments_count: 7,
        is_liked: false,
        is_following: true
      }
    ];
  }

  // Friends/Following Management
  static async followUser(userId: string, targetUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          follower_id: userId,
          following_id: targetUserId,
        });

      if (error) throw error;

      // Create notification for the followed user
      await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          message: 'Someone started following you!',
          type: 'friend',
          data: { follower_id: userId },
        });
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  static async unfollowUser(userId: string, targetUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUserId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  static async getFollowers(userId: string): Promise<Friendship[]> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          follower:users!friendships_follower_id_fkey(*)
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching followers:', error);
      throw error;
    }
  }

  static async getFollowing(userId: string): Promise<Friendship[]> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          following:users!friendships_following_id_fkey(*)
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching following:', error);
      throw error;
    }
  }

  static async isFollowing(userId: string, targetUserId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  // Social Feed
  static async getSocialFeed(userId: string, limit: number = 20, offset: number = 0): Promise<SocialFeedItem[]> {
    try {
      // Get catches from followed users
      const { data: catches, error: catchesError } = await supabase
        .from('catches')
        .select(`
          *,
          user:users(*),
          fish_species(*),
          catch_likes(count),
          catch_comments(count)
        `)
        .in('user_id', await this.getFollowingUserIds(userId))
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (catchesError) throw catchesError;

      // Get fishing reports from followed users
      const { data: reports, error: reportsError } = await supabase
        .from('fishing_reports')
        .select(`
          *,
          user:users(*),
          report_likes(count),
          report_comments(count)
        `)
        .in('user_id', await this.getFollowingUserIds(userId))
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (reportsError) throw reportsError;

      // Get achievements from followed users
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select(`
          *,
          user:users(*)
        `)
        .in('user_id', await this.getFollowingUserIds(userId))
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (achievementsError) throw achievementsError;

      // Get fishing tips
      const { data: tips, error: tipsError } = await supabase
        .from('fishing_tips')
        .select(`
          *,
          author:users(*),
          tip_likes(count)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (tipsError) throw tipsError;

      // Combine and sort all feed items
      const feedItems: SocialFeedItem[] = [];

      // Add catches
      catches?.forEach(catch_ => {
        feedItems.push({
          id: `catch_${catch_.id}`,
          type: 'catch',
          user: catch_.user,
          content: catch_,
          created_at: catch_.created_at,
          likes_count: catch_.catch_likes?.[0]?.count || 0,
          comments_count: catch_.catch_comments?.[0]?.count || 0,
          is_liked: false, // TODO: Check if current user liked this
          is_following: true,
        });
      });

      // Add reports
      reports?.forEach(report => {
        feedItems.push({
          id: `report_${report.id}`,
          type: 'fishing_report',
          user: report.user,
          content: report,
          created_at: report.created_at,
          likes_count: report.report_likes?.[0]?.count || 0,
          comments_count: report.report_comments?.[0]?.count || 0,
          is_liked: false,
          is_following: true,
        });
      });

      // Add achievements
      achievements?.forEach(achievement => {
        feedItems.push({
          id: `achievement_${achievement.id}`,
          type: 'achievement',
          user: achievement.user,
          content: achievement,
          created_at: achievement.created_at,
          likes_count: 0,
          comments_count: 0,
          is_liked: false,
          is_following: true,
        });
      });

      // Add tips
      tips?.forEach(tip => {
        feedItems.push({
          id: `tip_${tip.id}`,
          type: 'tip',
          user: tip.author,
          content: tip,
          created_at: tip.created_at,
          likes_count: tip.tip_likes?.[0]?.count || 0,
          comments_count: 0,
          is_liked: false,
          is_following: false,
        });
      });

      // Sort by creation date
      feedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return feedItems.slice(0, limit);
    } catch (error) {
      console.error('Error fetching social feed:', error);
      throw error;
    }
  }

  private static async getFollowingUserIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) throw error;
      return data?.map(f => f.following_id) || [];
    } catch (error) {
      console.error('Error fetching following user IDs:', error);
      return [];
    }
  }

  // Likes Management
  static async likeCatch(userId: string, catchId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('catch_likes')
        .insert({
          user_id: userId,
          catch_id: catchId,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error liking catch:', error);
      throw error;
    }
  }

  static async unlikeCatch(userId: string, catchId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('catch_likes')
        .delete()
        .eq('user_id', userId)
        .eq('catch_id', catchId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unliking catch:', error);
      throw error;
    }
  }

  static async likeReport(userId: string, reportId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('report_likes')
        .insert({
          user_id: userId,
          report_id: reportId,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error liking report:', error);
      throw error;
    }
  }

  static async unlikeReport(userId: string, reportId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('report_likes')
        .delete()
        .eq('user_id', userId)
        .eq('report_id', reportId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unliking report:', error);
      throw error;
    }
  }

  // Comments Management
  static async addComment(userId: string, catchId: string, content: string): Promise<Comment> {
    try {
      const { data, error } = await supabase
        .from('catch_comments')
        .insert({
          user_id: userId,
          catch_id: catchId,
          comment: content,
        })
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) throw error;

      // Create notification for catch owner
      const { data: catchData } = await supabase
        .from('catches')
        .select('user_id')
        .eq('id', catchId)
        .single();

      if (catchData && catchData.user_id !== userId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: catchData.user_id,
            message: 'Someone commented on your catch!',
            type: 'catch',
            data: { catch_id: catchId, commenter_id: userId },
          });
      }

      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  static async getComments(catchId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('catch_comments')
        .select(`
          *,
          user:users(*)
        `)
        .eq('catch_id', catchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // User Search
  static async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Social Stats
  static async getSocialStats(userId: string): Promise<SocialStats> {
    try {
      const [followers, following, posts, likes, comments] = await Promise.all([
        this.getFollowers(userId),
        this.getFollowing(userId),
        this.getUserPosts(userId),
        this.getUserLikesReceived(userId),
        this.getUserCommentsReceived(userId),
      ]);

      return {
        followers_count: followers.length,
        following_count: following.length,
        total_posts: posts.length,
        total_likes_received: likes,
        total_comments_received: comments,
      };
    } catch (error) {
      console.error('Error fetching social stats:', error);
      throw error;
    }
  }

  private static async getUserPosts(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('catches')
        .select('id')
        .eq('user_id', userId)
        .eq('privacy', 'public');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return [];
    }
  }

  private static async getUserLikesReceived(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('catch_likes')
        .select('id', { count: 'exact' })
        .in('catch_id', await this.getUserCatchIds(userId));

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error fetching user likes received:', error);
      return 0;
    }
  }

  private static async getUserCommentsReceived(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('catch_comments')
        .select('id', { count: 'exact' })
        .in('catch_id', await this.getUserCatchIds(userId));

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error fetching user comments received:', error);
      return 0;
    }
  }

  private static async getUserCatchIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('catches')
        .select('id')
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map(c => c.id) || [];
    } catch (error) {
      console.error('Error fetching user catch IDs:', error);
      return [];
    }
  }

  // Nearby Catches
  static async getNearbyCatches(lat: number, lng: number, radius: number = 10): Promise<Catch[]> {
    try {
      const { data, error } = await supabase
        .from('catches')
        .select(`
          *,
          user:users(*),
          fish_species(*)
        `)
        .eq('privacy', 'public')
        .not('coordinates', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter by distance (simplified - in production, use PostGIS)
      const nearbyCatches = data?.filter(catch_ => {
        if (!catch_.coordinates) return false;
        // Simple distance calculation (not accurate for large distances)
        const distance = Math.sqrt(
          Math.pow(catch_.coordinates.lat - lat, 2) + 
          Math.pow(catch_.coordinates.lng - lng, 2)
        ) * 111; // Rough conversion to km
        return distance <= radius;
      }) || [];

      return nearbyCatches;
    } catch (error) {
      console.error('Error fetching nearby catches:', error);
      throw error;
    }
  }

  // Notifications
  static async getNotifications(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}
