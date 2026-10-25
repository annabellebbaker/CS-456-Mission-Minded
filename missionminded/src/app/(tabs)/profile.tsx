import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TabPlaceholder } from '@/components/tab-placeholder';
import { useAuth } from '@/data/auth';
import { colors, spacing } from '@/theme/colors';

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.screen}>
      <TabPlaceholder title="Profile" />
      <Pressable
        accessibilityRole="button"
        onPress={signOut}
        style={({ pressed }) => [styles.logOutButton, pressed && styles.pressed]}>
        <Text style={styles.logOutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  logOutButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 10,
    backgroundColor: '#F0F6FB',
  },
  logOutText: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
