import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { TextInput } from '../../src/components/inputs/TextInput';
import { contentService } from '../../src/services/content.service';
import { Content, ContentType } from '../../src/types';
import { ContentCard } from '../../src/components/cards/ContentCard';
import { useTheme } from '../../src/theme/ThemeContext';

const contentTypes: { label: string; value: ContentType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Books', value: ContentType.BOOK },
  { label: 'Audiobooks', value: ContentType.AUDIOBOOK },
  { label: 'Podcasts', value: ContentType.PODCAST },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [searchResults, setSearchResults] = useState<Content[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await contentService.searchContent(
        searchQuery,
        selectedType === 'all' ? undefined : selectedType
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleContentPress = (content: Content) => {
    if (content.content_type === ContentType.BOOK) router.push(`/book/${content.id}`);
    else if (content.content_type === ContentType.AUDIOBOOK) router.push(`/audiobook/${content.id}`);
    else if (content.content_type === ContentType.PODCAST) router.push(`/podcast/${content.id}`);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchContainer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: spacing.md,
    },
    searchInputContainer: { position: 'relative' },
    searchButton: { position: 'absolute', right: spacing.md, top: spacing.md + 4 },
    filterContainer: { marginTop: spacing.md },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      backgroundColor: colors.backgroundCard,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterChipText: { ...typography.bodySmall, color: colors.textSecondary },
    filterChipTextActive: { color: '#fff', fontWeight: '600' as const },
    results: { flex: 1 },
    resultsContent: { padding: spacing.md },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { marginBottom: spacing.lg },
    message: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 2 },
    emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
    emptyText: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
    emptySubtext: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            placeholder="Search books, audiobooks, podcasts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Search size={22} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {contentTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.filterChip, selectedType === type.value && styles.filterChipActive]}
              onPress={() => setSelectedType(type.value)}
            >
              <Text style={[styles.filterChipText, selectedType === type.value && styles.filterChipTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.results} contentContainerStyle={styles.resultsContent}>
        {isSearching ? (
          <Text style={styles.message}>Searching...</Text>
        ) : searchResults.length > 0 ? (
          <View style={styles.grid}>
            {searchResults.map((content) => (
              <View key={content.id} style={styles.gridItem}>
                <ContentCard content={content} onPress={() => handleContentPress(content)} />
              </View>
            ))}
          </View>
        ) : searchQuery ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySubtext}>Try different keywords</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>Discover Great Content</Text>
            <Text style={styles.emptySubtext}>Search for books, audiobooks, and podcasts</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
