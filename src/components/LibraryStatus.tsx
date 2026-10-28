import { View, StyleSheet } from 'react-native';
import { Text } from './Typography';
import { useLibrary } from '../contexts/LibraryContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { ErrorBanner } from './Feedback';
import { colors } from '../theme';

export function LibraryStatus() {
  const library = useLibrary();
  const auth = useAuth();
  return (
    <View style={styles.container}>
      {library.saveError && <ErrorBanner message={library.saveError} onRetry={library.retrySave} />}
      {auth.error && (
        <ErrorBanner
          message={auth.error}
          onRetry={() => {
            void auth.logout();
          }}
        />
      )}
      {library.syncStatus === 'offline' && (
        <View style={styles.offline}>
          <Text accessibilityLiveRegion="polite" style={styles.text}>
            Seus livros estão salvos neste aparelho. A nuvem está indisponível
            {library.pendingCount ? `; ${library.pendingCount} alteração(ões) aguardam envio` : ''}.
          </Text>
          <Button
            label="Tentar novamente"
            variant="secondary"
            onPress={() => {
              void library.sync();
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 1120, alignSelf: 'center' },
  offline: { padding: 12, backgroundColor: colors.sand, gap: 8 },
  text: { color: colors.ink, fontSize: 14, lineHeight: 21 },
});
