export interface Book {
  id: string;
  title: string;
  authors: string[];
  coverId: number | null;
  firstPublishYear: number | null;
  editionCount: number | null;
}

export interface BookDetails extends Book {
  description: string;
  subjects: string[];
  firstPublishDate: string | null;
}

export interface BookQuery {
  term: string;
  category: string;
  language: 'all' | 'por';
}

export interface BookPage {
  books: Book[];
  total: number;
  hasMore: boolean;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  provider: 'local' | 'firebase';
}

export interface LibraryEntry {
  book: Book;
  favorite: boolean;
  read: boolean;
  rating: number | null;
  updatedAt: number;
}

export interface LibraryData {
  version: 1;
  entries: Record<string, LibraryEntry>;
  pending: Record<string, number>;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Catalog: undefined;
  Favorites: undefined;
  ReadBooks: undefined;
  Details: { id: string };
};
