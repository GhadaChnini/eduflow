import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect } from 'react';
import { authKey, type Auth, secureStoreOptions, useAuthModal, useAuthStore } from './store';

interface UseAuthReturn {
  isReady: boolean;
  isAuthenticated: boolean | null;
  signIn: () => void;
  signOut: () => void;
  signUp: () => void;
  teacherSignIn: () => void; // 🚀 Added native function interface
  auth: Auth | null;
  setAuth: (auth: Auth | null) => void;
  initiate: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const { isReady, auth, setAuth } = useAuthStore();
  const { isOpen: _isOpen, close, open } = useAuthModal();

  const initiate = useCallback(() => {
    Promise.race<string | null>([
      SecureStore.getItemAsync(authKey, secureStoreOptions),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ])
      .then((authString) => {
        useAuthStore.setState({
          auth: authString ? (JSON.parse(authString) as Auth) : null,
          isReady: true,
        });
      })
      .catch(() => {
        useAuthStore.setState({ auth: null, isReady: true });
      });
  }, []);

  useEffect(() => {}, []);

  const signIn = useCallback(() => {
    // @ts-ignore
    global.authPathOverride = '/account/signin'; // 🌟 Route path for standard students
    open({ mode: 'signin' });
  }, [open]);

  const signUp = useCallback(() => {
    // @ts-ignore
    global.authPathOverride = '/account/signup';
    open({ mode: 'signup' });
  }, [open]);

  // 🚀 New native function called directly by your teacher dashboard button
  const teacherSignIn = useCallback(() => {
    // @ts-ignore
    global.authPathOverride = '/teacher'; // 🌟 Explicit path for separate teacher module
    open({ mode: 'signin' });
  }, [open]);

  const signOut = useCallback(() => {
    setAuth(null);
    close();
  }, [close, setAuth]);

  return {
    isReady,
    isAuthenticated: isReady ? !!auth : null,
    signIn,
    signOut,
    signUp,
    teacherSignIn, // 🚀 Exposed natively
    auth,
    setAuth,
    initiate,
  };
};

interface UseRequireAuthOptions {
  mode?: 'signup' | 'signin';
}

export const useRequireAuth = (options?: UseRequireAuthOptions): UseAuthReturn => {
  const authReturn = useAuth();
  const { open } = useAuthModal();

  useEffect(() => {
    if (!authReturn.isAuthenticated && authReturn.isReady) {
      open({ mode: options?.mode });
    }
  }, [authReturn.isAuthenticated, open, options?.mode, authReturn.isReady]);

  return authReturn;
};

export default useAuth;