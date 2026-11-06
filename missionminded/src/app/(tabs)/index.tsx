import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText as Text } from '@/components/app-text';
import { PhaseTracker } from '@/components/phase-tracker';
import { useAuth } from '@/data/auth';
import { useMissionaries } from '@/data/missionaries';
import { getThoughtForToday, type MissionaryDetails } from '@/data/repository';
import { colors, spacing } from '@/theme/colors';

const thoughtForToday = getThoughtForToday();

function MissionaryCard({ missionary }: { missionary: MissionaryDetails }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/missionary/[id]', params: { id: missionary.id } })}
      accessibilityLabel={`${missionary.name}, ${missionary.status}. View journey.`}
      style={({ pressed }) => [styles.missionaryCard, pressed && styles.missionaryCardPressed]}>
      <View style={styles.missionaryHeading}>
        <View style={styles.missionaryCopy}>
          <Text style={styles.missionaryName}>{missionary.name}</Text>
          <Text style={styles.missionName}>
            {missionary.phase === 'preparing' ? 'Mission call on its way' : missionary.missionName}
          </Text>
        </View>
        <Text accessibilityElementsHidden style={styles.cardArrow}>›</Text>
      </View>
      <View style={styles.statusPill}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{missionary.status}</Text>
      </View>
      <View style={styles.trackerDivider} />
      <PhaseTracker phase={missionary.phase} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { missionaries } = useMissionaries();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark} accessibilityElementsHidden>
            <Text style={styles.brandMarkText}>M</Text>
          </View>
          <Text style={styles.brandName}>MissionMinded</Text>
        </View>

        <Text style={styles.greeting}>Hi, {user?.name ?? 'there'}.</Text>

        <View style={styles.thoughtCard}>
          <View style={styles.thoughtAccent} />
          <View style={styles.thoughtCopy}>
            <Text style={styles.sectionEyebrow}>THOUGHT FOR TODAY</Text>
            <Text style={styles.thoughtText}>“{thoughtForToday.text}”</Text>
            <Text style={styles.thoughtReference}>— {thoughtForToday.reference}</Text>
          </View>
        </View>

        <View style={styles.missionariesSection}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionEyebrow}>YOUR MISSIONARIES</Text>
            <Text style={styles.sectionCaption}>Following their journey</Text>
          </View>
          <View style={styles.cardList}>
            {missionaries.map((missionary) => (
              <MissionaryCard key={missionary.id} missionary={missionary} />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/link-missionary')}
            style={({ pressed }) => [styles.linkButton, pressed && styles.missionaryCardPressed]}>
            <Text style={styles.linkButtonText}>+ Link a missionary</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.navy,
  },
  brandMarkText: {
    color: colors.lightBlue,
    fontSize: 22,
    fontWeight: '800',
  },
  brandName: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '700',
  },
  greeting: {
    marginTop: -spacing.sm,
    color: colors.navy,
    fontSize: 27,
    fontWeight: '700',
  },
  thoughtCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D7E3EE',
    borderRadius: 16,
    backgroundColor: '#F5F9FC',
  },
  thoughtAccent: {
    width: 5,
    backgroundColor: colors.lightBlue,
  },
  thoughtCopy: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionEyebrow: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  thoughtText: {
    color: colors.navy,
    fontSize: 16,
    lineHeight: 24,
  },
  thoughtReference: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  missionariesSection: {
    gap: spacing.md,
  },
  sectionHeading: {
    gap: spacing.xs,
  },
  sectionCaption: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  cardList: {
    gap: spacing.md,
  },
  missionaryCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#D6DEE6',
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  missionaryHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  missionaryCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  cardArrow: {
    color: colors.navy,
    fontSize: 28,
    lineHeight: 28,
    marginTop: -4,
  },
  missionaryCardPressed: {
    opacity: 0.82,
  },
  missionaryName: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '700',
  },
  missionName: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F6FB',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.lightBlue,
  },
  statusText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '600',
  },
  linkButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.navy,
    borderRadius: 12,
  },
  linkButtonText: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '600',
  },
  trackerDivider: {
    height: 1,
    backgroundColor: '#E6EBF0',
  },
});
