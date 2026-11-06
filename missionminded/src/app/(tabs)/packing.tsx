import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText as Text } from '@/components/app-text';
import { CheckRow } from '@/components/check-row';
import { MissionaryPicker } from '@/components/missionary-picker';
import { useMissionaries } from '@/data/missionaries';
import { packingEssentials } from '@/data/repository';
import { colors, spacing } from '@/theme/colors';

function PackingSection({ title, items, missionaryId }: { title: string; items: string[]; missionaryId: string }) {
  const { checked, toggleChecked } = useMissionaries();
  const packedCount = items.filter((item) => checked[`${missionaryId}:packing:${item}`]).length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.eyebrow}>{title}</Text>
        <Text style={styles.count}>
          {packedCount} of {items.length} packed
        </Text>
      </View>
      <View style={styles.listCard}>
        {items.map((item, index) => (
          <CheckRow
            key={item}
            title={item}
            checked={Boolean(checked[`${missionaryId}:packing:${item}`])}
            onToggle={() => toggleChecked(`${missionaryId}:packing:${item}`)}
            last={index === items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

export default function PackingScreen() {
  const { missionaries, getById, selectedId } = useMissionaries();
  const missionary = getById(selectedId) ?? missionaries[0];
  const missionKnown = missionary.phase !== 'preparing';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Packing list</Text>
        <MissionaryPicker />
        <Text style={styles.caption}>
          {missionKnown ? `Built from ${missionary.missionName} details` : 'Climate items appear once the call arrives'}
        </Text>

        <PackingSection title="ESSENTIALS — ALL MISSIONS" items={packingEssentials} missionaryId={missionary.id} />

        {missionKnown && missionary.climate ? (
          <PackingSection
            title={`FOR THE MISSION'S CLIMATE — ${missionary.climate.label.toUpperCase()}`}
            items={missionary.climate.items}
            missionaryId={missionary.id}
          />
        ) : (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              {missionKnown
                ? "Climate details for this mission aren't added yet."
                : `Mission-specific items will show here after ${missionary.firstName}'s call is opened.`}
            </Text>
          </View>
        )}

        <View style={styles.comingLater}>
          <Text style={styles.comingLaterText}>Shopping — coming later</Text>
        </View>
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
  section: { gap: spacing.sm },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  eyebrow: { flexShrink: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  count: { flexShrink: 0, color: colors.navy, fontSize: 12, fontWeight: '600' },
  listCard: { paddingHorizontal: spacing.md, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 16 },
  notice: { padding: spacing.md, borderRadius: 12, backgroundColor: '#F0F6FB' },
  noticeText: { color: colors.navy, fontSize: 14, lineHeight: 20 },
  comingLater: {
    padding: spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#B9C4CE',
    borderRadius: 12,
  },
  comingLaterText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
});
