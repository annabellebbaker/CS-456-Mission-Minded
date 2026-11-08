import { useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText as Text } from '@/components/app-text';
import { MissionMap } from '@/components/mission-map';
import { PhaseTracker } from '@/components/phase-tracker';
import { useMissionaries } from '@/data/missionaries';
import {
  getMissionBoundary,
  getPhaseLabel,
  missionPhases,
  phaseInfo,
  type MissionaryDetails,
  type PhaseMoment,
  type MissionPhase,
} from '@/data/repository';
import { colors, spacing } from '@/theme/colors';

const unavailableDetail = "Some details aren't released yet.";

/** The headline card: which phase the missionary is in right now. */
function PhaseCard({ missionary }: { missionary: MissionaryDetails }) {
  const info = phaseInfo[missionary.phase];

  return (
    <View style={styles.phaseCard}>
      <Text style={styles.phaseEyebrow}>RIGHT NOW</Text>
      <Text style={styles.phaseLabel}>{getPhaseLabel(missionary.phase, missionary.phase)}</Text>
      <Text style={styles.phaseSummary}>{info.summary}</Text>
      <Text style={styles.phaseSince}>{missionary.phaseSince}</Text>
      <View style={styles.phaseDivider} />
      <PhaseTracker phase={missionary.phase} onDark />
    </View>
  );
}

function PhaseMomentRow({ moment }: { moment: PhaseMoment }) {
  return (
    <View style={styles.momentRow}>
      <View style={[styles.momentMark, moment.done && styles.momentMarkDone]}>
        {moment.done && <Text style={styles.momentCheck}>✓</Text>}
      </View>
      <View style={styles.momentCopy}>
        <Text style={[styles.momentTitle, moment.done && styles.momentTitleDone]}>{moment.title}</Text>
        <Text style={styles.mutedText}>{moment.description}</Text>
      </View>
      {moment.when && <Text style={styles.momentWhen}>{moment.when}</Text>}
    </View>
  );
}

/** Smaller moments, grouped under the phase they belong to. */
function PhaseMomentList({ moments, currentPhase }: { moments: PhaseMoment[]; currentPhase: MissionPhase }) {
  const groups = missionPhases
    .map((phase) => ({ phase, items: moments.filter((moment) => moment.phase === phase) }))
    .filter((group) => group.items.length > 0);

  return (
    <View style={styles.momentGroups}>
      {groups.map(({ phase, items }) => (
        <View key={phase} style={styles.momentGroup}>
          <View style={styles.momentGroupHeading}>
            <Text style={styles.momentGroupLabel}>{getPhaseLabel(phase, currentPhase)}</Text>
            {phase === currentPhase && (
              <View style={styles.nowPill}>
                <Text style={styles.nowPillText}>Now</Text>
              </View>
            )}
          </View>
          {items.map((moment) => (
            <PhaseMomentRow key={moment.title} moment={moment} />
          ))}
        </View>
      ))}
    </View>
  );
}

function DetailValue({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.detailValue}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={value ? styles.detailText : styles.unavailableText}>{value ?? unavailableDetail}</Text>
    </View>
  );
}

