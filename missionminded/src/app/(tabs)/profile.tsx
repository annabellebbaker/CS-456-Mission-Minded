import { useState } from 'react';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText as Text } from '@/components/app-text';
import { useAuth } from '@/data/auth';
import { useMissionaries } from '@/data/missionaries';
import { colors, spacing } from '@/theme/colors';

// Toggles only change saved settings for now. No real notifications yet (see spec Open Decisions).
const reminderSettings = ['Phase reminders', 'Prayer reminders'];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { missionaries } = useMissionaries();
  const [settings, setSettings] = useState<Record<string, boolean>>({
    'Phase reminders': true,
    'Prayer reminders': false,
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Profile</Text>

        <View style={styles.supporterCard}>
          <View style={styles.avatar} accessibilityElementsHidden>
            <Text style={styles.avatarText}>{user?.name.charAt(0) ?? '?'}</Text>
          </View>
          <View style={styles.supporterCopy}>
            <Text style={styles.supporterName}>{user?.name}</Text>
            <Text style={styles.mutedText}>Missionary supporter · {user?.ward}</Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>MISSIONARIES I SUPPORT</Text>
        <View style={styles.listCard}>
          {missionaries.map((missionary, index) => (
            <Pressable
              key={missionary.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/missionary/[id]', params: { id: missionary.id } })}
              style={({ pressed }) => [
                styles.listRow,
                index < missionaries.length - 1 && styles.divider,
                pressed && styles.pressed,
              ]}>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{missionary.name}</Text>
                <Text style={styles.mutedText}>My relationship: {missionary.relationship}</Text>
              </View>
              <Text accessibilityElementsHidden style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/link-missionary')}
          style={({ pressed }) => [styles.dashedButton, pressed && styles.pressed]}>
          <Text style={styles.dashedButtonText}>+ Link a missionary</Text>
        </Pressable>

        <Text style={styles.eyebrow}>SETTINGS</Text>
        <View style={styles.listCard}>
          {reminderSettings.map((label, index) => (
            <View key={label} style={[styles.listRow, index < reminderSettings.length - 1 && styles.divider]}>
              <Text style={[styles.rowTitle, styles.rowCopy]}>{label}</Text>
              <Switch
                accessibilityLabel={label}
                value={settings[label]}
                onValueChange={(value) => setSettings((current) => ({ ...current, [label]: value }))}
                trackColor={{ false: '#CCD5DE', true: colors.lightBlue }}
                thumbColor={colors.white}
                {...(Platform.OS === 'web' && { activeThumbColor: colors.navy })}
              />
            </View>
          ))}
        </View>

        <Pressable accessibilityRole="button" onPress={signOut} style={({ pressed }) => [styles.logOutButton, pressed && styles.pressed]}>
          <Text style={styles.logOutText}>Log out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.md },
  pageTitle: { color: colors.navy, fontSize: 27, fontWeight: '700' },
  supporterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: '#F5F9FC',
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.navy,
  },
  avatarText: { color: colors.lightBlue, fontSize: 22, fontWeight: '800' },
  supporterCopy: { flex: 1, gap: 2 },
  supporterName: { color: colors.navy, fontSize: 18, fontWeight: '700' },
  mutedText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  eyebrow: { marginTop: spacing.sm, color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  listCard: { paddingHorizontal: spacing.md, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 16 },
  listRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: '#E7EBEF' },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  chevron: { color: colors.navy, fontSize: 24 },
  dashedButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.navy,
    borderRadius: 12,
  },
  dashedButtonText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  logOutButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 10,
    backgroundColor: '#F0F6FB',
  },
  logOutText: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
