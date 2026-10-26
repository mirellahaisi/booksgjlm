import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Book, SessionUser } from '../src/types';
import {
  emptyLibrary,
  libraryKey,
  mergeEntries,
  readLibrary,
  updateEntry,
  writeLibrary,
} from '../src/services/libraryStorage';
import { reconcileSync } from '../src/services/cloudLibrary';
import { LibraryProvider, useLibrary } from '../src/contexts/LibraryContext';

const book: Book = {
  id: 'OL1W',
  title: 'Livro',
  authors: ['Autor'],
  coverId: null,
  firstPublishYear: 1900,
  editionCount: 2,
};
const user: SessionUser = { id: 'a', name: 'Ana', email: 'a@example.com', provider: 'local' };
const wrapper = ({ children }: PropsWithChildren) => (
  <LibraryProvider user={user}>{children}</LibraryProvider>
);

describe('biblioteca persistente', () => {
  it('recupera favoritos, lidos e notas sem misturar contas', async () => {
    const saved = updateEntry(
      emptyLibrary(),
      book,
      { favorite: true, read: true, rating: 4 },
      false,
    );
    await writeLibrary(user, saved);
    expect(await readLibrary(user)).toEqual(saved);
    expect(await readLibrary({ ...user, id: 'b' })).toEqual(emptyLibrary());
    expect(await readLibrary({ ...user, provider: 'firebase' })).toEqual(emptyLibrary());
  });
  it('remove a nota ao desmarcar lido e preserva favoritos', () => {
    const saved = updateEntry(
      emptyLibrary(),
      book,
      { favorite: true, read: true, rating: 5 },
      false,
    );
    expect(updateEntry(saved, book, { read: false }, false).entries.OL1W).toMatchObject({
      favorite: true,
      read: false,
      rating: null,
    });
    expect(() => updateEntry(saved, book, { rating: 6 }, false)).toThrow('1 a 5');
  });
  it('preserva dados corrompidos para não substituir a coleção por vazia', async () => {
    await AsyncStorage.setItem(libraryKey(user), '{broken');
    await expect(readLibrary(user)).rejects.toThrow();
    expect(await AsyncStorage.getItem(libraryKey(user))).toBe('{broken');
  });
  it('mantém remoções mais recentes na mesclagem da nuvem', () => {
    const old = updateEntry(emptyLibrary(), book, { favorite: true }, true);
    const removed = updateEntry(old, book, { favorite: false }, true);
    expect(mergeEntries(old.entries, removed.entries).OL1W.favorite).toBe(false);
    expect(mergeEntries(removed.entries, old.entries).OL1W.favorite).toBe(false);
  });
  it('não apaga uma alteração feita enquanto a nuvem estava sincronizando', () => {
    const sent = updateEntry(emptyLibrary(), book, { favorite: true }, true);
    const newer = updateEntry(sent, book, { favorite: false }, true);
    const reconciled = reconcileSync(newer, { entries: sent.entries, acknowledged: sent.pending });
    expect(reconciled.entries.OL1W.favorite).toBe(false);
    expect(reconciled.pending.OL1W).toBe(newer.pending.OL1W);
    expect(
      reconcileSync(newer, { entries: newer.entries, acknowledged: newer.pending }).pending,
    ).toEqual({});
  });
  it('Context aguarda hidratação e atualiza coleções depois da gravação', async () => {
    await writeLibrary(user, updateEntry(emptyLibrary(), book, { favorite: true }, false));
    const { result } = renderHook(useLibrary, { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.favorites).toHaveLength(1);
    await act(() => result.current.toggleFavorite(book));
    expect(result.current.favorites).toHaveLength(0);
    await act(() => result.current.rateBook(book, 5));
    expect(result.current.readBooks[0].rating).toBe(5);
    expect((await readLibrary(user)).entries.OL1W.rating).toBe(5);
  });
  it('falha de gravação mantém a coleção anterior e permite tentar novamente', async () => {
    const { result } = renderHook(useLibrary, { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disco cheio'));
    await act(() => result.current.toggleFavorite(book));
    expect(result.current.favorites).toHaveLength(0);
    expect(result.current.saveError).toBeTruthy();
    act(() => result.current.retrySave());
    await waitFor(() => expect(result.current.favorites).toHaveLength(1));
    expect(result.current.saveError).toBeNull();
  });
});
