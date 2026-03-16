import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import api from '../../src/services/api';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { walletService } from '../../src/services/wallet.service';
import { updateCoinBalance } from '../../src/store/slices/authSlice';
import { Button } from '../../src/components/buttons/Button';

export default function ReaderScreen() {
  const { id, chapterId } = useLocalSearchParams<{ id: string; chapterId?: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { width } = useWindowDimensions();
  
  const [fontSize, setFontSize] = useState(16);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [chapter, setChapter] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(true);

  const fetchChapter = async () => {
    if (!chapterId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/reader/books/${id}/chapters/${chapterId}`);
      
      const payload = res.data;
      if (payload?.chapter) {
        setChapter(payload.chapter);
        setIsUnlocked(payload.isUnlocked !== false);
      } else {
        setChapter(payload || null);
        setIsUnlocked(true);
      }
    } catch (error) {
      console.error('Failed to fetch chapter', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapter();
  }, [id, chapterId]);

  const handleUnlock = async () => {
    if (!user || !chapter) return;
    const cost = chapter.coinCost || chapter.coin_cost || 0;
    
    if ((user.coin_balance || 0) < cost) {
      Alert.alert('Insufficient Coins', 'You do not have enough coins to unlock this chapter.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Coins', onPress: () => router.push('/wallet') }
      ]);
      return;
    }

    setIsProcessing(true);
    try {
      await walletService.unlockContent('chapter', chapter._id || chapter.id, cost);
      Alert.alert('Success', 'Chapter unlocked successfully!');
      dispatch(updateCoinBalance(user.coin_balance - cost));
      // Re-fetch chapter to get the full HTML content
      await fetchChapter();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to unlock chapter');
    } finally {
      setIsProcessing(false);
    }
  };

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
          <>
            {/* If user has access OR we somehow got html content, render it */}
            {isUnlocked && chapter.contentHtml ? (
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
              <View>
                <Text style={[styles.text, { fontSize }]}>{chapter.contentPreview}...</Text>
                
                {!isUnlocked && (
                  <View style={styles.paywallContainer}>
                    <Ionicons name="lock-closed" size={48} color={colors.primary} style={styles.paywallIcon} />
                    <Text style={styles.paywallTitle}>Chapter Locked</Text>
                    <Text style={styles.paywallDesc}>
                      Unlock this chapter to continue reading. It costs <Text style={styles.paywallHighlight}>{chapter.coinCost || chapter.coin_cost || 0} coins</Text>.
                    </Text>
                    
                    <Button 
                      title={isProcessing ? "Processing..." : `Unlock for ${chapter.coinCost || chapter.coin_cost || 0} 🪙`} 
                      onPress={handleUnlock} 
                      disabled={isProcessing}
                      style={styles.unlockButton} 
                    />
                    
                    <View style={styles.paywallDivider}>
                      <View style={styles.paywallDividerLine} />
                      <Text style={styles.paywallDividerText}>OR</Text>
                      <View style={styles.paywallDividerLine} />
                    </View>

                    <Button 
                      title="Go Premium & Read All" 
                      variant="outline"
                      onPress={() => router.push('/subscription')} 
                      style={styles.premiumButton} 
                    />
                  </View>
                )}
              </View>
            ) : (
              <Text style={[styles.text, { fontSize }]}>The text for this chapter is empty.</Text>
            )}
          </>
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
    paddingBottom: spacing.xxl * 2,
  },
  text: {
    color: colors.text,
    lineHeight: 28,
  },
  paywallContainer: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  paywallIcon: {
    marginBottom: spacing.md,
  },
  paywallTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  paywallDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  paywallHighlight: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  unlockButton: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  paywallDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  paywallDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  paywallDividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  premiumButton: {
    width: '100%',
  },
});
