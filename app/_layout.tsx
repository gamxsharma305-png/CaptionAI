import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { APP_FONTS } from '../src/fonts';
import { isOnboarded } from '../src/services/keys';
import { theme } from '../src/theme';

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    isOnboarded().then((done) => {
      setReady(true);
      if (!done && segments[0] !== 'setup') {
        router.replace('/setup');
      }
    });
  }, []);

  useEffect(() => {
    // If the user clears their keys mid-session, bounce them back to setup.
    if (ready && segments[0] !== 'setup') {
      isOnboarded().then((done) => {
        if (!done) router.replace('/setup');
      });
    }
  }, [segments]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded] = useFonts(APP_FONTS);

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <OnboardingGate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: theme.colors.background },
          }}>
          <Stack.Screen name="index" options={{ title: 'CaptionAI' }} />
          <Stack.Screen name="setup" options={{ title: 'API Keys', headerShown: false }} />
          <Stack.Screen name="player" options={{ title: 'Player' }} />
          <Stack.Screen name="editor" options={{ title: 'Caption Editor' }} />
          <Stack.Screen name="export" options={{ title: 'Export' }} />
          <Stack.Screen name="reel" options={{ title: 'Reel Studio' }} />
        </Stack>
      </OnboardingGate>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
