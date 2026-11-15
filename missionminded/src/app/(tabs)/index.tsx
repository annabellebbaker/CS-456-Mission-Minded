import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText as Text } from '@/components/app-text';
import { useMissionaries } from '@/data/missionaries';
import type { MissionaryDetails } from '@/data/repository';
import { colors, spacing } from '@/theme/colors';

function MissionaryCard({ missionary }: { missionary: MissionaryDetails }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/missionary/[id]', params: { id: missionary.id } })}
      accessibilityLabel={`${missionary.name}. View details.`}
      style={({ pressed }) => [styles.missionaryCard, pressed && styles.missionaryCardPressed]}>
      <View style={styles.missionaryHeading}>
        <View style={styles.missionaryCopy}>
          <Text style={styles.missionaryName}>{missionary.name}</Text>
          <Text style={styles.missionName}>
            {missionary.missionName}
          </Text>
        </View>
        <Text accessibilityElementsHidden style={styles.cardArrow}>›</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { missionaries } = useMissionaries();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.brandHeader}>
          <Image
            source={require('../../../assets/images/missionminded-fulltextlogo.png')}
            style={styles.brandLogo}
            contentFit="cover"
            accessibilityLabel="MissionMinded logo"
          />
        </View>

        <View style={styles.missionariesSection}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionEyebrow}>YOUR MISSIONARIES</Text>
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
    backgroundColor: colors.brandSurface,
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
    gap: spacing.lg,
  },
  brandHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    width: '100%',
    height: 88,
  },
  sectionEyebrow: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  missionariesSection: {
    gap: spacing.md,
  },
  sectionHeading: {
    gap: spacing.xs,
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
});
