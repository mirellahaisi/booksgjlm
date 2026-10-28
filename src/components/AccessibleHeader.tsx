import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Button } from './Button';
import { Text } from './Typography';
import { colors } from '../theme';
import { usePageFocus } from '../hooks/usePageFocus';

// O header nativo limita o título a uma linha. Aqui a altura acompanha o texto;
// títulos excepcionalmente longos continuam acessíveis por rolagem.
export function AccessibleHeader({ navigation, options, route, back }: NativeStackHeaderProps) {
  const { height } = useWindowDimensions();
  const titleRef = usePageFocus(navigation);
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView style={{ maxHeight: height * 0.35 }} contentContainerStyle={styles.content}>
        <Text
          ref={titleRef}
          accessible
          accessibilityRole="header"
          {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
          style={styles.title}
        >
          {options.title ?? route.name}
        </Text>
        {back && (
          <View style={styles.back}>
            <Button
              label="Voltar"
              accessibilityLabel={
                back.title ? `Voltar para ${back.title}` : 'Voltar à página anterior'
              }
              icon="arrow-back"
              variant="secondary"
              onPress={navigation.goBack}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.wine },
  content: { paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  back: { alignItems: 'flex-start' },
  title: { fontSize: 20, fontWeight: '700', color: colors.paper },
});
