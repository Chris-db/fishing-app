import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService, Notification } from '../../services/notificationService';
import { APP_COLORS } from '../../constants/config';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    try {
      const loadedNotifications = notificationService.loadNotifications();
      setNotifications(loadedNotifications);
      setUnreadCount(notificationService.getUnreadCount());
    } catch (error) {
      console.log('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    loadNotifications(); // Reload to update UI
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    loadNotifications();
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            notificationService.clearAll();
            loadNotifications();
          }
        }
      ]
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'catch_logged':
        return 'fish-outline';
      case 'weather_alert':
        return 'partly-sunny-outline';
      case 'achievement':
        return 'trophy-outline';
      case 'trophy':
        return 'medal-outline';
      case 'milestone':
        return 'flag-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'catch_logged':
        return APP_COLORS.primary;
      case 'weather_alert':
        return '#ffa726';
      case 'achievement':
        return '#66bb6a';
      case 'trophy':
        return '#ff6b6b';
      case 'milestone':
        return '#9c27b0';
      default:
        return APP_COLORS.textSecondary;
    }
  };

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        !notification.read && styles.unreadNotification
      ]}
      onPress={() => markAsRead(notification.id)}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(notification.type) + '20' }
        ]}>
          <Ionicons
            name={getNotificationIcon(notification.type) as any}
            size={24}
            color={getNotificationColor(notification.type)}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[
            styles.notificationTitle,
            !notification.read && styles.unreadText
          ]}>
            {notification.title}
          </Text>
          <Text style={styles.notificationMessage}>
            {notification.message}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(notification.timestamp)}
          </Text>
        </View>

        {!notification.read && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadNotifications} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🔔 Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              {unreadCount > 0 && ` • ${unreadCount} unread`}
            </Text>
          </View>
          
          {notifications.length > 0 && (
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
                  <Text style={styles.markAllButtonText}>Mark All Read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.clearButton} onPress={clearAllNotifications}>
                <Ionicons name="trash-outline" size={16} color="#ff4444" />
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color={APP_COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              You'll receive notifications for catches, weather alerts, and achievements here.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map(renderNotification)}
          </View>
        )}

        {/* Quick Actions */}
        {notifications.length > 0 && (
          <View style={styles.quickActions}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={styles.quickActionButton} onPress={loadNotifications}>
                <Ionicons name="refresh-outline" size={20} color={APP_COLORS.primary} />
                <Text style={styles.quickActionText}>Refresh</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton} 
                onPress={() => {
                  notificationService.clearOldNotifications();
                  loadNotifications();
                }}
              >
                <Ionicons name="time-outline" size={20} color={APP_COLORS.primary} />
                <Text style={styles.quickActionText}>Clear Old</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
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
  headerContent: {
    marginBottom: 12,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: APP_COLORS.primary + '20',
    borderRadius: 6,
  },
  markAllButtonText: {
    color: APP_COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  notificationsList: {
    paddingHorizontal: 16,
  },
  notificationCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: APP_COLORS.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: APP_COLORS.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP_COLORS.primary,
    marginLeft: 8,
    marginTop: 4,
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
  quickActions: {
    margin: 16,
    padding: 16,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 12,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: APP_COLORS.primary + '10',
    borderRadius: 8,
  },
  quickActionText: {
    color: APP_COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});
