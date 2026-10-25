import { Stack } from 'expo-router';

import { ScriptureLoadingOverlay } from '@/components/scripture-loading-overlay';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="index" />
      </Stack>
      <ScriptureLoadingOverlay />
    </>
  );
}
