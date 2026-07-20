'use client';

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { useAuthStore } from './store';
import * as ImagePicker from 'expo-image-picker';

const callbackUrl = '/api/auth/token';
const callbackQueryString = `callbackUrl=${callbackUrl}`;

const allowedOrigin = (() => {
  const raw = process.env.EXPO_PUBLIC_PROXY_BASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
})();

interface AuthWebViewProps {
  mode: 'signup' | 'signin';
  proxyURL: string;
  baseURL: string;
}

export const AuthWebView = ({ mode, proxyURL, baseURL }: AuthWebViewProps) => {
// Replace that line with this:
const chosenPath = (global as any).authPathOverride || `/account/${mode}`;
  const [currentURI, setURI] = useState(`${baseURL}${chosenPath}?${callbackQueryString}`);
  const { auth, setAuth, isReady } = useAuthStore();
  const isAuthenticated = isReady ? !!auth : null;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        
        if (libraryStatus.status !== 'granted' || cameraStatus.status !== 'granted') {
          console.warn('Permissions for camera or photo library were denied by the user.');
        }
      })();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (isAuthenticated) router.back();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) return;
    setURI(`${baseURL}${chosenPath}?${callbackQueryString}`);
  }, [mode, baseURL, isAuthenticated, chosenPath]);

  if (Platform.OS === 'web') {
    return (
      <iframe
        ref={iframeRef}
        title="Authentication"
        src={`${proxyURL}${chosenPath}?callbackUrl=/api/auth/expo-web-success`}
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    );
  }

  return (
    <WebView
      sharedCookiesEnabled
      originWhitelist={['*']}
      allowFileAccess={true}
      allowUniversalAccessFromFileURLs={true}
      domStorageEnabled={true}
      javaScriptEnabled={true}
      onFileDownload={({ nativeEvent: { downloadUrl } }) => console.log(downloadUrl)}
      source={{ uri: currentURI }}
      headers={{
        'x-createxyz-project-group-id': process.env.EXPO_PUBLIC_PROJECT_GROUP_ID!,
        host: process.env.EXPO_PUBLIC_HOST!,
        'x-forwarded-host': process.env.EXPO_PUBLIC_HOST!,
        'x-createxyz-host': process.env.EXPO_PUBLIC_HOST!,
      }}
      style={{ flex: 1 }}
    />
  );
};