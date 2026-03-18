import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Content } from '../../types';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const CARD_WIDTH = 160;

interface ContentCardProps {
  content: Content;
  onPress: () => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({ content, onPress }) => {
  const { colors } = useTheme();

  // Only show badge for paid content — free is assumed
  const getAccessBadge = () => {
    switch (content.access_type) {
      case 'paid':
        return { text: `₹${content.price_inr ?? 0}`, gradient: ['#F59E0B', '#D97706'] as [string, string] };
      case 'premium':
        return { text: 'PREMIUM', gradient: ['#FFE66D', '#F7C948'] as [string, string] };
      case 'coins':
        return { text: `₹${content.price_inr ?? 0}`, gradient: ['#F59E0B', '#D97706'] as [string, string] };
      default:
        return null;
    }
  };

  const badge = getAccessBadge();

  const styles = useMemo(() => StyleSheet.create({
    card: { width: CARD_WIDTH, marginRight: spacing.md, marginBottom: spacing.sm },
    imageContainer: {
      width: CARD_WIDTH,
      height: 240,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.backgroundCard,
      elevation: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    image: { width: '100%', height: '100%' },
    gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
    accessBadge: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' as const },
    bottomInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md },
    title: { ...typography.bodySmall, color: '#fff', fontWeight: '700' as const, marginBottom: 4 },
    author: { ...typography.caption, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
    languagePill: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginTop: 2,
    },
    languagePillText: { color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: '600' as const },
  }), [colors]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image
          source={content.cover_image ? { uri: content.cover_image } : require('../../../assets/images/icon.png')}
          style={styles.image}
          defaultSource={require('../../../assets/images/icon.png')}
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.gradient} />
        {badge && (
          <LinearGradient
            colors={badge.gradient}
            style={styles.accessBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {badge.icon && <Ionicons name={badge.icon as any} size={10} color="#fff" />}
            <Text style={styles.badgeText}>{badge.text}</Text>
          </LinearGradient>
        )}
        <View style={styles.bottomInfo}>
          <Text style={styles.title} numberOfLines={2}>{content.title}</Text>
          <Text style={styles.author} numberOfLines={1}>{content.author_name}</Text>
          {content.language ? (
            <View style={styles.languagePill}>
              <Text style={styles.languagePillText}>{content.language}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};
