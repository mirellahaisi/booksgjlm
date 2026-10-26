import { Platform, StyleSheet } from 'react-native';

export const colors = {
  wine: '#6D1B2A',
  wineDark: '#3F0F18',
  gold: '#886324',
  cream: '#F8F2E8',
  paper: '#FFFFFF',
  sand: '#E9DDCB',
  ink: '#2C2522',
  muted: '#6B6059',
  error: '#A12929',
  blush: '#F5E5E5',
  green: '#346048',
  paleGreen: '#E5EFE8',
};

export const serif = Platform.select({ ios: 'Georgia', web: 'Georgia', default: 'serif' });

export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', padding: 20, gap: 20 },
  title: { fontFamily: serif, fontSize: 32, color: colors.wineDark },
  subtitle: { fontSize: 16, lineHeight: 24, color: colors.muted },
  eyebrow: { fontSize: 12, letterSpacing: 2, fontWeight: '700', color: colors.wine },
  sectionTitle: { fontFamily: serif, fontSize: 24, color: colors.wineDark },
  body: { fontSize: 16, lineHeight: 26, color: colors.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  panel: {
    backgroundColor: colors.paper,
    padding: 20,
    borderRadius: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.sand,
  },
});
