import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Book } from '../types';
import { BookCover } from './BookCover';
import { colors, serif } from '../theme';

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
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes de ${book.title}, ${book.authors.join(', ') || 'autoria não informada'}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.75 : 1 }]}
      >
        <View style={styles.cover}>
          <BookCover coverId={book.coverId} title={book.title} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{book.authors.join(', ') || 'Autoria não informada'}</Text>
          {book.firstPublishYear !== null && (
            <Text style={styles.year}>{book.firstPublishYear}</Text>
          )}
        </View>
      </Pressable>
      <View style={styles.bottom}>
        <View style={styles.read}>
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
          accessibilityRole="button"
          accessibilityLabel={`${favorite ? 'Remover dos' : 'Adicionar aos'} favoritos: ${book.title}`}
          accessibilityState={{ selected: favorite, disabled: saving }}
          disabled={saving}
          onPress={onFavorite}
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
