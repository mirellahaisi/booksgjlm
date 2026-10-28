import { forwardRef, type ComponentRef } from 'react';
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextProps,
  type TextInputProps,
} from 'react-native';

// Zero significa sem limite: respeita inclusive os tamanhos extras de acessibilidade.
// O sistema escala a fonte e a altura de linha; não multiplicamos fontSize manualmente.
export const Text = forwardRef<ComponentRef<typeof NativeText>, TextProps>(
  function Text(props, ref) {
    return (
      <NativeText
        {...props}
        ref={ref}
        accessibilityLanguage="pt-BR"
        allowFontScaling
        maxFontSizeMultiplier={0}
      />
    );
  },
);

export const TextInput = forwardRef<ComponentRef<typeof NativeTextInput>, TextInputProps>(
  function TextInput(props, ref) {
    return (
      <NativeTextInput
        {...props}
        ref={ref}
        accessibilityLanguage="pt-BR"
        allowFontScaling
        maxFontSizeMultiplier={0}
      />
    );
  },
);
