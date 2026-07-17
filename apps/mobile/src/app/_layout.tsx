'use client';

import { ErrorBoundary } from "@/__create/ErrorBoundary";
import { useAuth } from "@/utils/auth/useAuth";
import { AuthModal } from "@/utils/auth/useAuthModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useWindowDimensions } from "react-native";

void SplashScreen.preventAutoHideAsync();

const SPLASH_TIMEOUT_MS = 10_000;

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

export default function RootLayout() {
    const { height } = useWindowDimensions(); // Gets exact device screen height
    const { initiate, isReady } = useAuth();
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        initiate();
    }, [initiate]);

    useEffect(() => {
        const timeout = setTimeout(() => setTimedOut(true), SPLASH_TIMEOUT_MS);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (isReady || timedOut) {
            void SplashScreen.hideAsync();
        }
    }, [isReady, timedOut]);

    if (!isReady && !timedOut) {
        return null;
    }

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                {/* FIX: The 'height' here is locked to the device's actual screen height.
                  This prevents the mobile browser's UI bars from causing the "slip" 
                  or "jump" effect when they expand or collapse.
                */}
                <GestureHandlerRootView style={{ flex: 1, height: height }}>
                    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
                        <Stack.Screen name="index" />
                    </Stack>
                    <AuthModal />
                </GestureHandlerRootView>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}