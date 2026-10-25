import { Stack } from 'expo-router';

import { ScriptureLoadingOverlay } from '@/components/scripture-loading-overlay';
import { AuthProvider, useAuth } from '@/data/auth';

function RootStack() {
  const { user } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="missionary/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)/login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootStack />
      <ScriptureLoadingOverlay />
    </AuthProvider>
  );
}
