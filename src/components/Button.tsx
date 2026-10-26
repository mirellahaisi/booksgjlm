import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet';
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  selected?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  selected,
  accessibilityLabel,
  style,
}: Props) {
  const foreground = variant === 'primary' ? colors.paper : colors.wine;
  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
        ...(selected !== undefined ? { selected } : {}),
      }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        style,
        { opacity: disabled ? 0.5 : pressed ? 0.75 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} accessibilityLabel="Carregando" />
      ) : icon ? (
        <Ionicons name={icon} size={20} color={foreground} accessible={false} />
      ) : null}
      <Text style={[styles.text, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    minWidth: 48,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.wine, borderColor: colors.wine },
  secondary: { backgroundColor: colors.paper, borderColor: colors.sand },
  quiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
  text: { fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'center' },
});
