import { useState, type ComponentProps } from 'react';
import type { PressableProps } from 'react-native';
import { fireEvent, isInaccessible, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../src/components/Button';
import { Checkbox } from '../src/components/Checkbox';
import { BookCover } from '../src/components/BookCover';
import { Rating } from '../src/components/Rating';
import { BookCard } from '../src/components/BookCard';
import { CatalogScreen } from '../src/screens/CatalogScreen';
import { DetailsScreen } from '../src/screens/DetailsScreen';
import { Loading } from '../src/components/Feedback';
import { AuthScreen } from '../src/screens/AuthScreen';
import { announce } from '../src/utils/announce';

vi.mock('../src/utils/announce', () => ({ announce: vi.fn() }));

const fixtures = vi.hoisted(() => {
  const book = {
    id: 'OL1W',
    title: 'Livro',
    authors: ['Autora'],
    coverId: 123,
    firstPublishYear: 1900,
    editionCount: 2,
    firstPublishDate: '1900',
    description: 'Uma história para descobrir.',
    subjects: ['Romance'],
  };
  return {
    platform: 'web' as 'web' | 'ios' | 'android',
    controls: [] as PressableProps[],
    book,
    search: vi.fn(),
    toggleFavorite: vi.fn(),
    toggleRead: vi.fn(),
    rateBook: vi.fn(),
    refresh: vi.fn(),
    sync: vi.fn(),
    clearError: vi.fn(),
    saving: false,
    refreshing: false,
    entry: { favorite: false, read: true, rating: 4 as number | null },
  };
});

// Exercita a semântica DOM dos componentes reais. A fala nativa exige aparelho.
vi.mock('react-native', async () => {
  const native = await vi.importActual<typeof import('react-native')>('react-native-web');
  return {
    ...native,
    // RN Web não converte accessibilityState para ARIA. Captura as props
    // entregues ao componente nativo para testar os caminhos iOS/Android.
    Pressable: (props: PressableProps) => {
      fixtures.controls.push(props);
      return <native.Pressable {...props} />;
    },
    Platform: {
      ...native.Platform,
      get OS() {
        return fixtures.platform;
      },
    },
  };
});
vi.mock('@expo/vector-icons', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native-web');
  return {
    Ionicons: (props: ComponentProps<typeof Text>) => <Text {...props}>Ícone decorativo</Text>,
  };
});
vi.mock('react-native-safe-area-context', async () => {
  const { View } = await vi.importActual<typeof import('react-native')>('react-native-web');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Ana' },
    busy: false,
    error: null,
    logout: vi.fn(),
    clearError: fixtures.clearError,
  }),
}));
vi.mock('../src/contexts/LibraryContext', () => ({
  useLibrary: () => ({
    entries: { OL1W: fixtures.entry },
    favorites: [],
    readBooks: [{ book: fixtures.book, rating: 4 }],
    saving: fixtures.saving,
    syncStatus: 'local',
    toggleFavorite: fixtures.toggleFavorite,
    toggleRead: fixtures.toggleRead,
    rateBook: fixtures.rateBook,
    sync: fixtures.sync,
  }),
}));
vi.mock('../src/hooks/useBookDetails', () => ({
  useBookDetails: () => ({ data: fixtures.book, loading: false, error: null, retry: vi.fn() }),
}));
vi.mock('../src/hooks/useCatalog', () => ({
  initialQuery: { term: '', category: '', language: 'all' },
  useCatalog: () => ({
    books: [fixtures.book],
    query: { term: '', category: '', language: 'all' },
    total: 1,
    loading: false,
    refreshing: fixtures.refreshing,
    hasMore: false,
    search: fixtures.search,
    refresh: fixtures.refresh,
    loadMore: vi.fn(),
  }),
}));

beforeEach(() => {
  fixtures.platform = 'web';
  fixtures.controls = [];
  fixtures.saving = false;
  fixtures.refreshing = false;
  fixtures.entry = { favorite: false, read: true, rating: 4 };
});

