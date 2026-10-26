import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useBookDetails } from '../hooks/useBookDetails';
import { useLibrary } from '../contexts/LibraryContext';
import { BookCover } from '../components/BookCover';
import { Button } from '../components/Button';
import { Rating } from '../components/Rating';
import { EmptyState, Loading } from '../components/Feedback';
import { colors, common } from '../theme';

export function DetailsScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Details'>) {
  const { data: book, loading, error, retry } = useBookDetails(route.params.id);
  const library = useLibrary();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (book) navigation.setOptions({ title: book.title });
  }, [book, navigation]);
  if (loading)
    return (
      <View style={common.screen}>
        <Loading label="Abrindo este livro…" />
      </View>
    );
  if (error || !book)
    return (
      <View style={common.screen}>
        <EmptyState
          error
          title="Não foi possível abrir o livro"
          message={error ?? 'Tente novamente em instantes.'}
          onAction={retry}
        />
      </View>
    );
  const entry = library.entries[book.id];
  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={[common.content, { paddingBottom: insets.bottom + 32 }]}
    >
      <View style={[styles.overview, width >= 700 && fontScale < 1.4 && styles.wide]}>
        <View style={styles.cover}>
          <BookCover coverId={book.coverId} title={book.title} large />
        </View>
        <View style={styles.info}>
          <Text style={common.eyebrow}>UM LIVRO, MUITAS POSSIBILIDADES</Text>
          <Text accessibilityRole="header" style={common.title}>
            {book.title}
          </Text>
          <Text style={common.subtitle}>
            {book.authors.join(', ') || 'Autoria não informada pela Open Library'}
          </Text>
          <View style={styles.metadata}>
            <View style={styles.attribute}>
              <Text style={styles.label}>PRIMEIRA PUBLICAÇÃO</Text>
              <Text style={common.body}>
                {book.firstPublishDate ?? book.firstPublishYear ?? 'Não informada'}
              </Text>
            </View>
            <View style={styles.attribute}>
              <Text style={styles.label}>EDIÇÕES NO CATÁLOGO</Text>
              <Text style={common.body}>{book.editionCount ?? 'Não informado'}</Text>
            </View>
          </View>
          <View style={common.panel}>
            <Text accessibilityRole="header" style={common.sectionTitle}>
              Na sua estante
            </Text>
            <Button
              label={entry?.favorite ? 'Salvo nos favoritos' : 'Adicionar aos favoritos'}
              icon={entry?.favorite ? 'heart' : 'heart-outline'}
              selected={entry?.favorite ?? false}
              disabled={library.saving}
              variant={entry?.favorite ? 'primary' : 'secondary'}
              onPress={() => {
                void library.toggleFavorite(book);
              }}
            />
            <Button
              label={entry?.read ? 'Lido · marcar como não lido' : 'Marcar como lido'}
              icon={entry?.read ? 'checkmark-circle' : 'checkmark-circle-outline'}
              selected={entry?.read ?? false}
              disabled={library.saving}
              variant="secondary"
              onPress={() => {
                void library.toggleRead(book);
              }}
            />
            {entry?.read && (
              <Rating
                value={entry.rating}
                disabled={library.saving}
                onChange={(rating) => {
                  void library.rateBook(book, rating);
                }}
              />
            )}
            {library.saving && (
              <Text accessibilityLiveRegion="polite" style={styles.label}>
                Salvando sua estante…
              </Text>
            )}
          </View>
        </View>
      </View>
      <View style={common.panel}>
        <Text accessibilityRole="header" style={common.sectionTitle}>
          Sobre esta história
        </Text>
        <Text selectable style={common.body}>
          {book.description}
        </Text>
        <Text style={styles.note}>
          Sinopses e títulos são exibidos no idioma disponibilizado pela Open Library.
        </Text>
      </View>
      <View style={common.panel}>
        <Text accessibilityRole="header" style={common.sectionTitle}>
          Entre temas e gêneros
        </Text>
        <View style={common.row}>
          {book.subjects.length ? (
            book.subjects.map((subject, index) => (
              <View key={`${subject}-${index}`} style={styles.subject}>
                <Text style={styles.subjectText}>{subject}</Text>
              </View>
            ))
          ) : (
            <Text style={common.subtitle}>A API ainda não informou os temas deste livro.</Text>
          )}
        </View>
      </View>
      <Text style={styles.note}>Fonte: Open Library · {book.id}</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  overview: { gap: 28 },
  wide: { flexDirection: 'row', alignItems: 'flex-start' },
  cover: {
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
    backgroundColor: colors.sand,
    padding: 22,
    borderRadius: 16,
  },
  info: { flex: 1, gap: 18 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  attribute: { gap: 8 },
  label: { fontSize: 11, letterSpacing: 1, color: colors.muted },
  note: { fontSize: 13, lineHeight: 21, color: colors.muted },
  subject: { backgroundColor: colors.cream, padding: 12, borderRadius: 10, maxWidth: '100%' },
  subjectText: { fontSize: 14, color: colors.wine },
});
