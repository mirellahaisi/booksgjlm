import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { Text } from '../src/components/Typography';
import { AccessibleHeader } from '../src/components/AccessibleHeader';
import { usePageFocus } from '../src/hooks/usePageFocus';
import { AuthScreen } from '../src/screens/AuthScreen';

const native = vi.hoisted(() => ({ platform: 'web', focus: vi.fn() }));
vi.mock('react-native', async () => {
  const web = await vi.importActual<typeof import('react-native')>('react-native-web');
  return {
    ...web,
    Platform: {
      ...web.Platform,
      get OS() {
        return native.platform;
      },
    },
    AccessibilityInfo: { ...web.AccessibilityInfo, sendAccessibilityEvent: native.focus },
  };
});
vi.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ busy: false, error: null, clearError: () => {} }),
}));
vi.mock('react-native-safe-area-context', async () => {
  const { View } = await vi.importActual<typeof import('react-native')>('react-native-web');
  return { SafeAreaView: View };
});

function createNavigation() {
  type Event = { data: { closing: boolean } };
  const listeners = new Map<string, Set<(event: Event) => void>>();
  let focused = true;
  const navigation = {
    isFocused: () => focused,
    goBack: vi.fn(),
    addListener: (name: string, listener: (event: Event) => void) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)!.add(listener);
      return () => {
        listeners.get(name)!.delete(listener);
      };
    },
  };
  return {
    navigation: navigation as unknown as Parameters<typeof usePageFocus>[0],
    goBack: navigation.goBack,
    emit(name: string, closing = false) {
      if (name === 'focus') focused = true;
      if (name === 'blur') focused = false;
      listeners.get(name)?.forEach((listener) => listener({ data: { closing } }));
    },
    listenerCount: () => [...listeners.values()].reduce((count, set) => count + set.size, 0),
  };
}

function Page({
  navigation,
  title,
}: {
  navigation: Parameters<typeof usePageFocus>[0];
  title: string;
}) {
  const ref = usePageFocus(navigation);
  return (
    <Text ref={ref} accessible accessibilityRole="header" {...{ tabIndex: -1 }}>
      {title}
    </Text>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  native.platform = 'web';
});
afterEach(() => {
  vi.useRealTimers();
});

describe('orientação ao entrar nas páginas', () => {
  it.each([
    ['Login', 'Entrar na conta. Que bom te ver.'],
    ['Register', 'Criar conta. Comece sua coleção.'],
  ])('identifica a página %s mesmo sem cabeçalho de navegação', (name, title) => {
    const nav = createNavigation();
    render(
      <AuthScreen
        {...({
          navigation: nav.navigation,
          route: { name },
        } as unknown as ComponentProps<typeof AuthScreen>)}
      />,
    );
    act(() => {
      vi.runAllTimers();
    });
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: title }));
  });

  it.each(['Catálogo · GJLM Books', 'Meus favoritos', 'Livros lidos', 'Detalhes do livro: Livro'])(
    'foca o título %s antes de Voltar e mantém o botão disponível',
    (title) => {
      const nav = createNavigation();
      render(
        <AccessibleHeader
          {...({
            navigation: nav.navigation,
            options: { title },
            route: { name: 'Details', key: 'details' },
            back: { title: 'Catálogo · GJLM Books' },
          } as unknown as ComponentProps<typeof AccessibleHeader>)}
        />,
      );
      act(() => {
        vi.runAllTimers();
      });
      const heading = screen.getByRole('heading', { name: title });
      const back = screen.getByRole('button', { name: 'Voltar para Catálogo · GJLM Books' });
      expect(document.activeElement).toBe(heading);
      expect(heading.compareDocumentPosition(back) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      fireEvent.click(back);
      expect(nav.goBack).toHaveBeenCalledOnce();
    },
  );

  it.each(['ios', 'android'])(
    'espera a transição, foca uma vez e volta a orientar no retorno em %s',
    (platform) => {
      native.platform = platform;
      const nav = createNavigation();
      const { rerender } = render(<Page navigation={nav.navigation} title="Detalhes do livro" />);
      act(() => {
        nav.emit('transitionStart');
        vi.advanceTimersByTime(600);
      });
      expect(native.focus).not.toHaveBeenCalled();
      act(() => {
        nav.emit('transitionEnd');
        vi.advanceTimersByTime(50);
      });
      const heading = screen.getByRole('heading');
      expect(native.focus).toHaveBeenCalledExactlyOnceWith(heading, 'focus');
      rerender(<Page navigation={nav.navigation} title="Detalhes do livro: Livro" />);
      act(() => {
        nav.emit('transitionEnd');
        vi.runAllTimers();
      });
      expect(native.focus).toHaveBeenCalledTimes(1);
      act(() => {
        nav.emit('blur');
        nav.emit('focus');
        nav.emit('transitionEnd');
        vi.runAllTimers();
      });
      expect(native.focus).toHaveBeenCalledTimes(2);
    },
  );

  it('orienta a primeira tela mesmo sem evento de transição e cancela ao sair', () => {
    native.platform = 'ios';
    const nav = createNavigation();
    const { unmount } = render(<Page navigation={nav.navigation} title="Entrar na conta" />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(native.focus).toHaveBeenCalledOnce();
    act(() => {
      nav.emit('blur');
      nav.emit('focus');
      nav.emit('blur');
      vi.runAllTimers();
    });
    expect(native.focus).toHaveBeenCalledOnce();
    act(() => {
      nav.emit('focus');
    });
    unmount();
    act(() => {
      vi.runAllTimers();
    });
    expect(native.focus).toHaveBeenCalledOnce();
    expect(nav.listenerCount()).toBe(0);
  });
});
