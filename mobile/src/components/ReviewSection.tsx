import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface Props {
  bookId: string;
}

export const ReviewSection: React.FC<Props> = ({ bookId }) => {
  const { colors } = useTheme();
  const [existingReview, setExistingReview] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/reader/books/${bookId}/review`)
      .then((res: any) => {
        const data = (res as any).data;
        if (data) {
          setExistingReview(data);
          setRating(data.rating);
          setBody(data.body || '');
          setSubmitted(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res: any = await api.post(`/reader/books/${bookId}/review`, { rating, body });
      setExistingReview((res as any).data);
      setSubmitted(true);
      Alert.alert('Thank you!', 'Your review has been submitted.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const s = StyleSheet.create({
    container: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    title: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    stars: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      padding: spacing.sm, color: colors.text, minHeight: 80,
      textAlignVertical: 'top', marginBottom: spacing.md,
      ...typography.body,
    },
    btn: {
      backgroundColor: colors.primary, borderRadius: 10,
      paddingVertical: 12, alignItems: 'center',
    },
    btnText: { ...typography.body, color: '#fff', fontWeight: '600' as const },
    submitted: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
    submittedText: { ...typography.bodySmall, color: colors.textSecondary },
    reviewBody: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic' },
  });

  if (loading) return null;

  return (
    <View style={s.container}>
      <Text style={s.title}>Your Review</Text>

      {submitted ? (
        <>
          <View style={s.submitted}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons key={i} name="star" size={20} color={i <= rating ? '#F59E0B' : colors.border} />
            ))}
            <Text style={s.submittedText}>· Submitted</Text>
          </View>
          {body ? <Text style={s.reviewBody}>"{body}"</Text> : null}
        </>
      ) : (
        <>
          {/* Star picker */}
          <View style={s.stars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Ionicons name="star" size={32} color={i <= rating ? '#F59E0B' : colors.border} />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[s.input, { backgroundColor: colors.backgroundCard }]}
            placeholder="Write a review (optional)..."
            placeholderTextColor={colors.textMuted}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={500}
          />

          <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Submit Review</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};
