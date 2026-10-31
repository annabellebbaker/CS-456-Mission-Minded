import { useState } from 'react';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useAuth } from '@/data/auth';
import { useMissionaries } from '@/data/missionaries-context';
import { colors, spacing } from '@/theme/colors';

const initialSettings = {
  dailyThought: true,
  milestones: true,
  prayer: false,
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { missionaries } = useMissionaries();
  const [settings, setSettings] = useState(initialSettings);

  const toggleSetting = (key: keyof typeof initialSettings, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

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
          <View style={styles.divider} />
          <View style={styles.profileDetail}>
            <Text style={styles.detailLabel}>WARD AND STAKE</Text>
            <Text style={styles.mutedText}>Can be added later</Text>
          </View>
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
            <Text style={styles.sectionLabel}>REMINDERS</Text>
            <Text style={styles.mutedText}>These settings are saved for this session only.</Text>
          </View>
          <SettingRow
            label="Daily scripture thought"
            description="A gentle reminder to read the thought for today."
            value={settings.dailyThought}
            onChange={(value) => toggleSetting('dailyThought', value)}
          />
          <SettingRow
            label="Milestone reminders"
            description="Remember important moments in their journey."
            value={settings.milestones}
            onChange={(value) => toggleSetting('milestones', value)}
          />
          <SettingRow
            label="Prayer reminders"
            description="Make time to pray for your missionary."
            value={settings.prayer}
            onChange={(value) => toggleSetting('prayer', value)}
            last
          />
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

function SettingRow({
  label,
  description,
  value,
  onChange,
  last,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.settingRow, !last && styles.rowDivider]}>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{label}</Text>
        <Text style={styles.mutedText}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#C8D0D8', true: colors.lightBlue }}
        thumbColor={colors.white}
      />
    </View>
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
  divider: { height: 1, marginVertical: spacing.xs, backgroundColor: '#E5E9ED' },
  profileDetail: { gap: spacing.xs },
  detailLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  card: { gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 14 },
  sectionHeading: { gap: spacing.xs },
  missionaryRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  missionaryCopy: { flex: 1, gap: 2 },
  missionaryName: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  settingRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.sm },
  settingCopy: { flex: 1, gap: 2 },
  settingTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#E7EBEF' },
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
