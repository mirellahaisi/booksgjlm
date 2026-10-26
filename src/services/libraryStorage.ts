import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Book, LibraryData, LibraryEntry, SessionUser } from '../types';

export const emptyLibrary = (): LibraryData => ({ version: 1, entries: {}, pending: {} });

export function isLibraryEntry(value: unknown): value is LibraryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as LibraryEntry;
  return Boolean(
    entry.book &&
    /^OL\d+W$/.test(entry.book.id) &&
    typeof entry.book.title === 'string' &&
    Array.isArray(entry.book.authors) &&
    entry.book.authors.every((author) => typeof author === 'string') &&
    typeof entry.favorite === 'boolean' &&
    typeof entry.read === 'boolean' &&
    Number.isFinite(entry.updatedAt) &&
    (entry.rating === null ||
      (Number.isInteger(entry.rating) && entry.rating >= 1 && entry.rating <= 5)) &&
    (entry.read || entry.rating === null),
  );
}

export function libraryKey(user: SessionUser): string {
  return `gjlm-books.library.v1.${user.provider}.${user.id}`;
}

export async function readLibrary(user: SessionUser): Promise<LibraryData> {
  const raw = await AsyncStorage.getItem(libraryKey(user));
  if (!raw) return emptyLibrary();
  const data = JSON.parse(raw) as LibraryData;
  if (
    data.version !== 1 ||
    !data.entries ||
    !data.pending ||
    Object.entries(data.entries).some(
      ([id, entry]) => !isLibraryEntry(entry) || entry.book.id !== id,
    ) ||
    Object.entries(data.pending).some(
      ([id, version]) => !data.entries[id] || !Number.isFinite(version),
    )
  ) {
    throw new Error('Não foi possível ler a coleção salva.');
  }
  return data;
}

export async function writeLibrary(user: SessionUser, data: LibraryData): Promise<void> {
  await AsyncStorage.setItem(libraryKey(user), JSON.stringify(data));
}

export function updateEntry(
  data: LibraryData,
  book: Book,
  patch: Partial<Pick<LibraryEntry, 'favorite' | 'read' | 'rating'>>,
  cloud: boolean,
): LibraryData {
  const previous = data.entries[book.id];
  const updatedAt = Math.max(Date.now(), (previous?.updatedAt ?? 0) + 1);
  const { id, title, authors, coverId, firstPublishYear, editionCount } = book;
  const entry: LibraryEntry = {
    book: { id, title, authors, coverId, firstPublishYear, editionCount },
    favorite: previous?.favorite ?? false,
    read: previous?.read ?? false,
    rating: previous?.rating ?? null,
    ...patch,
    updatedAt,
  };
  if (!entry.read) entry.rating = null;
  if (!isLibraryEntry(entry)) throw new Error('A nota deve ser um número de 1 a 5.');
  return {
    version: 1,
    entries: { ...data.entries, [id]: entry },
    pending: cloud ? { ...data.pending, [id]: updatedAt } : data.pending,
  };
}

// Mantém tombstones (favorite/read false) para que remoções também sincronizem.
export function mergeEntries(a: Record<string, LibraryEntry>, b: Record<string, LibraryEntry>) {
  const merged = { ...a };
  for (const [id, entry] of Object.entries(b)) {
    if (!merged[id] || entry.updatedAt > merged[id].updatedAt) merged[id] = entry;
  }
  return merged;
}
