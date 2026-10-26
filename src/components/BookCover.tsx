import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { coverUrl } from '../services/openLibrary';
import { colors, serif } from '../theme';

export function BookCover({
  coverId,
  title,
  large = false,
}: {
  coverId: number | null;
  title: string;
  large?: boolean;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const uri = coverId ? coverUrl(coverId, large ? 'L' : 'M') : null;
  if (!uri || failedUri === uri)
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Capa indisponível: ${title}`}
        style={styles.placeholder}
      >
        <Ionicons name="book-outline" size={38} color={colors.wine} accessible={false} />
        <Text style={styles.placeholderText}>Uma história{`\n`}para descobrir</Text>
        <Text style={styles.caption}>CAPA INDISPONÍVEL</Text>
      </View>
    );
  return (
    <Image
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Capa do livro ${title}`}
      source={{ uri }}
      resizeMode="contain"
      style={styles.image}
      onError={() => setFailedUri(uri)}
    />
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 0.68 },
  placeholder: {
    width: '100%',
    minHeight: 230,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.sand,
    borderRadius: 6,
  },
  placeholderText: { fontFamily: serif, fontSize: 19, textAlign: 'center', color: colors.wine },
  caption: { fontSize: 10, letterSpacing: 1, textAlign: 'center', color: colors.muted },
});
