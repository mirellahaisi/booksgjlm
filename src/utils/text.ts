const entities: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
};

export function cleanText(value: unknown): string {
  const raw =
    typeof value === 'string'
      ? value
      : value && typeof value === 'object' && 'value' in value && typeof value.value === 'string'
        ? value.value
        : '';
  return raw
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\s*br\s*\/?\s*>|<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
      if (!entity.startsWith('#')) return entities[entity.toLowerCase()] ?? match;
      const number =
        entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : '';
    })
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'Já existe uma conta com este e-mail.',
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/invalid-email': 'Informe um e-mail válido.',
      'auth/weak-password': 'Use uma senha com pelo menos 8 caracteres.',
      'auth/network-request-failed':
        'Não foi possível conectar. Confira sua internet e tente novamente.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    };
    if (messages[String(error.code)]) return messages[String(error.code)];
  }
  return error instanceof UserError ? error.message : fallback;
}

export class UserError extends Error {}
