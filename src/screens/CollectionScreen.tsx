import { StyleSheet, View } from 'react-native';
import { Text } from '../components/Typography';
import { LibraryStatus } from '../components/LibraryStatus';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useLibrary } from '../contexts/LibraryContext';
import { BookGrid } from '../components/BookGrid';
import { Button } from '../components/Button';
import { EmptyState } from '../components/Feedback';
import { common } from '../theme';

export function CollectionScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'Favorites' | 'ReadBooks'>) {
  const library = useLibrary();
  const favorites = route.name === 'Favorites';
  const entries = favorites ? library.favorites : library.readBooks;
  const rated = library.readBooks.filter((entry) => entry.rating !== null);
  const average = rated.length
    ? (rated.reduce((total, entry) => total + entry.rating!, 0) / rated.length)
        .toFixed(1)
        .replace('.', ',')
    : null;
  const header = (
    <View style={styles.header}>
      <LibraryStatus />
      <Text style={common.eyebrow}>SUA ESTANTE PESSOAL</Text>
      <Text accessibilityRole="header" style={common.title}>
        {favorites ? 'Histórias que ficam.' : 'Páginas já vividas.'}
      </Text>
      <Text style={common.subtitle}>
        {favorites
          ? 'Os livros que você quer ter sempre por perto.'
          : 'Suas leituras e as impressões que elas deixaram.'}
      </Text>
      <Text style={common.body}>
        {entries.length} {entries.length === 1 ? 'livro' : 'livros'}
        {!favorites && average ? ` · Sua média: ${average} / 5` : ''}
      </Text>
      <Button
        label="Explorar catálogo"
        icon="compass-outline"
        variant="secondary"
        onPress={() => navigation.popToTop()}
      />
    </View>
  );
  return (
    <View style={common.screen}>
      <BookGrid
        books={entries.map((entry) => entry.book)}
        header={header}
        onOpen={(id) => navigation.navigate('Details', { id })}
        empty={
          <EmptyState
            title={favorites ? 'Sua estante está esperando' : 'Qual foi sua última leitura?'}
            message={
              favorites
                ? 'Toque no coração de um livro para guardar seu próximo encontro com uma boa história.'
                : 'Abra um livro, marque como lido e dê sua nota de 1 a 5 estrelas.'
            }
            action="Descobrir livros"
            onAction={() => navigation.popToTop()}
          />
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  header: { padding: 8, paddingTop: 24, paddingBottom: 24, gap: 14 },
});
