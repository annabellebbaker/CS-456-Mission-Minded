import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText as Text } from '@/components/app-text';
import { MissionDetails } from '@/components/mission-details';
import { MissionaryPicker } from '@/components/missionary-picker';
import { useMissionaries } from '@/data/missionaries';
import { getPhaseLabel } from '@/data/repository';
import { colors, spacing } from '@/theme/colors';

export default function MissionaryTabScreen() {
  const { missionaries, getById, selectedId } = useMissionaries();
  const missionary = getById(selectedId) ?? missionaries[0];

  if (!missionary) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Missionary</Text>
          <Text style={styles.caption}>Link a missionary to see their mission details.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/link-missionary')} style={styles.dashedButton}>
            <Text style={styles.dashedButtonText}>+ Link a missionary</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const facts = [
    { label: 'PHASE', value: getPhaseLabel(missionary.phase, missionary.phase) },
    { label: 'SINCE', value: missionary.phaseSince || '—' },
    { label: 'LANGUAGE', value: missionary.language || '—' },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Missionary</Text>
        <MissionaryPicker />

        <View style={styles.headerCard}>
          <Text style={styles.eyebrowOnDark}>MISSION</Text>
          <Text style={styles.missionName}>{missionary.missionName}</Text>
          <Text style={styles.missionaryName}>{missionary.name}</Text>
          <View style={styles.factRow}>
            {facts.map((fact) => (
              <View key={fact.label} style={styles.fact}>
                <Text style={styles.factLabel}>{fact.label}</Text>
                <Text style={styles.factValue}>{fact.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.eyebrow}>MISSION DETAILS</Text>
        <MissionDetails missionary={missionary} />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/missionary/[id]', params: { id: missionary.id } })}
          style={({ pressed }) => [styles.journeyButton, pressed && styles.pressed]}>
          <Text style={styles.journeyButtonText}>View {missionary.firstName}&apos;s journey</Text>
          <Text accessibilityElementsHidden style={styles.journeyButtonText}>›</Text>
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
  caption: { color: colors.textSecondary, fontSize: 14 },
  headerCard: { gap: spacing.xs, padding: spacing.lg, borderRadius: 16, backgroundColor: colors.navy },
  eyebrowOnDark: { color: '#9FB6CC', fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  missionName: { color: colors.white, fontSize: 22, fontWeight: '700' },
  missionaryName: { color: '#C9D8E6', fontSize: 14 },
  factRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  fact: { flex: 1, gap: 2 },
  factLabel: { color: '#9FB6CC', fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  factValue: { color: colors.white, fontSize: 13, fontWeight: '600' },
  eyebrow: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  journeyButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 12,
  },
  journeyButtonText: { color: colors.navy, fontSize: 15, fontWeight: '700' },
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
  pressed: { opacity: 0.78 },
});
