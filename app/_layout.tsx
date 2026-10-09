import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { APP_FONTS } from '../src/fonts';
import { theme } from '../src/theme';

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
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.colors.background },
        }}>
        <Stack.Screen name="index" options={{ title: 'CaptionAI' }} />
        <Stack.Screen name="player" options={{ title: 'Player' }} />
        <Stack.Screen name="editor" options={{ title: 'Caption Editor' }} />
        <Stack.Screen name="export" options={{ title: 'Export' }} />
      </Stack>
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
