import { afterEach, describe, expect, it, vi } from 'vitest';
import { announce as announceWeb } from '../src/utils/announce.web';

afterEach(() => {
  vi.useRealTimers();
  document.getElementById('accessibility-announcements')?.remove();
});

describe('confirmações acessíveis na web', () => {
  it('atualiza uma região viva na web, inclusive ao repetir uma confirmação', () => {
    vi.useFakeTimers();
    const message = 'Sua nota já é 4 de 5 estrelas. Nenhuma alteração feita.';
    announceWeb(message);
    const region = document.querySelector('[role="status"]')!;
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.getAttribute('lang')).toBe('pt-BR');
    expect(region.textContent).toBe('');
    vi.runAllTimers();
    expect(region.textContent).toBe(message);
    announceWeb(message);
    expect(region.textContent).toBe('');
    vi.runAllTimers();
    expect(region.textContent).toBe(message);
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
    announceWeb('Livro: removido dos favoritos.', { interrupt: true });
    expect(region.getAttribute('aria-live')).toBe('assertive');
    vi.runAllTimers();
    expect(region.textContent).toBe('Livro: removido dos favoritos.');
  });
});
