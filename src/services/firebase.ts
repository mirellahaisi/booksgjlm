import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { createFirebaseAuth } from './firebaseAuth';
import { UserError } from '../utils/text';

export const cloudEnabled = process.env.EXPO_PUBLIC_USE_FIREBASE === 'true';
let client: ReturnType<typeof initializeClient> | null = null;

function initializeClient() {
  const options = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  if (Object.values(options).some((value) => !value?.trim())) {
    throw new UserError(
      'O Firebase está ativado, mas faltam variáveis de configuração. Confira o arquivo .env.',
    );
  }
  const app = initializeApp(options, 'gjlm-books');
  return { auth: createFirebaseAuth(app), db: getFirestore(app) };
}

export function getFirebase() {
  if (!cloudEnabled) throw new Error('Firebase não está habilitado.');
  client ??= initializeClient();
  return client;
}
