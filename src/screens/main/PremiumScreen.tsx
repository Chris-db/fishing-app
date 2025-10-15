import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePremium } from '../../context/PremiumContext';
import { PREMIUM_TIERS, PREMIUM_FEATURES, getFeaturesByCategory } from '../../constants/premiumFeatures';
import { APP_COLORS } from '../../constants/config';

export default function PremiumScreen() {
  const { isPremium, upgradeToPremium, downgradeToFree } = usePremium();
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'yearly'>('yearly');

  const handleUpgrade = async () => {
    try {
      await upgradeToPremium();
      Alert.alert(
        'Welcome to Premium!',
        'You now have access to all premium features. Enjoy your enhanced fishing experience!',
        [{ text: 'Awesome!', style: 'default' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upgrade. Please try again.');
    }
  };

  const handleDowngrade = async () => {
    Alert.alert(
      'Cancel Premium',
      'Are you sure you want to cancel your premium subscription? You will lose access to premium features.',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Cancel Premium',
          style: 'destructive',
          onPress: async () => {
            try {
              await downgradeToFree();
              Alert.alert('Premium Cancelled', 'You have been downgraded to the free plan.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel premium. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderFeatureCategory = (category: string, title: string, icon: string) => {
    const features = getFeaturesByCategory(category);
    
    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <Ionicons name={icon as any} size={24} color={APP_COLORS.primary} />
          <Text style={styles.categoryTitle}>{title}</Text>
        </View>
        {features.map(feature => (
          <View key={feature.id} style={styles.featureItem}>
            <Ionicons 
              name={feature.isFree ? "checkmark-circle" : "star"} 
              size={16} 
              color={feature.isFree ? APP_COLORS.success : APP_COLORS.warning} 
            />
            <Text style={styles.featureName}>{feature.name}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPricingCard = (tier: typeof PREMIUM_TIERS[1]) => {
    const isSelected = !isPremium;
    const price = selectedTier === 'monthly' ? tier.price.monthly : tier.price.yearly;
    const savings = selectedTier === 'yearly' ? 
      Math.round(((tier.price.monthly * 12) - tier.price.yearly) / (tier.price.monthly * 12) * 100) : 0;

    return (
      <View style={[styles.pricingCard, isSelected && styles.pricingCardSelected]}>
        <View style={styles.pricingHeader}>
          <Text style={styles.pricingTitle}>{tier.name}</Text>
          {savings > 0 && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save {savings}%</Text>
            </View>
          )}
        </View>
        
        <View style={styles.pricingAmount}>
          <Text style={styles.pricingPrice}>${price}</Text>
          <Text style={styles.pricingPeriod}>
            /{selectedTier === 'monthly' ? 'month' : 'year'}
          </Text>
        </View>

        <Text style={styles.pricingDescription}>{tier.description}</Text>

        <View style={styles.featuresList}>
          {tier.features.map((feature, index) => (
            <View key={index} style={styles.pricingFeature}>
              <Ionicons name="checkmark" size={16} color={APP_COLORS.success} />
              <Text style={styles.pricingFeatureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {!isPremium && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isPremium) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="star" size={48} color={APP_COLORS.warning} />
          <Text style={styles.headerTitle}>Premium Active</Text>
          <Text style={styles.headerSubtitle}>
            You're enjoying all premium features!
          </Text>
        </View>

        <View style={styles.activeCard}>
          <Text style={styles.activeTitle}>Premium Benefits</Text>
          <Text style={styles.activeText}>
            • Advanced analytics and predictions{'\n'}
            • Unlimited offline catches{'\n'}
            • Historical weather data{'\n'}
            • Data export capabilities{'\n'}
            • Priority support{'\n'}
            • Ad-free experience
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleDowngrade}
        >
          <Text style={styles.cancelButtonText}>Cancel Premium</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="star-outline" size={48} color={APP_COLORS.primary} />
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <Text style={styles.headerSubtitle}>
          Unlock advanced features and take your fishing to the next level
        </Text>
      </View>

      {/* Pricing Toggle */}
      <View style={styles.pricingToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedTier === 'monthly' && styles.toggleButtonActive
          ]}
          onPress={() => setSelectedTier('monthly')}
        >
          <Text style={[
            styles.toggleText,
            selectedTier === 'monthly' && styles.toggleTextActive
          ]}>Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedTier === 'yearly' && styles.toggleButtonActive
          ]}
          onPress={() => setSelectedTier('yearly')}
        >
          <Text style={[
            styles.toggleText,
            selectedTier === 'yearly' && styles.toggleTextActive
          ]}>Yearly</Text>
        </TouchableOpacity>
      </View>

      {/* Pricing Card */}
      {renderPricingCard(PREMIUM_TIERS[1])}

      {/* Feature Categories */}
      <Text style={styles.sectionTitle}>What You Get</Text>
      
      {renderFeatureCategory('analytics', 'Advanced Analytics', 'analytics')}
      {renderFeatureCategory('offline', 'Offline Features', 'cloud-offline')}
      {renderFeatureCategory('export', 'Data Export', 'download')}
      {renderFeatureCategory('support', 'Premium Support', 'headset')}
      {renderFeatureCategory('customization', 'Customization', 'settings')}

      {/* Free Tier Info */}
      <View style={styles.freeTierCard}>
        <Text style={styles.freeTierTitle}>Free Plan</Text>
        <Text style={styles.freeTierDescription}>
          Perfect for casual anglers. Includes basic features with some usage limits.
        </Text>
        <View style={styles.freeTierFeatures}>
          <Text style={styles.freeTierFeature}>✓ Unlimited catch logging</Text>
          <Text style={styles.freeTierFeature}>✓ Basic weather data</Text>
          <Text style={styles.freeTierFeature}>✓ Social features</Text>
          <Text style={styles.freeTierFeature}>✓ Basic analytics (3 uses/month)</Text>
          <Text style={styles.freeTierFeature}>✓ 50 offline catches</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: APP_COLORS.surface,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  pricingToggle: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: APP_COLORS.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: APP_COLORS.textSecondary,
  },
  toggleTextActive: {
    color: 'white',
  },
  pricingCard: {
    backgroundColor: APP_COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pricingCardSelected: {
    borderColor: APP_COLORS.primary,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pricingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_COLORS.text,
  },
  savingsBadge: {
    backgroundColor: APP_COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pricingAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  pricingPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  pricingPeriod: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    marginLeft: 4,
  },
  pricingDescription: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 24,
  },
  featuresList: {
    marginBottom: 24,
  },
  pricingFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingFeatureText: {
    fontSize: 16,
    color: APP_COLORS.text,
    marginLeft: 8,
  },
  upgradeButton: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: APP_COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginLeft: 12,
  },
  featureItem: {
    marginBottom: 12,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '500',
    color: APP_COLORS.text,
    marginLeft: 8,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginLeft: 24,
    lineHeight: 20,
  },
  freeTierCard: {
    backgroundColor: APP_COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 12,
  },
  freeTierTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 8,
  },
  freeTierDescription: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 24,
  },
  freeTierFeatures: {
    gap: 4,
  },
  freeTierFeature: {
    fontSize: 14,
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  activeCard: {
    backgroundColor: APP_COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 12,
  },
  activeText: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    lineHeight: 24,
  },
  cancelButton: {
    backgroundColor: APP_COLORS.error,
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
