import React, { useMemo, useState } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: { marginBottom: spacing.md },
    label: { ...typography.bodySmall, color: colors.text, marginBottom: spacing.sm },
    input: {
      backgroundColor: colors.backgroundCard,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      color: colors.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputFocused: { borderColor: colors.primary },
    inputError: { borderColor: colors.error },
    error: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
  }), [colors]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};
