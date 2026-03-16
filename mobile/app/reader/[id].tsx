import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import api from '../../src/services/api';

export default function ReaderScreen() {
  const { id, chapterId } = useLocalSearchParams<{ id: string; chapterId?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [fontSize, setFontSize] = useState(16);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<any>(null);

  useEffect(() => {
    const fetchChapter = async () => {
      if (!chapterId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await api.get(`/reader/books/${id}/chapters/${chapterId}`);
        setChapter(res.data?.chapter || res.data || null);
      } catch (error) {
        console.error('Failed to fetch chapter', error);
      } finally {
        setLoading(false);
      }
    };
    fetchChapter();
  }, [id, chapterId]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {chapter ? chapter.title : 'Chapter'}
        </Text>
        <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Settings Panel */}
      {showSettings && (
        <View style={styles.settings}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Font Size</Text>
            <View style={styles.fontControls}>
              <TouchableOpacity
                onPress={() => setFontSize(Math.max(12, fontSize - 2))}
                style={styles.fontButton}
              >
                <Text style={styles.fontButtonText}>A-</Text>
              </TouchableOpacity>
              <Text style={styles.fontSizeText}>{fontSize}</Text>
              <TouchableOpacity
                onPress={() => setFontSize(Math.min(24, fontSize + 2))}
                style={styles.fontButton}
              >
                <Text style={styles.fontButtonText}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : chapter ? (
          chapter.contentHtml ? (
            <RenderHtml
              contentWidth={width}
              source={{ html: chapter.contentHtml }}
              tagsStyles={{
                p: { 
                  color: colors.text, 
                  fontSize: fontSize, 
                  lineHeight: fontSize * 1.6, 
                  marginBottom: spacing.md 
                },
                span: {
                  color: colors.text,
                  fontSize: fontSize,
                },
                strong: { color: colors.text, fontSize: fontSize, fontWeight: 'bold' },
                h1: { color: colors.text, fontSize: fontSize + 8, marginBottom: spacing.md },
                h2: { color: colors.text, fontSize: fontSize + 6, marginBottom: spacing.sm },
                h3: { color: colors.text, fontSize: fontSize + 4, marginBottom: spacing.sm },
              }}
            />
          ) : chapter.contentPreview ? (
            <Text style={[styles.text, { fontSize }]}>{chapter.contentPreview}</Text>
          ) : (
            <Text style={[styles.text, { fontSize }]}>The text for this chapter is empty.</Text>
          )
        ) : (
          <Text style={[styles.text, { fontSize, textAlign: 'center', marginTop: 40 }]}>
            Unable to fetch chapter content.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  settings: {
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    ...typography.body,
    color: colors.text,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fontButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontButtonText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  fontSizeText: {
    ...typography.body,
    color: colors.text,
    width: 30,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  text: {
    color: colors.text,
    lineHeight: 28,
  },
});
