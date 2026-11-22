import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText as Text } from '@/components/app-text';
import { MissionMap } from '@/components/mission-map';
import { useMissionBoundary } from '@/data/mission-boundary-loader';
import type { MissionaryDetails } from '@/data/repository';
import { colors, spacing } from '@/theme/colors';

const unavailableDetail = "Some details aren't released yet.";

function DetailValue({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.detailValue}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={value ? styles.detailText : styles.unavailableText}>{value ?? unavailableDetail}</Text>
    </View>
  );
}

/** Map, companion, area, leaders and mission office. Used on the Missionary tab and the journey page. */
export function MissionDetails({ missionary }: { missionary: MissionaryDetails }) {
  const details = missionary.missionDetails;
  const boundaryState = useMissionBoundary(missionary.missionId, missionary.missionName);

  return (
    <View style={styles.detailsContent}>
      {boundaryState.status === 'ready' ? (
        <MissionMap boundary={boundaryState.boundary} />
      ) : (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.mapPlaceholder, boundaryState.status === 'loading' && styles.mapLoading]}>
          {boundaryState.status === 'loading' && <ActivityIndicator color={colors.navy} />}
          <Text style={styles.mutedText}>
            {boundaryState.status === 'loading'
              ? `Loading the ${missionary.missionName || 'mission'} map…`
              : "We couldn't find a map for this mission yet."}
          </Text>
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
  );
}

const styles = StyleSheet.create({
  detailsContent: { gap: spacing.md },
  mutedText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  mapLoading: { height: 220, gap: spacing.sm },
  mapPlaceholder: {
    height: 140,
    paddingHorizontal: spacing.lg,
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
});
