import { create, isCancel } from 'axios';
import type { Book, BookDetails, BookPage, BookQuery } from '../types';
import { cleanText } from '../utils/text';

export const PAGE_SIZE = 20;
export const categories = [
  { id: '', label: 'Todos' },
  { id: 'fantasy', label: 'Fantasia' },
  { id: 'romance', label: 'Romance' },
  { id: 'mystery', label: 'Mistério' },
  { id: 'science_fiction', label: 'Ficção científica' },
  { id: 'history', label: 'História' },
  { id: 'biography', label: 'Biografias' },
];

export const openLibrary = create({ baseURL: 'https://openlibrary.org', timeout: 20000 });

interface SearchDocument {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  edition_count?: number;
}

export function workId(key: string): string {
  const id = key.replace(/^\/works\//, '');
  if (!/^OL\d+W$/.test(id)) throw new Error('Identificador de livro inválido.');
  return id;
}

export function normalizeBook(doc: SearchDocument): Book | null {
  if (!doc.key || !/^(\/works\/)?OL\d+W$/.test(doc.key)) return null;
  return {
    id: workId(doc.key),
    title: cleanText(doc.title) || 'Livro sem título',
    authors: doc.author_name?.map(cleanText).filter(Boolean) ?? [],
    coverId: typeof doc.cover_i === 'number' && doc.cover_i > 0 ? doc.cover_i : null,
    firstPublishYear:
      typeof doc.first_publish_year === 'number' && doc.first_publish_year > 0
        ? doc.first_publish_year
        : null,
    editionCount: doc.edition_count ?? null,
  };
}

// Search API retorna obras (works), não edições; o ID permanece estável entre páginas.
export async function fetchBooks(
  query: BookQuery,
  page: number,
  signal?: AbortSignal,
): Promise<BookPage> {
  const { data } = await openLibrary.get<{
    docs: SearchDocument[];
    numFound?: number;
    num_found?: number;
  }>('/search.json', {
    signal,
    params: {
      q: query.term.trim() || (query.category ? `subject:${query.category}` : 'subject:fiction'),
      ...(query.term.trim() && query.category ? { subject: query.category } : {}),
      ...(query.language === 'por' ? { language: 'por' } : {}),
      page,
      limit: PAGE_SIZE,
      lang: 'pt',
      fields: 'key,title,author_name,cover_i,first_publish_year,edition_count',
    },
  });
  if (!Array.isArray(data.docs)) throw new Error('Resposta inesperada da Open Library.');
  const total = data.numFound ?? data.num_found ?? 0;
  return {
    books: data.docs.map(normalizeBook).filter((book): book is Book => book !== null),
    total,
    hasMore: data.docs.length > 0 && page * PAGE_SIZE < total,
  };
}

export async function fetchBookDetails(id: string, signal?: AbortSignal): Promise<BookDetails> {
  const safeId = workId(id);
  const { data } = await openLibrary.get<{
    title?: string;
    description?: unknown;
    covers?: number[];
    subjects?: string[];
    first_publish_date?: string;
    authors?: { author?: { key?: string } }[];
  }>(`/works/${safeId}.json`, { signal });
  // Os nomes não vêm na resposta da obra. A busca pelo ID complementa a ficha
  // em uma única chamada, evitando uma requisição por autor.
  let metadata: Book | null = null;
  try {
    const result = await openLibrary.get<{ docs: SearchDocument[] }>('/search.json', {
      signal,
      params: {
        q: `key:/works/${safeId}`,
        limit: 1,
        fields: 'key,title,author_name,first_publish_year,edition_count',
      },
    });
    metadata = result.data.docs[0] ? normalizeBook(result.data.docs[0]) : null;
  } catch (error) {
    if (isCancel(error)) throw error;
    // Metadados complementares não impedem a leitura da ficha principal.
  }
  return {
    id: safeId,
    title: cleanText(data.title) || 'Livro sem título',
    authors: metadata?.authors ?? [],
    coverId: data.covers?.find((cover) => cover > 0) ?? null,
    firstPublishYear: metadata?.firstPublishYear ?? null,
    editionCount: metadata?.editionCount ?? null,
    firstPublishDate: data.first_publish_date ?? null,
    description:
      cleanText(data.description) ||
      'A Open Library ainda não disponibilizou uma sinopse para este livro.',
    subjects: (data.subjects ?? []).map(cleanText).filter(Boolean).slice(0, 12),
  };
}

export function coverUrl(id: number, size: 'M' | 'L' = 'M'): string {
  return `https://covers.openlibrary.org/b/id/${id}-${size}.jpg?default=false`;
}

export function appendUnique(current: Book[], next: Book[]): Book[] {
  const ids = new Set(current.map((book) => book.id));
  return [...current, ...next.filter((book) => !ids.has(book.id) && Boolean(ids.add(book.id)))];
}
