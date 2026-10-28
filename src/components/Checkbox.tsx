import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from './Icon';
import { Text } from './Typography';
import { colors } from '../theme';
import { decorativeAccessibility } from '../utils/accessibility';

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Pressable
      accessible
      accessibilityLanguage="pt-BR"
      // UIKit reconhece switch e seu estado nativamente, sem as strings
      // "checkbox checked/unchecked" acrescentadas pelo React Native.
      accessibilityRole={Platform.OS === 'ios' ? 'switch' : 'checkbox'}
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      {...(Platform.OS === 'web' ? { 'aria-checked': checked } : {})}
      onPress={() => onChange(!checked)}
      style={styles.control}
    >
      <View style={styles.content} {...decorativeAccessibility} collapsable={false}>
        <Ionicons
          name={checked ? 'checkbox' : 'square-outline'}
          size={24}
          color={colors.wine}
          accessible={false}
        />
        <Text {...decorativeAccessibility} style={styles.label}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  control: { minHeight: 48, minWidth: 48, paddingVertical: 10, justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { flex: 1, minWidth: 0, color: colors.muted, fontSize: 14 },
});
