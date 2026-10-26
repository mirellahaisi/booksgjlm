import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors, common } from '../theme';

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <View
      style={styles.state}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator size="large" color={colors.wine} />
      <Text style={common.subtitle}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  error = false,
  action,
  onAction,
}: {
  title: string;
  message: string;
  error?: boolean;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.icon}>
        <Ionicons
          name={error ? 'cloud-offline-outline' : 'book-outline'}
          size={34}
          color={colors.wine}
          accessible={false}
        />
      </View>
      <Text accessibilityRole="header" style={[common.sectionTitle, styles.center]}>
        {title}
      </Text>
      <Text accessibilityRole={error ? 'alert' : 'text'} style={[common.subtitle, styles.center]}>
        {message}
      </Text>
      {onAction && (
        <Button label={action ?? 'Tentar novamente'} onPress={onAction} variant="secondary" />
      )}
    </View>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.error}>
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.errorText}>
        {message}
      </Text>
      {onRetry && <Button label="Tentar novamente" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  state: { padding: 28, gap: 16, alignItems: 'center', justifyContent: 'center', minHeight: 220 },
  center: { textAlign: 'center', maxWidth: 450 },
  icon: { padding: 20, backgroundColor: colors.sand, borderRadius: 50 },
  error: {
    padding: 16,
    backgroundColor: colors.blush,
    borderRadius: 12,
    gap: 12,
    marginVertical: 8,
  },
  errorText: { color: colors.error, fontSize: 15, lineHeight: 23 },
});
