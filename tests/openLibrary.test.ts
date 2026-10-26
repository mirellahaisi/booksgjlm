import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import {
  appendUnique,
  fetchBookDetails,
  fetchBooks,
  normalizeBook,
  openLibrary,
  workId,
} from '../src/services/openLibrary';
import { cleanText } from '../src/utils/text';

const mock = new MockAdapter(openLibrary);
afterEach(() => mock.reset());
const query = { term: '', category: '', language: 'all' as const };

describe('Open Library', () => {
  it('envia página, limite, busca e filtros ao endpoint e calcula o fim da lista', async () => {
    mock.onGet('/search.json').reply((config) => {
      expect(config.params).toMatchObject({
        q: 'Machado',
        subject: 'romance',
        language: 'por',
        page: 2,
        limit: 20,
      });
      return [200, { docs: [{ key: '/works/OL1W', title: 'Dom Casmurro' }], numFound: 21 }];
    });
    const result = await fetchBooks({ term: 'Machado', category: 'romance', language: 'por' }, 2);
    expect(result.books[0].id).toBe('OL1W');
    expect(result.hasMore).toBe(false);
  });
  it('carrega o catálogo inicial e informa que existem mais páginas', async () => {
    mock
      .onGet('/search.json')
      .reply(200, { docs: [{ key: 'OL2W', title: 'Livro' }], numFound: 55 });
    expect((await fetchBooks(query, 1)).hasMore).toBe(true);
    expect(mock.history.get[0].params.q).toBe('subject:fiction');
  });
  it('aceita resultado vazio sem navegar para um item inexistente', async () => {
    mock.onGet('/search.json').reply(200, { docs: [], numFound: 0 });
    expect(await fetchBooks(query, 1)).toEqual({ books: [], total: 0, hasMore: false });
  });
  it('normaliza campos ausentes e rejeita IDs que não representam obras', () => {
    expect(normalizeBook({ key: '/works/OL1W', cover_i: -1 })).toMatchObject({
      coverId: null,
      authors: [],
      title: 'Livro sem título',
    });
    expect(normalizeBook({ key: 'OL1W', first_publish_year: 0 })?.firstPublishYear).toBeNull();
    expect(normalizeBook({ key: '/books/OL1M' })).toBeNull();
    expect(() => workId('../users')).toThrow();
  });
  it('não repete livros ao anexar páginas', () => {
    const book = normalizeBook({ key: 'OL1W' })!;
    const second = normalizeBook({ key: 'OL2W' })!;
    expect(appendUnique([book], [book, second, second])).toEqual([book, second]);
  });
  it('busca uma ficha completa pelo ID e limpa HTML da descrição', async () => {
    mock.onGet('/works/OL1W.json').reply(200, {
      title: 'Livro',
      description: { value: '<p>Olá &amp; bem-vindo.</p>' },
      covers: [-1, 123],
      subjects: ['Fiction'],
    });
    mock
      .onGet('/search.json')
      .reply(200, { docs: [{ key: 'OL1W', author_name: ['Autor'], first_publish_year: 1900 }] });
    expect(await fetchBookDetails('OL1W')).toMatchObject({
      description: 'Olá & bem-vindo.',
      coverId: 123,
      authors: ['Autor'],
      firstPublishYear: 1900,
    });
    expect(mock.history.get.map((request) => request.url)).toEqual([
      '/works/OL1W.json',
      '/search.json',
    ]);
  });
  it('preserva a ficha quando os metadados complementares falham', async () => {
    mock.onGet('/works/OL2W.json').reply(200, { title: 'Livro' });
    mock.onGet('/search.json').networkError();
    expect((await fetchBookDetails('OL2W')).title).toBe('Livro');
  });
  it('propaga erros de rede e respostas inválidas para a UI', async () => {
    mock.onGet('/search.json').networkErrorOnce();
    await expect(fetchBooks(query, 1)).rejects.toThrow();
    mock.onGet('/search.json').reply(200, { broken: true });
    await expect(fetchBooks(query, 1)).rejects.toThrow('Resposta inesperada');
  });
  it('limpa scripts, entidades numéricas e links Markdown', () => {
    expect(
      cleanText(
        '<script>alert(1)</script><b>Ol&#225;</b> &quot;leitor&quot; [site](https://example.com)',
      ),
    ).toBe('Olá "leitor" site');
    expect(cleanText(null)).toBe('');
  });
});
