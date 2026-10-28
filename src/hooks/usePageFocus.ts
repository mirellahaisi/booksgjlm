import { useEffect, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, Platform, Text } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type PageNavigation = Pick<
  NativeStackNavigationProp<RootStackParamList>,
  'addListener' | 'isFocused'
>;

// Um foco por entrada na página. Mudanças de título, nota ou favoritos não
// devem tirar o foco do controle que a pessoa está usando.
export function usePageFocus(navigation: PageNavigation) {
  const titleRef = useRef<ComponentRef<typeof Text>>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = navigation.isFocused();
    const cancel = () => clearTimeout(timer);
    const focus = () => {
      if (!pending || !navigation.isFocused() || !titleRef.current) return;
      pending = false;
      if (Platform.OS === 'web') {
        titleRef.current.focus();
      } else {
        AccessibilityInfo.sendAccessibilityEvent(titleRef.current, 'focus');
      }
    };
    const schedule = (delay: number) => {
      cancel();
      timer = setTimeout(focus, delay);
    };
    const enter = () => {
      pending = true;
      // A primeira tela e a versão web podem não emitir transitionEnd.
      schedule(Platform.OS === 'web' ? 0 : 500);
    };
    const removeFocus = navigation.addListener('focus', enter);
    const removeBlur = navigation.addListener('blur', () => {
      pending = false;
      cancel();
    });
    const removeStart = navigation.addListener('transitionStart', () => cancel());
    const removeEnd = navigation.addListener('transitionEnd', ({ data }) => {
      if (!data.closing && pending && navigation.isFocused()) schedule(50);
    });
    if (pending) enter();
    return () => {
      pending = false;
      cancel();
      removeFocus();
      removeBlur();
      removeStart();
      removeEnd();
    };
  }, [navigation]);

  return titleRef;
}
