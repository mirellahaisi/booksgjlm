import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';
import type { Book } from '../types';
import { BookCard } from './BookCard';
import { useLibrary } from '../contexts/LibraryContext';

interface Props {
  books: Book[];
  onOpen: (id: string) => void;
  header?: ReactElement;
  empty?: ReactElement;
  footer?: ReactElement;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
}

export function BookGrid({
  books,
  onOpen,
  header,
  empty,
  footer,
  refreshing = false,
  onRefresh,
  onEndReached,
}: Props) {
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const columns = fontScale > 1.35 || width < 360 ? 1 : width >= 1000 ? 4 : width >= 700 ? 3 : 2;
  const library = useLibrary();
  return (
    <FlatList
      key={columns}
      data={books}
      numColumns={columns}
      keyExtractor={(book) => book.id}
      extraData={library.entries}
      style={styles.list}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={footer}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      renderItem={({ item }) => {
        const entry = library.entries[item.id];
        return (
          <View style={[styles.cell, { width: `${100 / columns}%` }]}>
            <BookCard
              book={item}
              favorite={entry?.favorite ?? false}
              read={entry?.read ?? false}
              rating={entry?.rating ?? null}
              saving={library.saving}
              onOpen={() => onOpen(item.id)}
              onFavorite={() => {
                void library.toggleFavorite(item);
              }}
            />
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { width: '100%', maxWidth: 1144, alignSelf: 'center', paddingHorizontal: 12 },
  cell: { padding: 8 },
});