describe('controles acessíveis', () => {
  it('anuncia ações como botões e bloqueia a ação durante o carregamento', () => {
    const press = vi.fn();
    const { rerender } = render(<Button label="Salvar" onPress={press} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(press).toHaveBeenCalledTimes(1);
    rerender(<Button label="Salvar" onPress={press} loading loadingLabel="Salvando" />);
    const button = screen.getByRole('button', { name: 'Salvando' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).not.toBe('true');
    expect(screen.queryByRole('progressbar')).toBeNull();
    fireEvent.click(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(press).toHaveBeenCalledTimes(1);
    rerender(<Button label="Salvar" onPress={press} disabled />);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(button);
    expect(press).toHaveBeenCalledTimes(1);
  });

  it('expõe o nome do botão uma vez, ocultando texto e ícone internos', () => {
    render(<Button label="Como usar o catálogo" icon="help-circle-outline" onPress={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: 'Como usar o catálogo' })).toHaveLength(1);
    expect(isInaccessible(screen.getByText('Como usar o catálogo'))).toBe(true);
    expect(isInaccessible(screen.getByText('Ícone decorativo'))).toBe(true);
  });

  it('expõe um único anúncio de carregamento, sem duplicar texto e indicador', () => {
    render(<Loading label="Abrindo a estante" />);
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    expect(screen.getByRole('progressbar', { name: 'Abrindo a estante' })).toBeTruthy();
    expect(isInaccessible(screen.getByText('Abrindo a estante'))).toBe(true);
  });

  it.each(['ios', 'android', 'web'] as const)(
    'expõe um único seletor com estado alternável em %s',
    (platform) => {
      fixtures.platform = platform;
      function Filter() {
        const [checked, setChecked] = useState(false);
        return <Checkbox label="Com edição em português" checked={checked} onChange={setChecked} />;
      }
      render(<Filter />);
      const role = platform === 'ios' ? 'switch' : 'checkbox';
      const checkbox = screen.getByRole(role, {
        name: 'Com edição em português',
      });
      expect(screen.getAllByRole(role)).toHaveLength(1);
      if (platform === 'ios') expect(screen.queryByRole('checkbox')).toBeNull();
      expect(isInaccessible(screen.getByText('Com edição em português'))).toBe(true);
      expect(fixtures.controls.at(-1)?.accessibilityState?.checked).toBe(false);
      if (platform === 'web') expect(checkbox.getAttribute('aria-checked')).toBe('false');
      fireEvent.click(checkbox);
      expect(checkbox.getAttribute('aria-label')).toBe('Com edição em português');
      expect(fixtures.controls.at(-1)?.accessibilityState?.checked).toBe(true);
      if (platform === 'web') expect(checkbox.getAttribute('aria-checked')).toBe('true');
      fireEvent.click(checkbox);
      expect(fixtures.controls.at(-1)?.accessibilityState?.checked).toBe(false);
      if (platform === 'web') expect(checkbox.getAttribute('aria-checked')).toBe('false');
    },
  );

  it.each(['ios', 'android', 'web'] as const)(
    'preserva o carregamento em português e bloqueia novas ações em %s',
    (platform) => {
      fixtures.platform = platform;
      const press = vi.fn();
      const { rerender } = render(
        <Button label="Atualizar" loading loadingLabel="Atualizando catálogo" onPress={press} />,
      );
      const button = screen.getByRole('button', { name: 'Atualizando catálogo' });
      expect(fixtures.controls.at(-1)?.accessibilityState?.busy).toBe(
        platform === 'ios' ? undefined : true,
      );
      expect(fixtures.controls.at(-1)?.['aria-busy']).toBe(platform === 'web' ? true : undefined);
      expect(button.getAttribute('aria-disabled')).not.toBe('true');
      fireEvent.click(button);
      expect(press).not.toHaveBeenCalled();
      rerender(<Button label="Atualizar" onPress={press} />);
      fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
      expect(press).toHaveBeenCalledOnce();
    },
  );

  it('omite busy também no carregamento e na avaliação no iOS', () => {
    fixtures.platform = 'ios';
    const rate = vi.fn();
    expect(Loading({ label: 'Abrindo a estante' }).props.accessibilityState).not.toHaveProperty(
      'busy',
    );
    render(
      <>
        <Loading label="Abrindo a estante" />
        <Rating value={4} busy onChange={rate} />
      </>,
    );
    expect(
      screen.getByRole('progressbar', { name: 'Abrindo a estante' }).getAttribute('aria-busy'),
    ).toBeNull();
    const star = screen.getByRole('button', {
      name: 'Mudar para nota 5 de 5 estrelas. Salvando avaliação, aguarde',
    });
    expect(star.getAttribute('aria-busy')).toBeNull();
    expect(fixtures.controls.at(-1)?.accessibilityState).not.toHaveProperty('busy');
    fireEvent.click(star);
    expect(rate).not.toHaveBeenCalled();
  });

  it.each(['Login', 'Register'] as const)(
    'informa a regra da senha uma vez e preserva a visibilidade em %s',
    (name) => {
      const props = {
        navigation: { navigate: vi.fn(), isFocused: () => false, addListener: () => () => {} },
        route: { name },
      } as unknown as ComponentProps<typeof AuthScreen>;
      render(<AuthScreen {...props} />);
      const input = screen.getByLabelText('Senha, no mínimo 8 caracteres') as HTMLInputElement;
      const spokenText = [
        input.getAttribute('aria-label'),
        input.placeholder,
        input.getAttribute('aria-description'),
      ]
        .filter(Boolean)
        .join(' ');
      expect(spokenText.match(/8 caracteres/g)).toHaveLength(1);
      expect(isInaccessible(screen.getByText('Senha · mínimo 8 caracteres'))).toBe(true);
      fireEvent.change(input, { target: { value: 'exemplo123' } });
      expect(input.type).toBe('password');
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Mostrar senha',
          pressed: false,
        }),
      );
      expect(input.type).toBe('text');
      expect(input.value).toBe('exemplo123');
      expect(announce).toHaveBeenLastCalledWith('Senha visível.');
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Ocultar senha',
          pressed: true,
        }),
      );
      expect(input.type).toBe('password');
      expect(input.value).toBe('exemplo123');
      expect(announce).toHaveBeenLastCalledWith('Senha oculta.');
    },
  );

  it('mantém apenas uma nota selecionada entre as cinco opções', () => {
    function Review() {
      const [rating, setRating] = useState<number | null>(null);
      return <Rating value={rating} disabled={false} onChange={setRating} />;
    }
    render(<Review />);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Dar nota 4 de 5 estrelas',
      }),
    );
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
    expect(screen.getByRole('button', { pressed: true }).getAttribute('aria-label')).toBe(
      'Sua nota atual: 4 de 5 estrelas',
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Mudar para nota 2 de 5 estrelas',
      }),
    );
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
    expect(screen.getByRole('button', { pressed: true }).getAttribute('aria-label')).toBe(
      'Sua nota atual: 2 de 5 estrelas',
    );
  });

  it.each(['ios', 'android', 'web'] as const)(
    'distingue a nota salva e não grava nem altera a nota ao explorar as estrelas em %s',
    (platform) => {
      fixtures.platform = platform;
      const change = vi.fn();
      const { rerender } = render(<Rating value={4} onChange={change} />);
      const current = screen.getByRole('button', { name: 'Sua nota atual: 4 de 5 estrelas' });
      const other = screen.getByRole('button', { name: 'Mudar para nota 2 de 5 estrelas' });
      for (const star of screen.getAllByRole('button')) fireEvent.focus(star);
      expect(change).not.toHaveBeenCalled();
      expect(announce).not.toHaveBeenCalled();
      fireEvent.click(current);
      expect(change).not.toHaveBeenCalled();
      expect(announce).toHaveBeenCalledExactlyOnceWith(
        'Sua nota já é 4 de 5 estrelas. Nenhuma alteração feita.',
      );
      fireEvent.click(other);
      expect(change).toHaveBeenCalledExactlyOnceWith(2);
      // A intenção de dar nota não confirma sucesso nem muda a nota salva.
      expect(announce).toHaveBeenCalledTimes(1);
      rerender(<Rating value={4} busy onChange={change} />);
      fireEvent.click(other);
      fireEvent.click(current);
      expect(change).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledTimes(1);
      rerender(<Rating value={2} onChange={change} />);
      expect(screen.getByRole('button', { name: 'Sua nota atual: 2 de 5 estrelas' })).toBe(other);
      expect(screen.getByRole('button', { name: 'Mudar para nota 4 de 5 estrelas' })).toBe(current);
    },
  );

  it.each([null, 123])('separa detalhes e favoritos sem focar a capa (%s)', (coverId) => {
    const open = vi.fn();
    const favorite = vi.fn();
    render(
      <BookCard
        book={{
          id: 'OL1W',
          title: 'Livro',
          authors: ['Autora'],
          coverId,
          firstPublishYear: null,
          editionCount: null,
        }}
        favorite={false}
        read={false}
        rating={null}
        saving={false}
        onOpen={open}
        onFavorite={favorite}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Adicionar aos favoritos: Livro',
      }),
    );
    expect(favorite).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
    expect(screen.queryByRole('img')).toBeNull();
    expect(
      screen.getByRole('button', { name: /^Ver detalhes de/ }).getAttribute('aria-label'),
    ).toBe('Ver detalhes de Livro. Autoria: Autora. Para descobrir. Fora dos favoritos.');
    fireEvent.click(
      screen.getByRole('button', { name: /^Ver detalhes de Livro\. Autoria: Autora\./ }),
    );
    expect(open).toHaveBeenCalledOnce();
  });

  it('expõe uma única imagem quando a capa não está disponível', () => {
    render(<BookCover coverId={null} title="Livro sem capa" large />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Capa indisponível: Livro sem capa' })).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(isInaccessible(screen.getByText('CAPA INDISPONÍVEL'))).toBe(true);
  });

  it('expõe somente o rótulo da capa e oculta a imagem interna da árvore acessível', () => {
    render(<BookCover coverId={123} title="Livro" large />);
    const cover = screen.getByRole('img', { name: 'Capa do livro Livro' });
    expect(screen.getAllByRole('img')).toHaveLength(1);
    const internalImage = cover.querySelector('img');
    expect(internalImage).not.toBeNull();
    expect(isInaccessible(internalImage!)).toBe(true);
  });

  it('oferece um único campo de busca nomeado e mantém a busca por envio e botão', () => {
    const navigate = vi.fn();
    render(
      <CatalogScreen
        {...({ navigation: { navigate } } as unknown as ComponentProps<typeof CatalogScreen>)}
      />,
    );
    const input = screen.getByRole('searchbox', { name: 'Buscar livros' });
    expect(screen.getAllByRole('searchbox')).toHaveLength(1);
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
    fireEvent.change(input, { target: { value: '  Machado de Assis  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(fixtures.search).toHaveBeenLastCalledWith({
      term: 'Machado de Assis',
      category: '',
      language: 'all',
    });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(fixtures.search).toHaveBeenCalledTimes(2);
    fireEvent.click(
      screen.getByRole('button', { name: /^Ver detalhes de Livro\. Autoria: Autora\./ }),
    );
    expect(navigate).toHaveBeenCalledWith('Details', { id: 'OL1W' });
  });

  it('mostra a capa diretamente nos detalhes e expõe as ações como botões', () => {
    const setOptions = vi.fn();
    render(
      <DetailsScreen
        {...({
          navigation: { setOptions },
          route: { params: { id: 'OL1W' } },
        } as unknown as ComponentProps<typeof DetailsScreen>)}
      />,
    );
    expect(setOptions).toHaveBeenCalledWith({ title: 'Detalhes do livro: Livro' });
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Capa do livro Livro' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /capa/i })).toBeNull();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Adicionar aos favoritos',
      }),
    );
    expect(fixtures.toggleFavorite).toHaveBeenCalledWith(fixtures.book);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Marcar como não lido',
      }),
    );
    expect(fixtures.toggleRead).toHaveBeenCalledWith(fixtures.book);
    expect(
      screen.getByRole('button', {
        name: 'Sua nota atual: 4 de 5 estrelas',
        pressed: true,
      }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Mudar para nota 5 de 5 estrelas',
      }),
    );
    expect(fixtures.rateBook).toHaveBeenCalledWith(fixtures.book, 5);
  });

  it('lê a categoria pelo nome e confirma apenas a ativação do filtro', () => {
    render(
      <CatalogScreen
        {...({ navigation: { navigate: vi.fn() } } as unknown as ComponentProps<
          typeof CatalogScreen
        >)}
      />,
    );
    const current = screen.getByRole('button', { name: 'Todos. Categoria atual' });
    const fantasy = screen.getByRole('button', { name: 'Fantasia' });
    fireEvent.focus(fantasy);
    expect(announce).not.toHaveBeenCalled();
    expect(fixtures.search).not.toHaveBeenCalled();
    fireEvent.click(current);
    expect(announce).toHaveBeenLastCalledWith('Todos já é a categoria atual.');
    expect(fixtures.search).not.toHaveBeenCalled();
    fireEvent.click(fantasy);
    expect(fixtures.search).toHaveBeenCalledExactlyOnceWith({
      term: '',
      category: 'fantasy',
      language: 'all',
    });
    expect(announce).toHaveBeenLastCalledWith('Categoria alterada para Fantasia.');
  });

  it('anuncia atualização em andamento e mantém o foco sem desativar o botão', () => {
    const props = { navigation: { navigate: vi.fn() } } as unknown as ComponentProps<
      typeof CatalogScreen
    >;
    const { rerender } = render(<CatalogScreen {...props} />);
    const button = screen.getByRole('button', { name: 'Atualizar catálogo' });
    button.focus();
    fireEvent.click(button);
    expect(fixtures.refresh).toHaveBeenCalledOnce();
    fixtures.refreshing = true;
    rerender(<CatalogScreen {...props} />);
    expect(screen.getByRole('button', { name: 'Atualizando catálogo' })).toBe(button);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).not.toBe('true');
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(fixtures.refresh).toHaveBeenCalledOnce();
    fixtures.refreshing = false;
    rerender(<CatalogScreen {...props} />);
    expect(screen.getByRole('button', { name: 'Atualizar catálogo' })).toBe(button);
    expect(button.getAttribute('aria-busy')).toBe('false');
  });

  it('informa a ação e o estado persistido de leitura e favoritos', () => {
    fixtures.entry = { favorite: false, read: false, rating: null };
    const props = {
      navigation: { setOptions: vi.fn() },
      route: { params: { id: 'OL1W' } },
    } as unknown as ComponentProps<typeof DetailsScreen>;
    const { rerender } = render(<DetailsScreen {...props} />);
    const readButton = screen.getByRole('button', {
      name: 'Marcar como lido',
      pressed: false,
    });
    fireEvent.click(readButton);
    expect(fixtures.toggleRead).toHaveBeenCalledOnce();
    fixtures.saving = true;
    rerender(<DetailsScreen {...props} />);
    expect(
      screen.getByRole('button', { name: 'Salvando estado de leitura de Livro', pressed: false }),
    ).toBe(readButton);
    fireEvent.click(readButton);
    expect(fixtures.toggleRead).toHaveBeenCalledOnce();
    // Uma gravação malsucedida mantém o estado antigo, sem confirmar sucesso.
    fixtures.saving = false;
    rerender(<DetailsScreen {...props} />);
    expect(
      screen.getByRole('button', {
        name: 'Marcar como lido',
        pressed: false,
      }),
    ).toBe(readButton);
    // O contexto só fornece o novo estado após a persistência.
    fixtures.entry = { favorite: true, read: true, rating: null };
    rerender(<DetailsScreen {...props} />);
    expect(
      screen.getByRole('button', {
        name: 'Marcar como não lido',
        pressed: true,
      }),
    ).toBe(readButton);
    expect(
      screen.getByRole('button', {
        name: 'Remover dos favoritos',
        pressed: true,
      }),
    ).toBeTruthy();
    fixtures.entry = { favorite: false, read: false, rating: null };
    rerender(<DetailsScreen {...props} />);
    expect(
      screen.getByRole('button', {
        name: 'Marcar como lido',
        pressed: false,
      }),
    ).toBe(readButton);
    expect(
      screen.getByRole('button', {
        name: 'Adicionar aos favoritos',
        pressed: false,
      }),
    ).toBeTruthy();
  });

  it.each(['ios', 'android', 'web'] as const)(
    'lê os detalhes por informação e preserva as ações separadas em %s',
    (platform) => {
      fixtures.platform = platform;
      fixtures.entry = { favorite: true, read: true, rating: 4 };
      const props = {
        navigation: { setOptions: vi.fn() },
        route: { params: { id: 'OL1W' } },
      } as unknown as ComponentProps<typeof DetailsScreen>;
      const { rerender } = render(<DetailsScreen {...props} />);
      const title = screen.getByRole('heading', { name: 'Livro' });
      expect(title.getAttribute('aria-label')).toBeNull();
      const favorite = screen.getByRole('button', {
        name: 'Remover dos favoritos',
      });
      const read = screen.getByRole('button', {
        name: 'Marcar como não lido',
      });
      const star = screen.getByRole('button', {
        name: 'Sua nota atual: 4 de 5 estrelas',
      });
      expect(title.contains(favorite)).toBe(false);
      expect(title.contains(read)).toBe(false);
      expect(title.contains(star)).toBe(false);
      // Cada informação permanece disponível separadamente na árvore acessível.
      for (const text of [
        'Livro',
        'Autora',
        'PRIMEIRA PUBLICAÇÃO',
        '1900',
        'EDIÇÕES NO CATÁLOGO',
        '2',
      ]) {
        const element = screen.getByText(text);
        expect(isInaccessible(element)).toBe(false);
        if (element !== title) expect(title.contains(element)).toBe(false);
      }
      expect(isInaccessible(title)).toBe(false);
      expect(isInaccessible(screen.getByText(fixtures.book.description))).toBe(false);
      for (const control of [favorite, read, star]) {
        expect(isInaccessible(control)).toBe(false);
        const props = fixtures.controls.findLast(
          (c) => c.accessibilityLabel === control.getAttribute('aria-label'),
        );
        expect(props?.accessibilityState?.selected).toBe(platform === 'ios' ? undefined : true);
        if (platform === 'ios') {
          expect(props?.accessibilityState).not.toHaveProperty('selected');
          expect(props).not.toHaveProperty('aria-pressed');
        }
        fireEvent.focus(control);
      }
      // Explorar os controles não deve marcar o livro nem atribuir uma nota.
      expect(fixtures.toggleFavorite).not.toHaveBeenCalled();
      expect(fixtures.toggleRead).not.toHaveBeenCalled();
      expect(fixtures.rateBook).not.toHaveBeenCalled();
      fireEvent.click(favorite);
      expect(fixtures.toggleFavorite).toHaveBeenCalledWith(fixtures.book);
      fireEvent.click(read);
      expect(fixtures.toggleRead).toHaveBeenCalledWith(fixtures.book);
      fireEvent.click(star);
      expect(fixtures.rateBook).not.toHaveBeenCalled();
      expect(announce).toHaveBeenCalledWith(
        'Sua nota já é 4 de 5 estrelas. Nenhuma alteração feita.',
      );
      fixtures.entry = { favorite: true, read: true, rating: 5 };
      rerender(<DetailsScreen {...props} />);
      expect(screen.getByRole('button', { name: 'Sua nota atual: 5 de 5 estrelas' })).toBeTruthy();
      fixtures.entry = { favorite: false, read: true, rating: null };
      rerender(<DetailsScreen {...props} />);
      expect(screen.getByRole('button', { name: 'Adicionar aos favoritos' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Dar nota 5 de 5 estrelas' })).toBeTruthy();
      fixtures.entry = { favorite: false, read: false, rating: null };
      rerender(<DetailsScreen {...props} />);
      expect(screen.getByRole('button', { name: 'Marcar como lido' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: /(Dar|Mudar para) nota/ })).toBeNull();
    },
  );

  it('inclui favoritos, leitura e nota no foco de abrir detalhes do card', () => {
    const open = vi.fn();
    const favorite = vi.fn();
    const props = {
      book: fixtures.book,
      favorite: true,
      read: true,
      rating: 5,
      saving: false,
      onOpen: open,
      onFavorite: favorite,
    };
    const { rerender } = render(<BookCard {...props} />);
    const details = screen.getByRole('button', { name: /^Ver detalhes de/ });
    expect(details.getAttribute('aria-label')).toContain(
      'Ver detalhes de Livro. Autoria: Autora. Ano: 1900. Lido. Sua nota: 5 de 5 estrelas. Nos favoritos.',
    );
    fireEvent.click(details);
    expect(open).toHaveBeenCalledOnce();
    expect(favorite).not.toHaveBeenCalled();
    expect(isInaccessible(screen.getByText('★ 5 / 5 · Lido'))).toBe(true);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remover dos favoritos: Livro',
      }),
    );
    expect(favorite).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledOnce();
    rerender(<BookCard {...props} favorite={false} read={false} rating={null} />);
    expect(details.getAttribute('aria-label')).toContain(
      'Ver detalhes de Livro. Autoria: Autora. Ano: 1900. Para descobrir. Fora dos favoritos.',
    );
    expect(isInaccessible(screen.getByText('Para descobrir'))).toBe(true);
    rerender(<BookCard {...props} read rating={null} />);
    expect(details.getAttribute('aria-label')).toBe(
      'Ver detalhes de Livro. Autoria: Autora. Ano: 1900. Lido, ainda sem nota. Nos favoritos.',
    );
  });
});
