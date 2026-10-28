import { useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '../components/Icon';
import type { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLibrary } from '../contexts/LibraryContext';
import { useCatalog, initialQuery } from '../hooks/useCatalog';
import { categories } from '../services/openLibrary';
import { BookGrid } from '../components/BookGrid';
import { Button } from '../components/Button';
import { EmptyState, ErrorBanner, Loading } from '../components/Feedback';
import { colors, common, serif } from '../theme';
import { Text, TextInput } from '../components/Typography';
import { Checkbox } from '../components/Checkbox';
import { LibraryStatus } from '../components/LibraryStatus';
import { selectionAccessibilityState } from '../utils/accessibility';
import { announce } from '../utils/announce';

export function CatalogScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Catalog'>) {
  const auth = useAuth();
  const library = useLibrary();
  const catalog = useCatalog();
  const [term, setTerm] = useState('');
  const { width, fontScale } = useWindowDimensions();
  const small = width < 500 || fontScale > 1.3;
  const submit = () => {
    Keyboard.dismiss();
    catalog.search({ ...catalog.query, term: term.trim() });
  };
  const filtered = Boolean(
    catalog.query.term || catalog.query.category || catalog.query.language !== 'all',
  );
  const header = (
    <View style={styles.header}>
      <LibraryStatus />
      <View style={styles.welcome}>
        <View style={styles.greeting}>
          <Text style={common.eyebrow}>SUA BIBLIOTECA, DO SEU JEITO</Text>
          <Text style={common.subtitle}>Olá, {auth.user?.name.split(' ')[0]}.</Text>
        </View>
        <Button
          label="Sair"
          icon="log-out-outline"
          variant="quiet"
          loading={auth.busy}
          disabled={library.saving}
          onPress={() => {
            void auth.logout();
          }}
        />
      </View>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>ENTRE PÁGINAS E POSSIBILIDADES</Text>
        <Text accessibilityRole="header" style={styles.heroTitle}>
          Toda grande história{`\n`}começa com uma descoberta.
        </Text>
        <Text style={styles.heroText}>
          Explore o catálogo. Encontre seu próximo livro. Guarde o que toca você.
        </Text>
        <View style={styles.heroFooter}>
          <Ionicons name="library-outline" size={20} color={colors.sand} accessible={false} />
          <Text style={styles.heroCaption}>Milhões de histórias na Open Library</Text>
        </View>
      </View>
      <View style={[styles.collections, small && styles.stacked]}>
        <Button
          label={`Favoritos · ${library.favorites.length}`}
          icon="heart-outline"
          variant="secondary"
          onPress={() => navigation.navigate('Favorites')}
          style={small ? styles.stackedControl : styles.collectionButton}
        />
        <Button
          label={`Lidos · ${library.readBooks.length}`}
          icon="checkmark-done-outline"
          variant="secondary"
          onPress={() => navigation.navigate('ReadBooks')}
          style={small ? styles.stackedControl : styles.collectionButton}
        />
      </View>
      <View accessible={false} style={[styles.search, small && styles.stacked]}>
        <View
          accessible={false}
          style={[styles.searchField, small ? styles.stackedControl : styles.searchFieldInline]}
        >
          <Ionicons name="search-outline" size={21} color={colors.muted} accessible={false} />
          <TextInput
            accessible
            accessibilityLabel="Buscar livros"
            accessibilityRole="search"
            {...(Platform.OS === 'web' ? { role: 'searchbox' as const } : {})}
            value={term}
            onChangeText={setTerm}
            onSubmitEditing={submit}
            returnKeyType="search"
            placeholder="Busque por título ou autor"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCorrect={false}
            maxLength={200}
          />
        </View>
        <Button
          label="Buscar"
          loading={catalog.loading}
          loadingLabel="Buscando livros"
          onPress={submit}
          icon="search-outline"
          style={small ? styles.stackedControl : undefined}
        />
      </View>
      <View style={styles.filters}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            accessible
            accessibilityLanguage="pt-BR"
            accessibilityRole="button"
            role="button"
            accessibilityLabel={`${category.label}${catalog.query.category === category.id ? '. Categoria atual' : ''}`}
            accessibilityState={selectionAccessibilityState(catalog.query.category === category.id)}
            {...(Platform.OS === 'web'
              ? { 'aria-pressed': catalog.query.category === category.id }
              : {})}
            onPress={() => {
              if (catalog.query.category === category.id) {
                announce(`${category.label} já é a categoria atual.`);
                return;
              }
              catalog.search({ ...catalog.query, category: category.id });
              announce(`Categoria alterada para ${category.label}.`);
            }}
            style={[styles.chip, catalog.query.category === category.id && styles.selectedChip]}
          >
            <Text
              accessible={false}
              aria-hidden
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.chipText,
                catalog.query.category === category.id && { color: colors.paper },
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Checkbox
        label="Com edição em português"
        checked={catalog.query.language === 'por'}
        onChange={(checked) =>
          catalog.search({
            ...catalog.query,
            language: checked ? 'por' : 'all',
          })
        }
      />
      <View style={[styles.results, small && styles.stacked]}>
        <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 6 }}>
          <Text accessibilityRole="header" style={common.sectionTitle}>
            {catalog.query.term ? `Resultados para “${catalog.query.term}”` : 'Explore a estante'}
          </Text>
          {!catalog.loading && !catalog.error && (
            <Text accessibilityLiveRegion="polite" style={styles.count}>
              {catalog.total.toLocaleString('pt-BR')} livros encontrados
            </Text>
          )}
        </View>
        {filtered && (
          <Button
            label="Limpar filtros"
            variant="quiet"
            onPress={() => {
              setTerm('');
              catalog.search(initialQuery);
            }}
          />
        )}
        <Button
          label="Atualizar"
          accessibilityLabel="Atualizar catálogo"
          icon="refresh-outline"
          variant="quiet"
          loading={catalog.refreshing}
          loadingLabel="Atualizando catálogo"
          disabled={catalog.loading}
          onPress={() => {
            catalog.refresh();
            void library.sync();
          }}
        />
      </View>
      {catalog.error && catalog.books.length > 0 && (
        <ErrorBanner message={catalog.error} onRetry={catalog.retry} />
      )}
    </View>
  );
  const footer = (
    <View style={styles.footer}>
      {catalog.loadingMore ? (
        <Loading label="Buscando mais histórias…" />
      ) : catalog.moreError ? (
        <ErrorBanner message={catalog.moreError} onRetry={catalog.retryMore} />
      ) : catalog.hasMore && !catalog.loading && !catalog.error ? (
        <Button label="Carregar mais livros" variant="secondary" onPress={catalog.loadMore} />
      ) : null}
      {library.syncStatus !== 'local' && (
        <Button
          label={
            library.syncStatus === 'synced'
              ? 'Estante sincronizada · atualizar'
              : 'Sincronizar estante'
          }
          variant="quiet"
          icon="cloud-outline"
          loading={library.syncStatus === 'syncing'}
          loadingLabel="Sincronizando estante"
          onPress={() => {
            void library.sync();
          }}
        />
      )}
      <Text style={styles.credit}>GJLM Books · Dados e capas da Open Library</Text>
    </View>
  );
  return (
    <View style={common.screen}>
      <BookGrid
        books={catalog.books}
        header={header}
        footer={footer}
        onOpen={(id) => navigation.navigate('Details', { id })}
        onEndReached={catalog.loadMore}
        refreshing={catalog.refreshing}
        onRefresh={() => {
          catalog.refresh();
          void library.sync();
        }}
        empty={
          catalog.loading ? (
            <Loading label="Abrindo a estante…" />
          ) : catalog.error ? (
            <EmptyState
              error
              title="A estante está indisponível"
              message={catalog.error}
              onAction={catalog.retry}
            />
          ) : (
            <EmptyState
              title="Nenhum livro por aqui"
              message="Tente outro título ou autor, ou remova os filtros para ampliar sua busca."
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 8, gap: 18 },
  welcome: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  greeting: { flex: 1, minWidth: 180, gap: 6 },
  hero: { backgroundColor: colors.wineDark, borderRadius: 20, padding: 26, gap: 16 },
  heroLabel: { color: '#E9DDCB', fontSize: 10, letterSpacing: 2 },
  heroTitle: { color: colors.cream, fontFamily: serif, fontSize: 34 },
  heroText: { color: '#E9DDCB', fontSize: 15, lineHeight: 24, maxWidth: 500 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  heroCaption: { fontSize: 12, color: colors.sand, flexShrink: 1 },
  collections: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stacked: { flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch' },
  stackedControl: {
    width: '100%',
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  collectionButton: { flexGrow: 1 },
  search: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchField: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    backgroundColor: colors.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  searchFieldInline: { flex: 1 },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 16,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    minWidth: 44,
    maxWidth: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: 24,
    justifyContent: 'center',
  },
  selectedChip: { backgroundColor: colors.wine, borderColor: colors.wine },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  results: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  count: { color: colors.muted, fontSize: 13 },
  footer: { padding: 20, gap: 18, alignItems: 'center' },
  credit: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
