import { useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText as Text, AppTextInput as TextInput } from '@/components/app-text';
import { MissionDetails } from '@/components/mission-details';
import { useMissionaries } from '@/data/missionaries';
import {
  getPhaseLabel,
  missionPhases,
  type PhaseMoment,
  type MissionPhase,
} from '@/data/repository';
import { colors, spacing } from '@/theme/colors';

function PhaseMomentRow({
  moment,
  onSaveDate,
}: {
  moment: PhaseMoment;
  onSaveDate: (date: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(moment.when ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const saveDate = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await onSaveDate(date);
      setEditing(false);
    } catch {
      setSaveError('Could not save this date. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.momentItem}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit date for ${moment.title}`}
        accessibilityState={{ expanded: editing }}
        onPress={() => {
          setDate(moment.when ?? '');
          setSaveError('');
          setEditing((current) => !current);
        }}
        style={({ pressed }) => [styles.momentRow, pressed && styles.pressed]}>
        <View style={[styles.momentMark, moment.done && styles.momentMarkDone]}>
          {moment.done && <Text style={styles.momentCheck}>✓</Text>}
        </View>
        <View style={styles.momentCopy}>
          <Text style={[styles.momentTitle, moment.done && styles.momentTitleDone]}>{moment.title}</Text>
          <Text style={styles.momentWhen}>{moment.when || 'Add date'}</Text>
        </View>
        <Text style={styles.momentEditIcon}>{editing ? '−' : '+'}</Text>
      </Pressable>
      {editing && (
        <View style={styles.momentEditor}>
          <TextInput
            accessibilityLabel={`Date for ${moment.title}`}
            value={date}
            onChangeText={setDate}
            onSubmitEditing={() => void saveDate()}
            placeholder="e.g. January 15, 2027"
            placeholderTextColor="#6F7C88"
            returnKeyType="done"
            style={styles.momentDateInput}
          />
          <View style={styles.momentEditorActions}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void saveDate()}
              style={({ pressed }) => [styles.momentSaveButton, pressed && styles.pressed, saving && styles.disabledButton]}>
              <Text style={styles.momentSaveText}>{saving ? 'Saving…' : 'Save date'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => setEditing(false)}
              style={({ pressed }) => [styles.momentCancelButton, pressed && styles.pressed, saving && styles.disabledButton]}>
              <Text style={styles.momentCancelText}>Cancel</Text>
            </Pressable>
          </View>
          {!!saveError && <Text accessibilityRole="alert" style={styles.momentSaveError}>{saveError}</Text>}
        </View>
      )}
    </View>
  );
}

/** Smaller moments, grouped under the phase they belong to. */
function PhaseMomentList({
  moments,
  currentPhase,
  onSaveDate,
}: {
  moments: PhaseMoment[];
  currentPhase: MissionPhase;
  onSaveDate: (moment: PhaseMoment, date: string) => Promise<void>;
}) {
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
            <PhaseMomentRow
              key={`${phase}:${moment.title}`}
              moment={moment}
              onSaveDate={(date) => onSaveDate(moment, date)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function MissionaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, updatePhaseMomentDate, deleteMissionary } = useMissionaries();
  const missionary = getById(Array.isArray(id) ? id[0] : id);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!missionary) {
    return (
      <View style={styles.notFoundScreen}>
        <Text style={styles.pageTitle}>Missionary not found</Text>
        <Link href="/" style={styles.homeLink}>Return to Home</Link>
      </View>
    );
  }

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

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>{`${missionary.title} ${missionary.lastName}'s Timeline`}</Text>
          <PhaseMomentList
            moments={missionary.moments}
            currentPhase={missionary.phase}
            onSaveDate={(moment, date) => updatePhaseMomentDate(missionary.id, moment.phase, moment.title, date)}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: detailsExpanded }}
          onPress={() => setDetailsExpanded((expanded) => !expanded)}
          style={({ pressed }) => [styles.detailsToggle, pressed && styles.pressed]}>
          <Text style={styles.detailsToggleText}>Mission details</Text>
          <Text accessibilityElementsHidden style={styles.detailsToggleIcon}>{detailsExpanded ? '−' : '+'}</Text>
        </Pressable>

        {detailsExpanded && <MissionDetails missionary={missionary} />}

        <View style={styles.recordActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/add-missionary', params: { id: missionary.id } })}
            style={({ pressed }) => [styles.editDetailsButton, pressed && styles.pressed]}>
            <Text style={styles.editDetailsButtonText}>Edit details</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={deleting}
            onPress={() => {
              setDeleteError('');
              setConfirmDelete(true);
            }}
            style={({ pressed }) => [styles.deleteMissionaryButton, pressed && styles.pressed, deleting && styles.disabledButton]}>
            <Text style={styles.deleteMissionaryButtonText}>Delete missionary</Text>
          </Pressable>
          {confirmDelete && (
            <View style={styles.deleteConfirmation}>
              <Text style={styles.deleteConfirmationText}>Delete {missionary.name}? This removes this missionary and their saved journey details.</Text>
              <View style={styles.confirmationActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={deleting}
                  onPress={() => setConfirmDelete(false)}
                  style={({ pressed }) => [styles.cancelDeleteButton, pressed && styles.pressed, deleting && styles.disabledButton]}>
                  <Text style={styles.cancelDeleteText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={deleting}
                  onPress={() => {
                    setDeleting(true);
                    void deleteMissionary(missionary.id)
                      .then(() => router.replace('/'))
                      .catch(() => setDeleteError('Could not delete this missionary. Please try again.'))
                      .finally(() => setDeleting(false));
                  }}
                  style={({ pressed }) => [styles.confirmDeleteButton, pressed && styles.pressed, deleting && styles.disabledButton]}>
                  <Text style={styles.confirmDeleteText}>{deleting ? 'Deleting…' : 'Confirm delete'}</Text>
                </Pressable>
              </View>
              {!!deleteError && <Text accessibilityRole="alert" style={styles.deleteError}>{deleteError}</Text>}
            </View>
          )}
        </View>
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
  momentGroups: { gap: spacing.lg },
  momentGroup: { gap: spacing.sm },
  momentItem: { gap: spacing.xs },
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
  momentEditIcon: { color: colors.textSecondary, fontSize: 20, lineHeight: 22 },
  momentEditor: { gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 10 },
  momentDateInput: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.text,
    fontSize: 14,
    backgroundColor: colors.white,
  },
  momentEditorActions: { flexDirection: 'row', gap: spacing.sm },
  momentSaveButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.navy },
  momentSaveText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  momentCancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 9 },
  momentCancelText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  momentSaveError: { color: '#A12626', fontSize: 13 },
  disabledButton: { opacity: 0.6 },
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
  recordActions: { gap: spacing.sm, paddingTop: spacing.sm },
  editDetailsButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.navy },
  editDetailsButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  deleteMissionaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#A12626', borderRadius: 10, backgroundColor: colors.white },
  deleteMissionaryButtonText: { color: '#A12626', fontSize: 15, fontWeight: '700' },
  deleteConfirmation: { gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: '#E2B8B8', borderRadius: 10, backgroundColor: '#FFF8F8' },
  deleteConfirmationText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  confirmationActions: { flexDirection: 'row', gap: spacing.sm },
  cancelDeleteButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white },
  cancelDeleteText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  confirmDeleteButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#A12626' },
  confirmDeleteText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  deleteError: { color: '#A12626', fontSize: 13 },
  homeLink: { color: colors.navy, fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.78 },
});
