
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export const authKey = `${process.env.EXPO_PUBLIC_PROJECT_GROUP_ID}-jwt`;


export const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: 'anything-auth',
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  requireAuthentication: false,
};

export interface User {
	id: string;
	email: string;
	name: string;
	image: string;
}

export interface Auth {
	jwt: string;
	user: User;
}

interface AuthState {
	isReady: boolean;
	auth: Auth | null;
	setAuth: (auth: Auth | null) => void;
}

/**
 * This store manages the authentication state of the application.
 */
export const useAuthStore = create<AuthState>((set) => ({
  isReady: false,
  auth: null,
  setAuth: (auth) => {
    if (auth) {
      SecureStore.setItemAsync(
        authKey,
        JSON.stringify(auth),
        secureStoreOptions,
      ).catch(() => {
        // Swallow Keychain write errors — the app remains in-memory authed
        // for this session and the next launch will re-auth via the WebView.
        // Throwing here would propagate into the unhandled-rejection /
        // TurboModule rethrow path and crash on iOS 26.x.
      });
    } else {
      SecureStore.deleteItemAsync(authKey, secureStoreOptions).catch(() => {});
    }
    set({ auth });
  },
}));

interface AuthModalState {
	isOpen: boolean;
	mode: 'signup' | 'signin';
	open: (options?: { mode?: 'signup' | 'signin' }) => void;
	close: () => void;
}

/**
 * This store manages the state of the authentication modal.
 */
export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: 'signup',
  open: (options) => set({ isOpen: true, mode: options?.mode || 'signup' }),
  close: () => set({ isOpen: false }),
}));
