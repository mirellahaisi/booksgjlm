import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { useBookDetails } from '../src/hooks/useBookDetails';
import { openLibrary } from '../src/services/openLibrary';

const mock = new MockAdapter(openLibrary);
afterEach(() => mock.reset());

describe('carregamento dos detalhes — RF03/RF09', () => {
  it('mantém loading até receber a ficha e permite repetir uma falha de rede', async () => {
    mock.onGet('/works/OL1W.json').networkErrorOnce();
    const { result } = renderHook(() => useBookDetails('OL1W'));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    await waitFor(() => expect(result.current.error).toContain('conexão'));
    mock.onGet('/works/OL1W.json').reply(200, { title: 'Livro recuperado' });
    mock.onGet('/search.json').reply(200, { docs: [] });
    act(() => result.current.retry());
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(result.current.data?.title).toBe('Livro recuperado'));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('não mostra os dados do livro anterior enquanto outro ID carrega', async () => {
    mock.onGet('/works/OL1W.json').reply(200, { title: 'Primeiro livro' });
    mock.onGet('/works/OL2W.json').reply(200, { title: 'Segundo livro' });
    mock.onGet('/search.json').reply(200, { docs: [] });
    const { result, rerender } = renderHook(({ id }) => useBookDetails(id), {
      initialProps: { id: 'OL1W' },
    });
    await waitFor(() => expect(result.current.data?.id).toBe('OL1W'));
    rerender({ id: 'OL2W' });
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    await waitFor(() => expect(result.current.data?.id).toBe('OL2W'));
  });

  it('ignora uma resposta atrasada após a pessoa abrir outro livro', async () => {
    let finishOld!: (response: [number, unknown]) => void;
    mock.onGet('/works/OL1W.json').reply(
      () =>
        new Promise((resolve) => {
          finishOld = resolve;
        }),
    );
    mock.onGet('/works/OL2W.json').reply(200, { title: 'Segundo livro' });
    mock.onGet('/search.json').reply(200, { docs: [] });
    const { result, rerender } = renderHook(({ id }) => useBookDetails(id), {
      initialProps: { id: 'OL1W' },
    });
    await waitFor(() => expect(finishOld).toBeDefined());
    rerender({ id: 'OL2W' });
    await waitFor(() => expect(result.current.data?.id).toBe('OL2W'));
    await act(async () => {
      finishOld([200, { title: 'Resposta antiga' }]);
    });
    expect(result.current.data?.title).toBe('Segundo livro');
    expect(result.current.error).toBeNull();
  });
});
