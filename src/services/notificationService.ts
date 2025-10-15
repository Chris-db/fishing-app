export interface Notification {
  id: string;
  type: 'catch_logged' | 'weather_alert' | 'achievement' | 'trophy' | 'milestone';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any; // Additional data for specific notification types
}

export interface WeatherAlert {
  type: 'good_weather' | 'bad_weather' | 'storm_warning' | 'temperature_alert';
  message: string;
  severity: 'info' | 'warning' | 'alert';
}

export interface Achievement {
  type: 'first_catch' | 'species_milestone' | 'size_record' | 'streak';
  title: string;
  description: string;
  icon: string;
}

class NotificationService {
  private notifications: Notification[] = [];
  private readonly STORAGE_KEY = 'fishtimes_notifications';

  // Load notifications from localStorage
  loadNotifications(): Notification[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.log('Error loading notifications:', error);
      this.notifications = [];
    }
    return this.notifications;
  }

  // Save notifications to localStorage
  private saveNotifications(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (error) {
      console.log('Error saving notifications:', error);
    }
  }

  // Add a new notification
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.notifications.unshift(newNotification); // Add to beginning
    this.saveNotifications();
    return newNotification;
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.saveNotifications();
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Clear all notifications
  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  // Clear old notifications (older than 30 days)
  clearOldNotifications(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.notifications = this.notifications.filter(notification => {
      return new Date(notification.timestamp) > thirtyDaysAgo;
    });
    this.saveNotifications();
  }

  // Create catch logged notification
  createCatchNotification(species: string, weight?: string, length?: string): Notification {
    const details = [];
    if (weight) details.push(`${weight} lbs`);
    if (length) details.push(`${length} inches`);
    
    const detailText = details.length > 0 ? ` (${details.join(', ')})` : '';
    
    return this.addNotification({
      type: 'catch_logged',
      title: '🎣 Catch Logged!',
      message: `Great catch! Your ${species}${detailText} has been added to your Trophy Room.`,
      data: { species, weight, length }
    });
  }

  // Create weather alert notification
  createWeatherAlert(alert: WeatherAlert): Notification {
    const icons = {
      good_weather: '☀️',
      bad_weather: '🌧️',
      storm_warning: '⛈️',
      temperature_alert: '🌡️'
    };

    const titles = {
      good_weather: 'Great Fishing Weather!',
      bad_weather: 'Weather Alert',
      storm_warning: 'Storm Warning',
      temperature_alert: 'Temperature Alert'
    };

    return this.addNotification({
      type: 'weather_alert',
      title: `${icons[alert.type]} ${titles[alert.type]}`,
      message: alert.message,
      data: { alert }
    });
  }

  // Create achievement notification
  createAchievementNotification(achievement: Achievement): Notification {
    return this.addNotification({
      type: 'achievement',
      title: `🏆 ${achievement.title}`,
      message: achievement.description,
      data: { achievement }
    });
  }

  // Create trophy notification (for size records, etc.)
  createTrophyNotification(title: string, message: string, data?: any): Notification {
    return this.addNotification({
      type: 'trophy',
      title: `🏆 ${title}`,
      message,
      data
    });
  }

  // Create milestone notification
  createMilestoneNotification(title: string, message: string, data?: any): Notification {
    return this.addNotification({
      type: 'milestone',
      title: `🎯 ${title}`,
      message,
      data
    });
  }

  // Check for achievements based on catch data
  checkAchievements(catches: any[]): void {
    if (catches.length === 0) return;

    // First catch achievement
    if (catches.length === 1) {
      this.createAchievementNotification({
        type: 'first_catch',
        title: 'First Catch!',
        description: 'Congratulations on logging your first catch!',
        icon: '🎣'
      });
    }

    // Species milestone achievements
    const speciesCount = new Map<string, number>();
    catches.forEach(catchItem => {
      const count = speciesCount.get(catchItem.species) || 0;
      speciesCount.set(catchItem.species, count + 1);
    });

    speciesCount.forEach((count, species) => {
      if (count === 5) {
        this.createAchievementNotification({
          type: 'species_milestone',
          title: 'Species Expert!',
          description: `You've caught 5 ${species}! You're becoming an expert.`,
          icon: '🐟'
        });
      } else if (count === 10) {
        this.createAchievementNotification({
          type: 'species_milestone',
          title: 'Species Master!',
          description: `Amazing! You've caught 10 ${species}! You're a true master.`,
          icon: '👑'
        });
      }
    });

    // Size record achievements
    catches.forEach(catchItem => {
      const weight = catchItem.weight ? parseFloat(catchItem.weight) : 0;
      const length = catchItem.length ? parseFloat(catchItem.length) : 0;

      if (weight >= 5) {
        this.createTrophyNotification(
          'Trophy Fish!',
          `Wow! That ${catchItem.species} weighing ${weight} lbs is a true trophy!`,
          { species: catchItem.species, weight, type: 'weight' }
        );
      }

      if (length >= 24) {
        this.createTrophyNotification(
          'Monster Fish!',
          `Incredible! That ${catchItem.species} measuring ${length} inches is a monster!`,
          { species: catchItem.species, length, type: 'length' }
        );
      }
    });

    // Total catch milestones
    if (catches.length === 10) {
      this.createMilestoneNotification(
        '10 Catches!',
        'You\'ve logged 10 catches! Keep up the great work!',
        { count: 10 }
      );
    } else if (catches.length === 25) {
      this.createMilestoneNotification(
        '25 Catches!',
        'Quarter century! You\'ve logged 25 catches. You\'re on fire!',
        { count: 25 }
      );
    } else if (catches.length === 50) {
      this.createMilestoneNotification(
        '50 Catches!',
        'Half century! 50 catches logged. You\'re a fishing legend!',
        { count: 50 }
      );
    }
  }

  // Generate weather alerts based on current conditions
  generateWeatherAlerts(weatherData: any): void {
    if (!weatherData) return;

    const temp = weatherData.main?.temp;
    const description = weatherData.weather?.[0]?.description?.toLowerCase() || '';
    const windSpeed = weatherData.wind?.speed || 0;

    // Good weather alerts
    if (temp >= 20 && temp <= 25 && description.includes('clear')) {
      this.createWeatherAlert({
        type: 'good_weather',
        message: 'Perfect fishing conditions! Clear skies and ideal temperature.',
        severity: 'info'
      });
    }

    // Bad weather alerts
    if (description.includes('rain') || description.includes('storm')) {
      this.createWeatherAlert({
        type: 'bad_weather',
        message: 'Rainy conditions ahead. Consider indoor activities or wait for better weather.',
        severity: 'warning'
      });
    }

    // Storm warnings
    if (description.includes('thunderstorm') || windSpeed > 15) {
      this.createWeatherAlert({
        type: 'storm_warning',
        message: 'Storm conditions detected. Stay safe and avoid fishing in dangerous weather.',
        severity: 'alert'
      });
    }

    // Temperature alerts
    if (temp < 5) {
      this.createWeatherAlert({
        type: 'temperature_alert',
        message: 'Very cold conditions. Dress warmly and be extra careful on the water.',
        severity: 'warning'
      });
    } else if (temp > 35) {
      this.createWeatherAlert({
        type: 'temperature_alert',
        message: 'Extremely hot conditions. Stay hydrated and take frequent breaks.',
        severity: 'warning'
      });
    }
  }
}

export const notificationService = new NotificationService();
