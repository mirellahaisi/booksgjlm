import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export function Rating({
  value,
  disabled,
  onChange,
}: {
  value: number | null;
  disabled: boolean;
  onChange: (rating: number) => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {value ? `Sua nota: ${value} de 5` : 'Como foi essa leitura?'}
      </Text>
      <View
        style={styles.stars}
        accessibilityRole="radiogroup"
        accessibilityLabel="Avaliar livro de 1 a 5 estrelas"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            accessible
            accessibilityRole="radio"
            accessibilityLabel={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
            accessibilityState={{ checked: value === star, disabled }}
            disabled={disabled}
            onPress={() => onChange(star)}
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
