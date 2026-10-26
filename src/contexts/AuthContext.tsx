import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import type { SessionUser } from '../types';
import {
  loginLocal,
  logoutLocal,
  registerLocal,
  restoreLocalSession,
  validateCredentials,
} from '../services/localAuth';
import { cloudEnabled, getFirebase } from '../services/firebase';
import { errorMessage } from '../utils/text';

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  bootError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  retry: () => void;
}
const AuthContext = createContext<AuthState | undefined>(undefined);
const fromFirebase = (user: User): SessionUser => ({
  id: user.uid,
  name: user.displayName || user.email?.split('@')[0] || 'Leitor',
  email: user.email || '',
  provider: 'firebase',
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const locked = useRef(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const failed = (reason: unknown) => {
      if (active) {
        setBootError(
          errorMessage(reason, 'Não foi possível restaurar sua sessão. Tente novamente.'),
        );
        setLoading(false);
      }
    };
    try {
      if (cloudEnabled) {
        unsubscribe = onAuthStateChanged(
          getFirebase().auth,
          (current) => {
            if (active) {
              setUser(current ? fromFirebase(current) : null);
              setLoading(false);
            }
          },
          failed,
        );
      } else {
        restoreLocalSession()
          .then((current) => {
            if (active) {
              setUser(current);
              setLoading(false);
            }
          })
          .catch(failed);
      }
    } catch (reason) {
      failed(reason);
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [attempt]);

  const authenticate = async (email: string, password: string, name?: string) => {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      validateCredentials(email, password, name);
      if (cloudEnabled) {
        const auth = getFirebase().auth;
        const result =
          name === undefined
            ? await signInWithEmailAndPassword(auth, email.trim(), password)
            : await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name !== undefined) await updateProfile(result.user, { displayName: name.trim() });
        setUser(fromFirebase(result.user));
      } else {
        setUser(
          name === undefined
            ? await loginLocal(email, password)
            : await registerLocal(name, email, password),
        );
      }
      return true;
    } catch (reason) {
      setError(errorMessage(reason, 'Não foi possível acessar sua conta. Tente novamente.'));
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  const logout = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      if (cloudEnabled) await signOut(getFirebase().auth);
      else await logoutLocal();
      setUser(null);
    } catch {
      setError('Não foi possível sair da conta. Tente novamente.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        busy,
        error,
        bootError,
        clearError,
        logout,
        login: (email, password) => authenticate(email, password),
        register: (name, email, password) => authenticate(email, password, name),
        retry: () => {
          setLoading(true);
          setBootError(null);
          setAttempt((value) => value + 1);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve estar dentro de AuthProvider.');
  return context;
}
