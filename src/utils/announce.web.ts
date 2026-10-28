// RN Web não implementa announceForAccessibility. Mantém uma região viva
// fora das telas para confirmar a ação mesmo quando um card sai da coleção.
let pending: ReturnType<typeof setTimeout> | undefined;

export function announce(message: string, { interrupt = false } = {}) {
  if (typeof document === 'undefined') return;
  let region = document.getElementById('accessibility-announcements');
  if (!region) {
    region = document.createElement('div');
    region.id = 'accessibility-announcements';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.lang = 'pt-BR';
    Object.assign(region.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      clipPath: 'inset(50%)',
    });
    document.body.appendChild(region);
  }
  clearTimeout(pending);
  region.setAttribute('aria-live', interrupt ? 'assertive' : 'polite');
  region.textContent = '';
  // A região precisa existir antes da alteração; permite repetir a mesma mensagem.
  pending = setTimeout(() => {
    region.textContent = message;
  }, 100);
}
