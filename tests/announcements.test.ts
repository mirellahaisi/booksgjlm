import { describe, expect, it, vi } from 'vitest';
import { announce } from '../src/utils/announce';

const native = vi.hoisted(() => ({
  platform: 'ios',
  queued: vi.fn(),
  immediate: vi.fn(),
}));
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return native.platform;
    },
  },
  AccessibilityInfo: {
    announceForAccessibilityWithOptions: native.queued,
    announceForAccessibility: native.immediate,
  },
}));

describe('confirmações acessíveis', () => {
  it('enfileira a confirmação no iOS para não cortar a leitura em andamento', () => {
    native.platform = 'ios';
    announce('Livro: nota salva: 4 de 5 estrelas.');
    expect(native.queued).toHaveBeenCalledExactlyOnceWith('Livro: nota salva: 4 de 5 estrelas.', {
      queue: true,
    });
    expect(native.immediate).not.toHaveBeenCalled();
  });

  it('envia a confirmação ao TalkBack no Android', () => {
    native.platform = 'android';
    announce('Livro: adicionado aos favoritos.');
    expect(native.immediate).toHaveBeenCalledExactlyOnceWith('Livro: adicionado aos favoritos.');
    expect(native.queued).not.toHaveBeenCalled();
  });

  it('substitui a fala anterior ao confirmar uma alteração salva no iOS', () => {
    native.platform = 'ios';
    announce('Livro: removido dos favoritos.', { interrupt: true });
    expect(native.queued).toHaveBeenCalledExactlyOnceWith('Livro: removido dos favoritos.', {
      queue: false,
    });
  });
});
