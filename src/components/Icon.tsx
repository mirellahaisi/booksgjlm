import { Ionicons as NativeIcon } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { decorativeAccessibility } from '../utils/accessibility';

// O controle que contém o ícone fornece o nome e a função da ação.
// Oculta também na web para não pronunciar o caractere da fonte de ícones.
export function Ionicons(props: ComponentProps<typeof NativeIcon>) {
  return <NativeIcon {...props} {...decorativeAccessibility} />;
}