export default function MissionaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById } = useMissionaries();
  const missionary = getById(Array.isArray(id) ? id[0] : id);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  if (!missionary) {
    return (
      <View style={styles.notFoundScreen}>
        <Text style={styles.pageTitle}>Missionary not found</Text>
        <Link href="/" style={styles.homeLink}>Return to Home</Link>
      </View>
    );
  }

  const details = missionary.missionDetails;
  const boundary = getMissionBoundary(missionary.missionId);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backText}>‹  Back</Text>
        </Pressable>

        <View style={styles.missionaryHeader}>
          <Text style={styles.pageTitle}>{missionary.name}</Text>
          <Text style={styles.missionName}>{missionary.missionName}</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{missionary.status}</Text>
          </View>
        </View>

        <PhaseCard missionary={missionary} />

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>MOMENTS ALONG THE WAY</Text>
          <PhaseMomentList moments={missionary.moments} currentPhase={missionary.phase} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: detailsExpanded }}
          onPress={() => setDetailsExpanded((expanded) => !expanded)}
          style={({ pressed }) => [styles.detailsToggle, pressed && styles.pressed]}>
          <Text style={styles.detailsToggleText}>Mission details</Text>
          <Text accessibilityElementsHidden style={styles.detailsToggleIcon}>{detailsExpanded ? '−' : '+'}</Text>
        </Pressable>

        {detailsExpanded && (
          <View style={styles.detailsContent}>
            {boundary ? (
              <MissionMap boundary={boundary} />
            ) : (
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mutedText}>Map coming soon for this mission.</Text>
              </View>
            )}
            <View style={styles.detailGrid}>
              <View style={styles.detailTile}>
                <DetailValue label="COMPANION" value={details.companion} />
              </View>
              <View style={styles.detailTile}>
                <DetailValue label="AREA" value={details.area} />
              </View>
            </View>
            <View style={styles.detailPanel}>
              <DetailValue label="MISSION LEADERS" value={details.leaders} />
            </View>
            <View style={styles.detailPanel}>
              <DetailValue label="MISSION OFFICE" value={details.office} />
              <View style={styles.officeActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !details.phone }}
                  disabled={!details.phone}
                  style={[styles.officeButton, !details.phone && styles.officeButtonDisabled]}>
                  <Text style={styles.officeButtonText}>Call</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !details.email }}
                  disabled={!details.email}
                  style={[styles.officeButton, !details.email && styles.officeButtonDisabled]}>
                  <Text style={styles.officeButtonText}>Email</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.unavailableNote}>{unavailableDetail} These fields can fill in as the missionary shares them.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.md },
  notFoundScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
  },
  backText: { color: colors.navy, fontSize: 15, fontWeight: '600' },
  missionaryHeader: { gap: spacing.xs, paddingVertical: spacing.xs },
  pageTitle: { color: colors.navy, fontSize: 24, fontWeight: '700' },
  missionName: { color: colors.textSecondary, fontSize: 15 },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F6FB',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.lightBlue },
  statusText: { color: colors.navy, fontSize: 13, fontWeight: '600' },
  sectionCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#D6DEE6',
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  sectionEyebrow: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  phaseCard: { gap: spacing.xs, padding: spacing.lg, borderRadius: 16, backgroundColor: colors.navy },
  phaseEyebrow: { color: '#9FB6CC', fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  phaseLabel: { color: colors.white, fontSize: 30, fontWeight: '800' },
  phaseSummary: { color: colors.white, fontSize: 15, lineHeight: 21 },
  phaseSince: { color: '#9FB6CC', fontSize: 13 },
  phaseDivider: { height: 1, marginVertical: spacing.md, backgroundColor: 'rgba(255,255,255,0.18)' },
  momentGroups: { gap: spacing.lg },
  momentGroup: { gap: spacing.sm },
  momentGroupHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  momentGroupLabel: { color: colors.navy, fontSize: 13, fontWeight: '700' },
  nowPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10, backgroundColor: colors.lightBlue },
  nowPillText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  momentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 11,
    backgroundColor: '#F6F8FA',
  },
  momentMark: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#AEB8C2',
    borderRadius: 10,
  },
  momentMarkDone: { borderColor: colors.navy, backgroundColor: colors.navy },
  momentCheck: { color: colors.white, fontSize: 12, lineHeight: 14, fontWeight: '700' },
  momentCopy: { flex: 1, gap: 2 },
  momentTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  momentTitleDone: { color: colors.navy },
  momentWhen: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  mutedText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  detailsToggle: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  detailsToggleText: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  detailsToggleIcon: { color: colors.navy, fontSize: 22 },
  detailsContent: { gap: spacing.md },
  mapPlaceholder: {
    height: 140,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D6DEE6',
    borderRadius: 12,
    backgroundColor: '#EAF2F8',
  },
  detailGrid: { flexDirection: 'row', gap: spacing.sm },
  detailTile: { flex: 1, padding: spacing.md, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 12, backgroundColor: colors.white },
  detailPanel: { gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 12, backgroundColor: colors.white },
  detailValue: { gap: spacing.xs },
  detailLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  detailText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  unavailableText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  officeActions: { flexDirection: 'row', gap: spacing.sm },
  officeButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 8,
  },
  officeButtonDisabled: { borderColor: '#B9C4CE', backgroundColor: '#F6F8FA' },
  officeButtonText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  unavailableNote: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, paddingHorizontal: spacing.xs },
  homeLink: { color: colors.navy, fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.78 },
});
