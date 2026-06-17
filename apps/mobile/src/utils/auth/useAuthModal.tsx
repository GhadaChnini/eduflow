'use client';

import React from 'react';
import { Modal, Text, View } from 'react-native';
import { AuthWebView } from './AuthWebView';
import { useAuthModal, useAuthStore } from './store';

export { useAuthModal } from './store';

export const AuthModal = () => {
  const { auth } = useAuthStore();
  const { isOpen, mode } = useAuthModal();

  const proxyURL = process.env.EXPO_PUBLIC_PROXY_BASE_URL;
  const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
  if (!proxyURL || !baseURL) {
    const missing = [
      !proxyURL && 'EXPO_PUBLIC_PROXY_BASE_URL',
      !baseURL && 'EXPO_PUBLIC_BASE_URL',
    ]
      .filter(Boolean)
      .join(', ');
    console.error(
      `AuthModal: missing required env var(s): ${missing}. Auth cannot open.`
    );
    return (
      <Modal
        visible={isOpen && !auth}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 items-center justify-center bg-white p-[24px]">
          <Text className="mb-[8px] text-[18px] font-semibold">
            Auth is not configured
          </Text>
          <Text className="text-center text-[14px] text-gray-600">
            Missing environment variable{missing.includes(',') ? 's' : ''}:{' '}
            {missing}. Set {missing.includes(',') ? 'them' : 'it'} in your .env
            and restart the app.
          </Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isOpen && !auth} animationType="slide" presentationStyle='pageSheet'>
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100%',
          width: '100%',
          backgroundColor: '#fff',
          padding: 0,
        }}
      >
        <AuthWebView
          mode={mode}
          proxyURL={proxyURL}
          baseURL={baseURL}
        />
      </View>
    </Modal>
  );
};

export default useAuthModal;