import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Content } from '../../types';
import { ContentCard } from '../cards/ContentCard';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

interface ContentCarouselProps {
  title: string;
  items: Content[];
  onSeeAll?: () => void;
}

export const ContentCarousel: React.FC<ContentCarouselProps> = ({ title, items, onSeeAll }) => {
  const router = useRouter();
  const { colors } = useTheme();

  const handleContentPress = (content: Content) => {
    if (content.content_type === 'book') router.push(`/book/${content.id}`);
    else if (content.content_type === 'audiobook') router.push(`/audiobook/${content.id}`);
    else if (content.content_type === 'podcast') router.push(`/podcast/${content.id}`);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { marginBottom: spacing.lg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    title: { ...typography.h3, color: colors.text },
    seeAll: { ...typography.bodySmall, color: colors.primary },
    scrollContent: { paddingHorizontal: spacing.md },
  }), [colors]);

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && <Text style={styles.seeAll} onPress={onSeeAll}>See All</Text>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {items.map((item) => (
          <ContentCard key={`${item.content_type}-${item.id}`} content={item} onPress={() => handleContentPress(item)} />
        ))}
      </ScrollView>
    </View>
  );
};
