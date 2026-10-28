import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '../components/Icon';
import type { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/Feedback';
import { colors, common, serif } from '../theme';
import { Text, TextInput } from '../components/Typography';
import { decorativeAccessibility, selectionAccessibilityState } from '../utils/accessibility';
import { announce } from '../utils/announce';
import { usePageFocus } from '../hooks/usePageFocus';

export function AuthScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'Login' | 'Register'>) {
  const register = route.name === 'Register';
  const titleRef = usePageFocus(navigation);
  const auth = useAuth();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 850 && fontScale < 1.4;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { clearError } = auth;
  useEffect(() => {
    clearError();
  }, [route.name, clearError]);

  const submit = async () => {
    setLocalError(null);
    if (register && confirmation !== password) {
      setLocalError('As senhas precisam ser iguais.');
      return;
    }
    if (register) await auth.register(name, email, password);
    else await auth.login(email, password);
  };

  return (
    <SafeAreaView style={common.screen}>
      <KeyboardAvoidingView
        style={common.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={[styles.layout, wide && styles.wide]}>
            <View style={[styles.intro, wide ? { flex: 1 } : { padding: 24, gap: 14 }]}>
              <View style={styles.brand}>
                <Ionicons name="book-outline" size={28} color={colors.paper} accessible={false} />
                <Text style={styles.brandText}>
                  GJLM <Text style={{ fontWeight: '400' }}>Books</Text>
                </Text>
              </View>
              {wide && <Text style={styles.eyebrow}>UM NOVO CAPÍTULO, TODOS OS DIAS</Text>}
              <Text accessibilityRole="header" style={[styles.headline, !wide && { fontSize: 26 }]}>
                {wide
                  ? 'A sua próxima\nhistória começa\naqui.'
                  : 'Sua próxima história começa aqui.'}
              </Text>
              {wide && (
                <>
                  <Text style={styles.introText}>
                    Descubra livros, guarde seus favoritos e faça de cada leitura uma lembrança.
                  </Text>
                  <View style={styles.feature}>
                    <Ionicons name="heart-outline" color="#E9DDCB" size={22} accessible={false} />
                    <Text style={styles.introText}>Uma estante com a sua personalidade.</Text>
                  </View>
                  <Text style={styles.source}>CATÁLOGO ABERTO · OPEN LIBRARY</Text>
                </>
              )}
            </View>
            <View style={[styles.form, wide && { flex: 1 }]}>
              <Text style={common.eyebrow}>SUA ESTANTE PESSOAL</Text>
              <Text
                ref={titleRef}
                accessible
                accessibilityRole="header"
                accessibilityLabel={
                  register ? 'Criar conta. Comece sua coleção.' : 'Entrar na conta. Que bom te ver.'
                }
                {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
                style={common.title}
              >
                {register ? 'Comece sua coleção.' : 'Que bom te ver.'}
              </Text>
              <Text style={common.subtitle}>
                {register
                  ? 'Crie sua conta e encontre sua próxima leitura.'
                  : 'Entre para continuar suas descobertas.'}
              </Text>
              {register && (
                <View style={styles.field}>
                  <Text style={styles.label}>Seu nome</Text>
                  <TextInput
                    accessible
                    accessibilityLabel="Seu nome"
                    autoComplete="name"
                    textContentType="name"
                    maxLength={60}
                    value={name}
                    onChangeText={setName}
                    editable={!auth.busy}
                    placeholder="Como podemos te chamar?"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                </View>
              )}
              <View style={styles.field}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  accessible
                  accessibilityLabel="E-mail"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={254}
                  value={email}
                  onChangeText={setEmail}
                  editable={!auth.busy}
                  placeholder="voce@exemplo.com"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text {...decorativeAccessibility} style={styles.label}>
                  Senha · mínimo 8 caracteres
                </Text>
                <View style={styles.password}>
                  <TextInput
                    accessible
                    accessibilityLabel="Senha, no mínimo 8 caracteres"
                    autoComplete={register ? 'new-password' : 'current-password'}
                    textContentType={register ? 'newPassword' : 'password'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!visible}
                    maxLength={128}
                    value={password}
                    onChangeText={setPassword}
                    editable={!auth.busy}
                    onSubmitEditing={() => {
                      if (!register) void submit();
                    }}
                    returnKeyType="go"
                    placeholder={register ? 'Crie sua senha' : 'Digite sua senha'}
                    placeholderTextColor={colors.muted}
                    style={[styles.input, styles.passwordInput]}
                  />
                  <Pressable
                    accessible
                    accessibilityLanguage="pt-BR"
                    accessibilityRole="button"
                    accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
                    accessibilityState={selectionAccessibilityState(visible)}
                    {...(Platform.OS === 'web' ? { 'aria-pressed': visible } : {})}
                    onPress={() => {
                      setVisible(!visible);
                      announce(visible ? 'Senha oculta.' : 'Senha visível.');
                    }}
                    style={styles.eye}
                  >
                    <Ionicons
                      name={visible ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={colors.wine}
                      accessible={false}
                    />
                  </Pressable>
                </View>
              </View>
              {register && (
                <View style={styles.field}>
                  <Text style={styles.label}>Confirme a senha</Text>
                  <TextInput
                    accessible
                    accessibilityLabel="Confirme a senha"
                    autoComplete="new-password"
                    autoCapitalize="none"
                    secureTextEntry={!visible}
                    maxLength={128}
                    value={confirmation}
                    onChangeText={setConfirmation}
                    editable={!auth.busy}
                    onSubmitEditing={() => {
                      void submit();
                    }}
                    returnKeyType="go"
                    style={styles.input}
                  />
                </View>
              )}
              {(localError || auth.error) && (
                <ErrorBanner
                  message={localError ?? auth.error!}
                  onRetry={() => {
                    void submit();
                  }}
                />
              )}
              <Button
                label={
                  auth.busy
                    ? 'Só um instante…'
                    : register
                      ? 'Criar minha conta'
                      : 'Entrar na minha estante'
                }
                icon="arrow-forward"
                loading={auth.busy}
                onPress={() => {
                  void submit();
                }}
              />
              <View style={styles.divider} />
              <Text style={[common.subtitle, { textAlign: 'center' }]}>
                {register ? 'Já tem uma conta?' : 'Seu primeiro capítulo por aqui?'}
              </Text>
              <Button
                label={register ? 'Entrar' : 'Criar uma conta'}
                variant="secondary"
                disabled={auth.busy}
                onPress={() => {
                  setPassword('');
                  setConfirmation('');
                  if (register) navigation.goBack();
                  else navigation.navigate('Register');
                }}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  layout: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  wide: { flexDirection: 'row' },
  intro: { backgroundColor: colors.wineDark, padding: 32, gap: 24, justifyContent: 'center' },
  brand: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  brandText: { color: colors.paper, fontFamily: serif, fontSize: 28, fontWeight: '700' },
  eyebrow: { fontSize: 11, color: '#E9DDCB', letterSpacing: 1.5, marginTop: 24 },
  headline: { color: colors.cream, fontFamily: serif, fontSize: 42 },
  introText: { color: '#E9DDCB', fontSize: 16, lineHeight: 25, flexShrink: 1 },
  feature: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#81505A',
    paddingTop: 24,
  },
  source: { color: '#E9DDCB', fontSize: 10, letterSpacing: 2 },
  form: { padding: 20, gap: 18, justifyContent: 'center', minWidth: 0 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  input: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: 10,
    minHeight: 52,
    padding: 14,
    color: colors.ink,
    fontSize: 16,
  },
  password: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  passwordInput: { flex: 1, minWidth: 0 },
  eye: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.sand, marginTop: 6 },
});
