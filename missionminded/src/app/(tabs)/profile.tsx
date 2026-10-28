import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TabPlaceholder } from '@/components/tab-placeholder';
import { useAuth } from '@/data/auth';
import { colors, spacing } from '@/theme/colors';

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.screen}>
      <TabPlaceholder title="Profile" />
      <Link href={'/link-missionary' as Href} asChild>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
          <Text style={styles.linkText}>Link a missionary</Text>
        </Pressable>
      </Link>
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
  linkButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 10,
    backgroundColor: '#F0F6FB',
  },
  linkText: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  logOutText: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
