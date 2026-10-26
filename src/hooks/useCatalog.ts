import { useCallback, useEffect, useRef, useState } from 'react';
import { isCancel } from 'axios';
import type { Book, BookQuery } from '../types';
import { appendUnique, fetchBooks } from '../services/openLibrary';

export const initialQuery: BookQuery = { term: '', category: '', language: 'all' };
interface State {
  books: Book[];
  total: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  moreError: string | null;
}
const initial: State = {
  books: [],
  total: 0,
  page: 0,
  hasMore: false,
  loading: true,
  refreshing: false,
  loadingMore: false,
  error: null,
  moreError: null,
};

export function useCatalog() {
  const [query, setQuery] = useState(initialQuery);
  const queryRef = useRef(query);
  const [state, setState] = useState(initial);
  const stateRef = useRef(state);
  const controller = useRef<AbortController | null>(null);
  const request = useRef(0);
  const busy = useRef(false);
  const update = useCallback((transform: (previous: State) => State) => {
    stateRef.current = transform(stateRef.current);
    setState(stateRef.current);
  }, []);

  const load = useCallback(
    async (criteria: BookQuery, mode: 'initial' | 'refresh' | 'more') => {
      if (mode === 'more' && (busy.current || !stateRef.current.hasMore)) return;
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      const sequence = ++request.current;
      busy.current = true;
      const page = mode === 'more' ? stateRef.current.page + 1 : 1;
      update((previous) => ({
        ...(mode === 'initial' ? initial : previous),
        loading: mode === 'initial',
        refreshing: mode === 'refresh',
        loadingMore: mode === 'more',
        error: null,
        moreError: null,
      }));
      try {
        const result = await fetchBooks(criteria, page, abort.signal);
        if (sequence !== request.current) return;
        update((previous) => ({
          ...previous,
          books: appendUnique(mode === 'more' ? previous.books : [], result.books),
          total: result.total,
          page,
          hasMore: result.hasMore,
        }));
      } catch (error) {
        if (sequence !== request.current || isCancel(error)) return;
        const message =
          'Não foi possível carregar os livros. Verifique sua conexão e tente novamente.';
        update((previous) => ({
          ...previous,
          ...(mode === 'more' ? { moreError: message } : { error: message }),
        }));
      } finally {
        if (sequence === request.current) {
          busy.current = false;
          update((previous) => ({
            ...previous,
            loading: false,
            refreshing: false,
            loadingMore: false,
          }));
        }
      }
    },
    [update],
  );

  useEffect(() => {
    void load(initialQuery, 'initial');
    const requestRef = request;
    const controllerRef = controller;
    return () => {
      requestRef.current++;
      controllerRef.current?.abort();
    };
  }, [load]);

  const search = (next: BookQuery) => {
    queryRef.current = next;
    setQuery(next);
    void load(next, 'initial');
  };
  return {
    ...state,
    query,
    search,
    refresh: () => {
      void load(queryRef.current, 'refresh');
    },
    retry: () => {
      void load(queryRef.current, stateRef.current.books.length ? 'refresh' : 'initial');
    },
    loadMore: () => {
      if (!stateRef.current.moreError && !stateRef.current.error)
        void load(queryRef.current, 'more');
    },
    retryMore: () => {
      void load(queryRef.current, 'more');
    },
  };
}
