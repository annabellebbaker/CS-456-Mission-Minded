import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/data/auth';
import { useMissionaries } from '@/data/missionaries-context';
import { useNotifications } from '@/data/notification-context';
import { colors, spacing } from '@/theme/colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { missionaries } = useMissionaries();
  const { status: notificationStatus, enableNotifications } = useNotifications();
  const notificationsEnabled = notificationStatus === 'enabled';
  const notificationsUnavailable = notificationStatus === 'unavailable';
  const notificationButtonLabel = notificationsEnabled
    ? 'Notifications enabled'
    : notificationsUnavailable
      ? 'Available in the iOS app'
      : notificationStatus === 'checking'
        ? 'Checking notification access…'
        : notificationStatus === 'error'
          ? 'Try again'
          : 'Enable push notifications';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.brand}>MissionMinded</Text>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.supporterCard}>
          <Text style={styles.sectionLabel}>YOUR PROFILE</Text>
          <Text style={styles.supporterName}>{user?.name ?? 'Supporter'}</Text>
          <Text style={styles.mutedText}>{user?.email ?? 'Signed in'}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionLabel}>MISSIONARIES I SUPPORT</Text>
            <Text style={styles.mutedText}>Your relationships and linked journeys</Text>
          </View>
          {missionaries.length ? missionaries.map((missionary, index) => (
            <View key={missionary.id} style={[styles.missionaryRow, index > 0 && styles.rowDivider]}>
              <View style={styles.missionaryCopy}>
                <Text style={styles.missionaryName}>{missionary.name}</Text>
                <Text style={styles.mutedText}>{missionary.relationship || 'Relationship can be added later'}</Text>
              </View>
            </View>
          )) : (
            <Text style={styles.mutedText}>Link a missionary to see them here.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionLabel}>PUSH NOTIFICATIONS</Text>
            <Text style={styles.settingTitle}>Appointments and milestones</Text>
            <Text style={styles.mutedText}>Get a heads-up one day before an appointment and when a milestone is coming up.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: notificationsEnabled || notificationsUnavailable || notificationStatus === 'checking',
            }}
            disabled={notificationsEnabled || notificationsUnavailable || notificationStatus === 'checking'}
            onPress={() => void enableNotifications()}
            style={({ pressed }) => [
              styles.notificationButton,
              (notificationsEnabled || notificationsUnavailable || notificationStatus === 'checking') && styles.notificationButtonDisabled,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.notificationButtonText, (notificationsEnabled || notificationsUnavailable || notificationStatus === 'checking') && styles.notificationButtonTextDisabled]}>
              {notificationButtonLabel}
            </Text>
          </Pressable>
          <Text style={styles.mutedText}>
            {notificationsEnabled
              ? 'This device will remind you one day before appointments and milestones with dates. These are on-device notifications; shared remote alerts need a server.'
              : notificationsUnavailable
                ? 'Enable this from an iOS development build. The browser preview does not support native notifications.'
                : notificationStatus === 'denied'
                  ? 'Allow notifications in iOS Settings if permission was denied earlier.'
                  : 'On-device reminders are scheduled one day before appointments and milestones with dates.'}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/link-missionary' as Href)}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
            <Text style={styles.linkText}>Link a missionary</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={signOut}
            style={({ pressed }) => [styles.actionButton, styles.logOutButton, pressed && styles.pressed]}>
            <Text style={styles.linkText}>Log out</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.lg },
  heading: { gap: spacing.xs },
  brand: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  title: { color: colors.navy, fontSize: 27, fontWeight: '700' },
  supporterCard: { gap: spacing.sm, padding: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 14 },
  sectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  supporterName: { color: colors.navy, fontSize: 20, fontWeight: '700' },
  mutedText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  card: { gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 14 },
  sectionHeading: { gap: spacing.xs },
  missionaryRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  rowDivider: { borderTopWidth: 1, borderTopColor: '#E7EBEF' },
  missionaryCopy: { flex: 1, gap: 2 },
  missionaryName: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  settingTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  notificationButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: 9, backgroundColor: colors.navy },
  notificationButtonDisabled: { backgroundColor: '#E8EEF3' },
  notificationButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  notificationButtonTextDisabled: { color: colors.navy },
  actions: { width: '100%', gap: spacing.sm },
  actionButton: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 10,
    backgroundColor: '#F0F6FB',
  },
  logOutButton: { backgroundColor: colors.white },
  linkText: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.78 },
});
