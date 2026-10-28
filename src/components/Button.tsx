import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from './Icon';
import type { ComponentProps } from 'react';
import { colors } from '../theme';
import { Text } from './Typography';
import {
  decorativeAccessibility,
  loadingAccessibilityState,
  selectionAccessibilityState,
} from '../utils/accessibility';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet';
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  loadingLabel?: string;
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
  loading = false,
  loadingLabel,
  disabled = false,
  selected,
  accessibilityLabel,
  style,
}: Props) {
  const foreground = variant === 'primary' ? colors.paper : colors.wine;
  return (
    <Pressable
      accessible
      accessibilityLanguage="pt-BR"
      accessibilityRole="button"
      role="button"
      accessibilityLabel={
        loading
          ? (loadingLabel ?? `${accessibilityLabel ?? label}. Carregando`)
          : (accessibilityLabel ?? label)
      }
      aria-disabled={disabled}
      {...(Platform.OS === 'web' ? { 'aria-pressed': selected, 'aria-busy': loading } : {})}
      accessibilityState={{
        disabled,
        ...loadingAccessibilityState(loading),
        ...selectionAccessibilityState(selected),
      }}
      disabled={disabled}
      // O rótulo descreve o carregamento, sem os acréscimos nativos "busy"/"desativado" no iOS.
      // A guarda mantém toques e ativações pelo teclado bloqueados nesse período.
      onPress={() => {
        if (!loading && !disabled) onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        style,
        { opacity: disabled ? 0.5 : pressed ? 0.75 : 1 },
      ]}
    >
      <View style={styles.content} {...decorativeAccessibility} collapsable={false}>
        {loading ? (
          <ActivityIndicator {...decorativeAccessibility} color={foreground} />
        ) : icon ? (
          <Ionicons name={icon} size={20} color={foreground} accessible={false} />
        ) : null}
        <Text {...decorativeAccessibility} style={[styles.text, { color: foreground }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    minWidth: 48,
    maxWidth: '100%',
    flexShrink: 1,
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  secondary: { backgroundColor: colors.paper, borderColor: colors.sand },
  quiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
  text: { fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'center' },
});
