import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Typography';
import { Ionicons } from './Icon';
import type { Book } from '../types';
import { BookCover } from './BookCover';
import { colors, serif } from '../theme';
import {
  decorativeAccessibility,
  favoriteControlLabel,
  cardAccessibilityLabel,
  loadingAccessibilityState,
  selectionAccessibilityState,
} from '../utils/accessibility';

interface Props {
  book: Book;
  favorite: boolean;
  read: boolean;
  rating: number | null;
  saving: boolean;
  onOpen: () => void;
  onFavorite: () => void;
}

export function BookCard({ book, favorite, read, rating, saving, onOpen, onFavorite }: Props) {
  return (
    <View style={styles.card}>
      <Pressable
        accessible
        accessibilityLanguage="pt-BR"
        accessibilityRole="button"
        role="button"
        accessibilityLabel={cardAccessibilityLabel(book, { favorite, read, rating })}
        onPress={onOpen}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.75 : 1 }]}
      >
        <View
          style={styles.cover}
          accessible={false}
          collapsable={false}
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <BookCover coverId={book.coverId} title={book.title} decorative />
        </View>
        <View
          style={styles.text}
          accessible={false}
          collapsable={false}
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text {...decorativeAccessibility} style={styles.title}>
            {book.title}
          </Text>
          <Text {...decorativeAccessibility} style={styles.author}>
            {book.authors.join(', ') || 'Autoria não informada'}
          </Text>
          {book.firstPublishYear !== null && (
            <Text {...decorativeAccessibility} style={styles.year}>
              {book.firstPublishYear}
            </Text>
          )}
        </View>
      </Pressable>
      <View style={styles.bottom}>
        <View style={styles.read} {...decorativeAccessibility} collapsable={false}>
          {read ? (
            <Text
              style={styles.readText}
              accessibilityLabel={
                rating ? `Lido. Sua nota: ${rating} de 5 estrelas` : 'Lido, ainda sem nota'
              }
            >
              {rating ? `★ ${rating} / 5 · Lido` : '✓ Lido'}
            </Text>
          ) : (
            <Text style={styles.year}>Para descobrir</Text>
          )}
        </View>
        <Pressable
          accessible
          accessibilityLanguage="pt-BR"
          accessibilityRole="button"
          role="button"
          accessibilityLabel={
            saving
              ? `Salvando favoritos de ${book.title}`
              : favoriteControlLabel(book.title, favorite)
          }
          accessibilityState={{
            ...selectionAccessibilityState(favorite),
            ...loadingAccessibilityState(saving),
          }}
          {...(Platform.OS === 'web' ? { 'aria-pressed': favorite, 'aria-busy': saving } : {})}
          onPress={() => {
            if (!saving) onFavorite();
          }}
          hitSlop={4}
          style={({ pressed }) => [
            styles.heart,
            { backgroundColor: pressed || favorite ? colors.blush : colors.paper },
          ]}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={23}
            color={colors.wine}
            accessible={false}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.sand,
    overflow: 'hidden',
  },
  main: { flex: 1 },
  cover: { paddingHorizontal: 26, paddingVertical: 20, backgroundColor: '#EFE7DA' },
  text: { padding: 16, gap: 8 },
  title: { fontFamily: serif, fontSize: 19, color: colors.wineDark },
  author: { fontSize: 14, color: colors.muted, lineHeight: 21 },
  year: { fontSize: 12, color: colors.muted },
  bottom: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heart: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  read: { flex: 1 },
  readText: { fontSize: 12, color: colors.green, fontWeight: '700' },
});
