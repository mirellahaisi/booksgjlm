import AsyncStorage from '@react-native-async-storage/async-storage';

// SecureStore não existe no navegador. A senha nunca é persistida; somente
// o ID de sessão e os verificadores PBKDF2 ficam no armazenamento local.
export const secureSession = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: string) => AsyncStorage.removeItem(key),
};
