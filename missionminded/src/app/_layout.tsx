import { Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ScriptureLoadingOverlay } from '@/components/scripture-loading-overlay';
import { AuthProvider, useAuth } from '@/data/auth';
import { MissionariesProvider } from '@/data/missionaries-context';
import { NotificationProvider } from '@/data/notification-context';
import { colors } from '@/theme/colors';

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

/** In the browser, show the app inside a phone-sized frame so it previews like the mobile app. */
function PhoneFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') return children;

  return (
    <View style={styles.webBackdrop}>
      <View style={styles.phone}>{children}</View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MissionariesProvider>
        <NotificationProvider>
          <PhoneFrame>
            <RootStack />
            <ScriptureLoadingOverlay />
          </PhoneFrame>
        </NotificationProvider>
      </MissionariesProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EEF3',
  },
  phone: {
    width: '100%',
    maxWidth: 400,
    height: '100%',
    maxHeight: 860,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 28,
    backgroundColor: colors.white,
  },
});
