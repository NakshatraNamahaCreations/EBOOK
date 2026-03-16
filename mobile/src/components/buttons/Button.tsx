import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    button: {
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    secondary: { backgroundColor: colors.backgroundElevated, shadowColor: '#000' },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary,
      shadowOpacity: 0,
      elevation: 0,
    },
    small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    large: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
    fullWidth: { width: '100%' },
    disabled: { opacity: 0.5 },
    text: { color: '#fff', fontWeight: '700' as const },
    smallText: { fontSize: 13 },
    mediumText: { fontSize: 16 },
    largeText: { fontSize: 18 },
    outlineText: { color: colors.primary },
  }), [colors]);

  const buttonStyle: ViewStyle[] = [
    styles.button,
    styles[size as 'small' | 'medium' | 'large'],
    fullWidth ? styles.fullWidth : undefined,
    (disabled || loading) ? styles.disabled : undefined,
    variant === 'outline' ? styles.outline : undefined,
    variant === 'secondary' ? styles.secondary : undefined,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`${size}Text` as 'smallText' | 'mediumText' | 'largeText'],
    variant === 'outline' ? styles.outlineText : undefined,
  ].filter(Boolean) as TextStyle[];

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : '#fff'} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity disabled={disabled || loading} activeOpacity={0.8} {...props}>
        <LinearGradient
          colors={colors.gradientPrimary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[...buttonStyle, { opacity: disabled || loading ? 0.5 : 1 }]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
