import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState } from 'react-native';
import type { Book, LibraryData, LibraryEntry, SessionUser } from '../types';
import { emptyLibrary, readLibrary, updateEntry, writeLibrary } from '../services/libraryStorage';
import { reconcileSync, synchronizeLibrary } from '../services/cloudLibrary';
import { announce } from '../utils/announce';

interface LibraryState {
  entries: Record<string, LibraryEntry>;
  favorites: LibraryEntry[];
  readBooks: LibraryEntry[];
  loading: boolean;
  loadError: string | null;
  saveError: string | null;
  saving: boolean;
  syncStatus: 'local' | 'syncing' | 'synced' | 'offline';
  pendingCount: number;
  toggleFavorite: (book: Book) => Promise<void>;
  toggleRead: (book: Book) => Promise<void>;
  rateBook: (book: Book, rating: number) => Promise<void>;
  retryLoad: () => void;
  retrySave: () => void;
  sync: () => Promise<void>;
}
const LibraryContext = createContext<LibraryState | undefined>(undefined);

export function LibraryProvider({ user, children }: PropsWithChildren<{ user: SessionUser }>) {
  const cloud = user.provider === 'firebase';
  const [data, setData] = useState<LibraryData>(emptyLibrary);
  const current = useRef(data);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(true);
  const savingRef = useRef(false);
  const syncingRef = useRef(false);
  const resync = useRef(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<{ message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [syncStatus, setSyncStatus] = useState<LibraryState['syncStatus']>(
    cloud ? 'syncing' : 'local',
  );
  const lastAction = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    // Espera a renderização dos rótulos novos e substitui a fala da ação antiga.
    if (confirmation && !saving) announce(confirmation.message, { interrupt: true });
  }, [confirmation, saving]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const commit = useCallback(
    (transform: (previous: LibraryData) => LibraryData) => {
      const operation = queue.current.then(async () => {
        const next = transform(current.current);
        // Confirma a escrita antes de atualizar a UI. Uma falha não perde a versão anterior.
        await writeLibrary(user, next);
        current.current = next;
        if (mounted.current) setData(next);
      });
      queue.current = operation.catch(() => {});
      return operation;
    },
    [user],
  );

  const sync = useCallback(
    async function synchronize() {
      if (!cloud || !mounted.current) return;
      if (syncingRef.current) {
        resync.current = true;
        return;
      }
      syncingRef.current = true;
      resync.current = false;
      setSyncStatus('syncing');
      let succeeded = false;
      try {
        const result = await synchronizeLibrary(user.id, current.current);
        if (!mounted.current) return;
        await commit((previous) => reconcileSync(previous, result));
        succeeded = true;
        if (mounted.current) setSyncStatus('synced');
      } catch {
        if (mounted.current) setSyncStatus('offline');
      } finally {
        syncingRef.current = false;
        if (resync.current && succeeded && mounted.current) void synchronize();
      }
    },
    [cloud, user.id, commit],
  );

  useEffect(() => {
    let active = true;
    readLibrary(user)
      .then((saved) => {
        if (active) {
          current.current = saved;
          setData(saved);
          setLoading(false);
          void sync();
        }
      })
      .catch(() => {
        if (active) {
          setLoadError(
            'Não foi possível abrir sua biblioteca salva. Seus dados foram preservados.',
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [attempt, user, sync]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !loading && !loadError) void sync();
    });
    return () => subscription.remove();
  }, [sync, loading, loadError]);

  const mutate = async (
    book: Book,
    change: (entry?: LibraryEntry) => Partial<Pick<LibraryEntry, 'favorite' | 'read' | 'rating'>>,
    confirmation: (entry: LibraryEntry) => string,
  ) => {
    if (savingRef.current || loading || loadError) return;
    savingRef.current = true;
    setSaving(true);
    setConfirmation(null);
    setSaveError(null);
    lastAction.current = () => mutate(book, change, confirmation);
    let savedEntry: LibraryEntry | undefined;
    try {
      await commit((previous) => {
        const next = updateEntry(previous, book, change(previous.entries[book.id]), cloud);
        savedEntry = next.entries[book.id];
        return next;
      });
      lastAction.current = null;
      // Uma confirmação por ação, somente após gravar. Não anuncia hidratação
      // nem sincronizações, e continua funcionando se o card sair da coleção.
      if (mounted.current && savedEntry)
        setConfirmation({ message: `${book.title}: ${confirmation(savedEntry)}` });
      void sync();
    } catch {
      if (mounted.current)
        setSaveError('Não foi possível salvar a alteração neste aparelho. Tente novamente.');
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  const entries = Object.values(data.entries).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <LibraryContext.Provider
      value={{
        entries: data.entries,
        favorites: entries.filter((entry) => entry.favorite),
        readBooks: entries.filter((entry) => entry.read),
        loading,
        loadError,
        saveError,
        saving,
        syncStatus,
        pendingCount: Object.keys(data.pending).length,
        sync,
        retryLoad: () => {
          setLoading(true);
          setLoadError(null);
          setAttempt((value) => value + 1);
        },
        retrySave: () => {
          void lastAction.current?.();
        },
        toggleFavorite: (book) =>
          mutate(
            book,
            (entry) => ({ favorite: !entry?.favorite }),
            (entry) => (entry.favorite ? 'adicionado aos favoritos.' : 'removido dos favoritos.'),
          ),
        toggleRead: (book) =>
          mutate(
            book,
            (entry) => ({ read: !entry?.read }),
            (entry) =>
              entry.read ? 'marcado como lido.' : 'marcado como não lido. Sem avaliação.',
          ),
        rateBook: (book, rating) =>
          mutate(
            book,
            () => ({ read: true, rating }),
            (entry) => `nota salva: ${entry.rating} de 5 estrelas.`,
          ),
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('useLibrary deve estar dentro de LibraryProvider.');
  return value;
}

export const useFavorites = useLibrary;
