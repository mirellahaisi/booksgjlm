import { Platform, type AccessibilityProps, type AccessibilityState } from 'react-native';
import type { Book, LibraryEntry } from '../types';

// No VoiceOver, o trait selected pode anteceder o nome e parecer apenas foco.
// A ação ou o rótulo da nota atual explica o controle sem esse prefixo.
export function selectionAccessibilityState(selected?: boolean): AccessibilityState {
  return Platform.OS === 'ios' || selected === undefined ? {} : { selected };
}

export function favoriteAction(favorite: boolean) {
  return favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
}

export function readAction(read: boolean) {
  return read ? 'Marcar como não lido' : 'Marcar como lido';
}

export function favoriteControlLabel(title: string, favorite: boolean) {
  return `${favoriteAction(favorite)}: ${title}`;
}

export function cardAccessibilityLabel(
  book: Book,
  entry: Pick<LibraryEntry, 'favorite' | 'read' | 'rating'>,
) {
  const reading = entry.read
    ? entry.rating != null
      ? `Lido. Sua nota: ${entry.rating} de 5 estrelas`
      : 'Lido, ainda sem nota'
    : 'Para descobrir';
  const year = book.firstPublishYear != null ? `Ano: ${book.firstPublishYear}. ` : '';
  return `Ver detalhes de ${book.title}. Autoria: ${book.authors.join(', ') || 'não informada'}. ${year}${reading}. ${entry.favorite ? 'Nos favoritos' : 'Fora dos favoritos'}.`;
}

// O RN iOS acrescenta a string localizada "busy" ao accessibilityValue.
// No Expo Go ela pode vir em inglês. Nesse SO, o rótulo em português já
// descreve a operação; Android/web continuam recebendo o estado busy.
export function loadingAccessibilityState(busy: boolean): AccessibilityState {
  return Platform.OS === 'ios' ? {} : { busy };
}

// Use apenas em conteúdo visual cujo nome já é fornecido pelo controle pai.
// Isso oculta a árvore semântica; o OCR opcional do VoiceOver é controlado pelo iOS.
export const decorativeAccessibility = {
  accessible: false,
  'aria-hidden': true,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
} as const satisfies AccessibilityProps;
