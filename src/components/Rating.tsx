import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Typography';
import { Ionicons } from './Icon';
import { colors } from '../theme';
import { loadingAccessibilityState, selectionAccessibilityState } from '../utils/accessibility';
import { announce } from '../utils/announce';

export function Rating({
  value,
  disabled = false,
  busy = false,
  onChange,
}: {
  value: number | null;
  disabled?: boolean;
  busy?: boolean;
  onChange: (rating: number) => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {value ? `Sua nota: ${value} de 5` : 'Como foi essa leitura?'}
      </Text>
      <View accessible={false} style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            accessible
            accessibilityLanguage="pt-BR"
            accessibilityRole="button"
            role="button"
            accessibilityLabel={`${
              value === star
                ? `Sua nota atual: ${star} de 5 estrelas`
                : `${value == null ? 'Dar' : 'Mudar para'} nota ${star} de 5 estrelas`
            }${busy ? '. Salvando avaliação, aguarde' : ''}`}
            accessibilityState={{
              ...selectionAccessibilityState(value === star),
              disabled,
              ...loadingAccessibilityState(busy),
            }}
            {...(Platform.OS === 'web'
              ? { 'aria-pressed': value === star, 'aria-busy': busy }
              : {})}
            aria-disabled={disabled}
            disabled={disabled}
            onPress={() => {
              if (busy || disabled) return;
              if (value === star) {
                announce(`Sua nota já é ${star} de 5 estrelas. Nenhuma alteração feita.`);
              } else {
                onChange(star);
              }
            }}
            style={({ pressed }) => [styles.star, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons
              name={value && star <= value ? 'star' : 'star-outline'}
              size={29}
              color={colors.gold}
              accessible={false}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { color: colors.ink, fontSize: 16 },
  stars: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  star: {
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.cream,
  },
});
