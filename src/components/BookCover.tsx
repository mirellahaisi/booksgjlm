import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from './Typography';
import { Ionicons } from './Icon';
import { coverUrl } from '../services/openLibrary';
import { colors, serif } from '../theme';
import { decorativeAccessibility } from '../utils/accessibility';

export function BookCover({
  coverId,
  title,
  large = false,
  decorative = false,
}: {
  coverId: number | null;
  title: string;
  large?: boolean;
  decorative?: boolean;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const uri = coverId ? coverUrl(coverId, large ? 'L' : 'M') : null;
  const missing = !uri || failedUri === uri;
  return (
    <View
      accessible={!decorative}
      aria-hidden={decorative}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      accessibilityLanguage="pt-BR"
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={
        decorative ? undefined : missing ? `Capa indisponível: ${title}` : `Capa do livro ${title}`
      }
      style={missing ? [styles.placeholder, large && styles.largePlaceholder] : styles.image}
    >
      {/* Um único rótulo na árvore acessível. O OCR opcional do iOS pode ler os pixels. */}
      <View
        {...decorativeAccessibility}
        collapsable={false}
        style={missing ? styles.placeholderContent : StyleSheet.absoluteFill}
      >
        {missing ? (
          <>
            <Ionicons name="book-outline" size={38} color={colors.wine} accessible={false} />
            <Text {...decorativeAccessibility} style={styles.placeholderText}>
              Uma história{`\n`}para descobrir
            </Text>
            <Text {...decorativeAccessibility} style={styles.caption}>
              CAPA INDISPONÍVEL
            </Text>
          </>
        ) : (
          <Image
            {...decorativeAccessibility}
            source={{ uri }}
            resizeMode="contain"
            style={StyleSheet.absoluteFill}
            onError={() => setFailedUri(uri)}
          />
        )}
      </View>
    </View>
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
    backgroundColor: colors.sand,
    borderRadius: 6,
  },
  largePlaceholder: { minHeight: 360 },
  placeholderContent: { alignItems: 'center', gap: 14, width: '100%' },
  placeholderText: { fontFamily: serif, fontSize: 19, textAlign: 'center', color: colors.wine },
  caption: { fontSize: 10, letterSpacing: 1, textAlign: 'center', color: colors.muted },
});
