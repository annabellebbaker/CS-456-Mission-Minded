import { useState } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getMissionaryById, type GrowingTogetherItem, type JourneyMilestone } from '@/data/repository';
import { colors, spacing } from '@/theme/colors';

const unavailableDetail = "Some details aren't released yet.";

function JourneyTimeline({ milestones }: { milestones: JourneyMilestone[] }) {
  return (
    <View style={styles.timeline}>
      {milestones.map((milestone, index) => {
        const current = milestone.state === 'current';
        const complete = milestone.state === 'complete';

        return (
          <View key={`${milestone.title}-${index}`} style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View
                style={[
                  styles.timelineDot,
                  complete && styles.timelineDotComplete,
                  current && styles.timelineDotCurrent,
                ]}
              />
              {index < milestones.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineCopy}>
              <Text style={[styles.timelineTitle, current && styles.currentText]}>{milestone.title}</Text>
              <Text style={styles.mutedText}>{milestone.description}</Text>
            </View>
          </View>
        );
      })}
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

function ChecklistRow({
  item,
  checked,
  onToggle,
}: {
  item: GrowingTogetherItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.checkCopy}>
        <Text style={styles.checkTitle}>{item.title}</Text>
        <Text style={styles.mutedText}>{item.description}</Text>
      </View>
    </Pressable>
  );
}

export default function MissionaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const missionary = getMissionaryById(Array.isArray(id) ? id[0] : id);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [guesses, setGuesses] = useState(() => missionary?.guesses ?? []);
  const [guessText, setGuessText] = useState('');
  const [callRevealed, setCallRevealed] = useState(false);

  if (!missionary) {
    return (
      <View style={styles.notFoundScreen}>
        <Text style={styles.pageTitle}>Missionary not found</Text>
        <Link href="/" style={styles.homeLink}>Return to Home</Link>
      </View>
    );
  }

  const toggleChecklistItem = (itemId: string) => {
    setCompletedItems((current) => ({ ...current, [itemId]: !current[itemId] }));
  };

  const addGuess = () => {
    const trimmedGuess = guessText.trim();
    if (!trimmedGuess) return;

    setGuesses((current) => [...current, { text: trimmedGuess, who: 'You' }]);
    setGuessText('');
  };

  const details = missionary.missionDetails;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Link href="/" asChild>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹  Home</Text>
          </Pressable>
        </Link>

        <View style={styles.missionaryHeader}>
          <Text style={styles.pageTitle}>{missionary.name}</Text>
          <Text style={styles.missionName}>{missionary.missionName}</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{missionary.status}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>THEIR JOURNEY</Text>
          <JourneyTimeline milestones={missionary.journey} />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>GROWING TOGETHER THIS WEEK</Text>
          <Text style={styles.sectionIntro}>{missionary.growingTogetherIntro}</Text>
          <View style={styles.checklist}>
            {missionary.growingTogether.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                checked={Boolean(completedItems[item.id])}
                onToggle={() => toggleChecklistItem(item.id)}
              />
            ))}
          </View>
          <View style={styles.ponderBox}>
            <Text style={styles.sectionEyebrow}>TO PONDER AS A FAMILY</Text>
            <Text style={styles.ponderText}>“{missionary.ponderText}”</Text>
            <Text style={styles.mutedText}>— {missionary.ponderReference}</Text>
          </View>
        </View>

        {missionary.phase === 'pre-mission' && (
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Where is {missionary.firstName} going?</Text>
            <Text style={styles.mutedText}>Family and friends can add guesses before the call is opened.</Text>
            <View style={styles.guessEntry}>
              <TextInput
                accessibilityLabel="Your mission guess"
                value={guessText}
                onChangeText={setGuessText}
                onSubmitEditing={addGuess}
                placeholder="Country, city or mission"
                placeholderTextColor="#6F7C88"
                returnKeyType="done"
                style={styles.textInput}
              />
              <Pressable
                accessibilityRole="button"
                onPress={addGuess}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>Add</Text>
              </Pressable>
            </View>
            {guesses.length > 0 && (
              <View style={styles.guessList}>
                {guesses.map((guess, index) => (
                  <View key={`${guess.who}-${guess.text}-${index}`} style={styles.guessRow}>
                    <Text style={styles.guessText}>{guess.text}</Text>
                    <Text style={styles.mutedText}>{guess.who}</Text>
                  </View>
                ))}
              </View>
            )}
            {!callRevealed ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setCallRevealed(true)}
                style={({ pressed }) => [styles.revealButton, pressed && styles.pressed]}>
                <Text style={styles.revealButtonText}>Reveal the call</Text>
              </Pressable>
            ) : (
              <View style={styles.revealCard}>
                <Text style={styles.sectionEyebrow}>CALLED TO SERVE IN THE</Text>
                <Text style={styles.revealedMission}>{missionary.missionName}</Text>
                <Text style={styles.mutedText}>{missionary.language}</Text>
              </View>
            )}
          </View>
        )}

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
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapGridVertical} />
              <View style={styles.mapGridHorizontal} />
              <View style={styles.mapMarker} />
              <View style={styles.mapLabel}>
                <Text style={styles.mapLabelText}>Mission map</Text>
              </View>
            </View>
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
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: spacing.md, minHeight: 58 },
  timelineRail: { alignItems: 'center', width: 16 },
  timelineDot: {
    width: 14,
    height: 14,
    marginTop: 3,
    borderWidth: 1.5,
    borderColor: '#AEB8C2',
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  timelineDotComplete: { borderColor: colors.navy, backgroundColor: colors.navy },
  timelineDotCurrent: { borderWidth: 2, borderColor: colors.navy, backgroundColor: colors.lightBlue },
  timelineLine: { width: 1, flex: 1, minHeight: 20, backgroundColor: '#CCD5DE' },
  timelineCopy: { flex: 1, paddingBottom: spacing.md, gap: 3 },
  timelineTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  currentText: { color: colors.navy, fontWeight: '700' },
  mutedText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  sectionIntro: { color: colors.text, fontSize: 14, lineHeight: 21 },
  checklist: { gap: spacing.sm },
  checkRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#D6DEE6',
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 5,
  },
  checkboxChecked: { backgroundColor: colors.navy },
  checkmark: { color: colors.white, fontSize: 15, lineHeight: 18, fontWeight: '700' },
  checkCopy: { flex: 1, gap: 2 },
  checkTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  ponderBox: { gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: '#E0E6EB' },
  ponderText: { color: colors.navy, fontSize: 15, lineHeight: 22 },
  cardTitle: { color: colors.navy, fontSize: 17, fontWeight: '700' },
  guessEntry: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  textInput: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.text,
    fontSize: 14,
    backgroundColor: colors.white,
  },
  primaryButton: {
    minHeight: 46,
    minWidth: 62,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 9,
    backgroundColor: colors.navy,
  },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  guessList: { paddingHorizontal: spacing.md, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 11 },
  guessRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EBEF',
  },
  guessText: { color: colors.text, fontSize: 14 },
  revealButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 10,
    backgroundColor: '#F0F6FB',
  },
  revealButtonText: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  revealCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderWidth: 2, borderColor: colors.navy, borderRadius: 12 },
  revealedMission: { color: colors.navy, fontSize: 19, fontWeight: '700', textAlign: 'center' },
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
  mapGridVertical: { position: 'absolute', width: '140%', height: 1, backgroundColor: '#C3D4E2', transform: [{ rotate: '32deg' }] },
  mapGridHorizontal: { position: 'absolute', width: '140%', height: 1, backgroundColor: '#C3D4E2', transform: [{ rotate: '-26deg' }] },
  mapMarker: { width: 12, height: 12, borderWidth: 2, borderColor: colors.white, borderRadius: 8, backgroundColor: colors.navy },
  mapLabel: { position: 'absolute', left: spacing.md, bottom: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 6, backgroundColor: colors.white },
  mapLabelText: { color: colors.navy, fontSize: 12, fontWeight: '600' },
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
