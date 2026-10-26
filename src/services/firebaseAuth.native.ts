import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FirebaseAuth from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';

export function createFirebaseAuth(app: FirebaseApp) {
  // Este export existe no entrypoint React Native do SDK; a declaração pública
  // do Firebase usada pelo TypeScript apresenta somente o entrypoint web.
  const { getReactNativePersistence } = FirebaseAuth as typeof FirebaseAuth & {
    getReactNativePersistence: (storage: typeof AsyncStorage) => FirebaseAuth.Persistence;
  };
  return FirebaseAuth.initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}
