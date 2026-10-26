import { useEffect, useState } from 'react';
import { isCancel } from 'axios';
import type { BookDetails } from '../types';
import { fetchBookDetails } from '../services/openLibrary';

export function useBookDetails(id: string) {
  const [attempt, setAttempt] = useState(0);
  const key = `${id}:${attempt}`;
  const [result, setResult] = useState<{
    key: string;
    data: BookDetails | null;
    error: string | null;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchBookDetails(id, controller.signal)
      .then((book) => {
        if (!controller.signal.aborted) setResult({ key, data: book, error: null });
      })
      .catch((reason) => {
        if (!controller.signal.aborted && !isCancel(reason))
          setResult({
            key,
            data: null,
            error: 'Não foi possível abrir este livro. Confira sua conexão e tente novamente.',
          });
      });
    return () => controller.abort();
  }, [id, key]);
  const loading = result?.key !== key;
  return {
    data: loading ? null : (result?.data ?? null),
    loading,
    error: loading ? null : (result?.error ?? null),
    retry: () => setAttempt((value) => value + 1),
  };
}
