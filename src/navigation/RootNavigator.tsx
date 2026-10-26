import { View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { LibraryProvider, useLibrary } from '../contexts/LibraryContext';
import { AuthScreen } from '../screens/AuthScreen';
import { CatalogScreen } from '../screens/CatalogScreen';
import { CollectionScreen } from '../screens/CollectionScreen';
import { DetailsScreen } from '../screens/DetailsScreen';
import { EmptyState, Loading } from '../components/Feedback';
import { LibraryStatus } from '../components/LibraryStatus';
import { Button } from '../components/Button';
import { colors, common } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.wine,
    background: colors.cream,
    card: colors.wine,
    text: colors.ink,
    border: colors.sand,
  },
};
function AppStack() {
  const library = useLibrary();
  const auth = useAuth();
  if (library.loading)
    return (
      <View style={common.screen}>
        <Loading label="Preparando sua biblioteca…" />
      </View>
    );
  if (library.loadError)
    return (
      <SafeAreaView style={common.screen}>
        <EmptyState
          error
          title="Sua biblioteca precisa de atenção"
          message={library.loadError}
          onAction={library.retryLoad}
        />
        <Button
          label="Sair da conta"
          variant="quiet"
          onPress={() => {
            void auth.logout();
          }}
        />
      </SafeAreaView>
    );
  return (
    <View style={common.screen}>
      <LibraryStatus />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.wine },
          headerTintColor: colors.paper,
          headerBackTitle: 'Voltar',
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="Catalog" component={CatalogScreen} options={{ title: 'GJLM Books' }} />
        <Stack.Screen
          name="Favorites"
          component={CollectionScreen}
          options={{ title: 'Meus favoritos' }}
        />
        <Stack.Screen
          name="ReadBooks"
          component={CollectionScreen}
          options={{ title: 'Livros lidos' }}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={{ title: 'Detalhes do livro' }}
        />
      </Stack.Navigator>
    </View>
  );
}
export function RootNavigator() {
  const auth = useAuth();
  if (auth.loading)
    return (
      <SafeAreaView style={common.screen}>
        <Loading label="Abrindo sua estante…" />
      </SafeAreaView>
    );
  if (auth.bootError)
    return (
      <SafeAreaView style={common.screen}>
        <EmptyState
          error
          title="Não foi possível iniciar"
          message={auth.bootError}
          onAction={auth.retry}
        />
      </SafeAreaView>
    );
  return (
    <NavigationContainer theme={theme}>
      {auth.user ? (
        <LibraryProvider key={`${auth.user.provider}:${auth.user.id}`} user={auth.user}>
          <AppStack />
        </LibraryProvider>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={AuthScreen} />
          <Stack.Screen name="Register" component={AuthScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
