import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { openLibrary } from '../src/services/openLibrary';
import { useCatalog } from '../src/hooks/useCatalog';

const mock = new MockAdapter(openLibrary);
afterEach(() => mock.reset());
const document = (id: number) => ({ key: `OL${id}W`, title: `Livro ${id}` });

describe('catálogo e concorrência', () => {
  it('anexa páginas, ignora chamadas duplicadas e atualiza só a primeira página no refresh', async () => {
    mock.onGet('/search.json').reply((config) => [
      200,
      {
        docs: config.params.page === 1 ? [document(1)] : [document(1), document(2)],
        numFound: 30,
      },
    ]);
    const { result } = renderHook(useCatalog);
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.books).toHaveLength(2));
    expect(mock.history.get).toHaveLength(2);
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.books.map((book) => book.id)).toEqual(['OL1W']);
  });
  it('preserva a lista quando a próxima página falha e repete a página correta', async () => {
    mock.onGet('/search.json').replyOnce(200, { docs: [document(1)], numFound: 30 });
    const { result } = renderHook(useCatalog);
    await waitFor(() => expect(result.current.loading).toBe(false));
    mock.onGet('/search.json').networkErrorOnce();
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.moreError).toBeTruthy());
    expect(result.current.books).toHaveLength(1);
    mock.onGet('/search.json').replyOnce((config) => {
      expect(config.params.page).toBe(2);
      return [200, { docs: [document(2)], numFound: 30 }];
    });
    act(() => result.current.retryMore());
    await waitFor(() => expect(result.current.books).toHaveLength(2));
    expect(result.current.moreError).toBeNull();
  });
  it('descarta uma resposta antiga quando uma nova busca já terminou', async () => {
    let resolveOld: (value: [number, unknown]) => void = () => {};
    mock.onGet('/search.json').reply((config) =>
      config.params.q === 'lenta'
        ? new Promise((resolve) => {
            resolveOld = resolve;
          })
        : Promise.resolve([
            200,
            { docs: [document(config.params.q === 'rápida' ? 3 : 1)], numFound: 1 },
          ]),
    );
    const { result } = renderHook(useCatalog);
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.search({ term: 'lenta', category: '', language: 'all' }));
    act(() => result.current.search({ term: 'rápida', category: '', language: 'all' }));
    await waitFor(() => expect(result.current.books[0]?.id).toBe('OL3W'));
    await act(async () => {
      resolveOld([200, { docs: [document(2)], numFound: 1 }]);
    });
    expect(result.current.books[0].id).toBe('OL3W');
    expect(result.current.query.term).toBe('rápida');
  });
});
