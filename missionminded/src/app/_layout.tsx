import { Stack } from 'expo-router';

import { ScriptureLoadingOverlay } from '@/components/scripture-loading-overlay';
import { AuthProvider, useAuth } from '@/data/auth';
import { MissionariesProvider } from '@/data/missionaries-context';
import { NotificationProvider } from '@/data/notification-context';

function RootStack() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="missionary/[id]" />
        <Stack.Screen name="link-missionary" />
        <Stack.Screen name="add-appointment" />
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
      <MissionariesProvider>
        <NotificationProvider>
          <RootStack />
          <ScriptureLoadingOverlay />
        </NotificationProvider>
      </MissionariesProvider>
    </AuthProvider>
  );
}
