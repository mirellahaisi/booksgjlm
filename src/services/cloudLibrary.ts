import { collection, doc, getDocsFromServer, runTransaction } from 'firebase/firestore';
import type { LibraryData, LibraryEntry } from '../types';
import { getFirebase } from './firebase';
import { isLibraryEntry, mergeEntries } from './libraryStorage';

export async function withTimeout<T>(promise: Promise<T>, milliseconds = 12000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Tempo de sincronização esgotado.')),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function synchronizeLibrary(uid: string, local: LibraryData) {
  const { db } = getFirebase();
  const path = collection(db, 'users', uid, 'books');
  const snapshot = await withTimeout(getDocsFromServer(path));
  const remote: Record<string, LibraryEntry> = {};
  snapshot.forEach((item) => {
    const entry = item.data();
    if (!isLibraryEntry(entry) || entry.book.id !== item.id)
      throw new Error('Coleção da nuvem inválida.');
    remote[item.id] = entry;
  });
  const merged = mergeEntries(local.entries, remote);
  // Transações impedem que um dispositivo atrasado sobrescreva uma versão nova.
  for (const id of Object.keys(local.pending)) {
    merged[id] = await withTimeout(
      runTransaction(db, async (transaction) => {
        const ref = doc(path, id);
        const existing = await transaction.get(ref);
        const saved = existing.data();
        const candidate = merged[id];
        if (saved && !isLibraryEntry(saved)) throw new Error('Registro da nuvem inválido.');
        if (saved && (saved as LibraryEntry).updatedAt >= candidate.updatedAt)
          return saved as LibraryEntry;
        transaction.set(ref, candidate);
        return candidate;
      }),
    );
  }
  return { entries: merged, acknowledged: local.pending };
}

export function reconcileSync(
  current: LibraryData,
  result: Awaited<ReturnType<typeof synchronizeLibrary>>,
): LibraryData {
  const pending = { ...current.pending };
  for (const [id, revision] of Object.entries(result.acknowledged)) {
    if (pending[id] === revision) delete pending[id];
  }
  return { version: 1, entries: mergeEntries(current.entries, result.entries), pending };
}
