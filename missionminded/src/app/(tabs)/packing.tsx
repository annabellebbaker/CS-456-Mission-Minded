import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMissionaries } from '@/data/missionaries-context';
import { colors, spacing } from '@/theme/colors';

const essentials = [
  { id: 'scriptures', title: 'Scriptures and study materials' },
  { id: 'clothing', title: 'Everyday clothing' },
  { id: 'dress-clothes', title: 'Sunday and dress clothing' },
  { id: 'shoes', title: 'Comfortable walking shoes' },
  { id: 'toiletries', title: 'Personal care items' },
  { id: 'documents', title: 'Travel documents and copies' },
];

function climateItems(missionName: string) {
  const mission = missionName.toLowerCase();
  if (mission.includes('alaska')) {
    return [
      { id: 'warm-layers', title: 'Warm base layers' },
      { id: 'waterproof-outerwear', title: 'Waterproof outer layer' },
      { id: 'cold-weather', title: 'Warm hat and gloves' },
    ];
  }
  if (mission.includes('peru')) {
    return [
      { id: 'breathable-layers', title: 'Lightweight, breathable layers' },
      { id: 'sun-protection', title: 'Sun protection' },
      { id: 'rain-layer', title: 'Light rain layer' },
    ];
  }
  return [
    { id: 'mission-climate', title: 'Mission climate details can be added later' },
  ];
}

export default function PackingScreen() {
  const { missionaries } = useMissionaries();
  const [selectedMissionaryId, setSelectedMissionaryId] = useState(missionaries[0]?.id ?? '');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const missionary = missionaries.find((item) => item.id === selectedMissionaryId) ?? missionaries[0];
  const missionItems = climateItems(missionary?.missionName ?? '');

  const toggleItem = (id: string) => {
    const key = `${missionary?.id ?? 'none'}:${id}`;
    setCheckedItems((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.brand}>MissionMinded</Text>
          <Text style={styles.title}>Packing list</Text>
          <Text style={styles.subtitle}>A simple place to prepare the essentials.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MISSIONARY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
            {missionaries.map((item) => {
              const selected = item.id === missionary?.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedMissionaryId(item.id)}
                  style={({ pressed }) => [styles.selectorChip, selected && styles.selectorChipSelected, pressed && styles.pressed]}>
                  <Text style={[styles.selectorText, selected && styles.selectorTextSelected]}>{item.firstName}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {missionary ? (
          <View style={styles.missionCard}>
            <Text style={styles.missionName}>{missionary.missionName}</Text>
            <Text style={styles.mutedText}>Check items off as you gather them. Your checklist resets when you refresh the prototype.</Text>
          </View>
        ) : (
          <View style={styles.missionCard}>
            <Text style={styles.missionName}>No missionaries linked yet</Text>
            <Text style={styles.mutedText}>Link a missionary from the Home or Profile tab to start a packing list.</Text>
          </View>
        )}

        <PackingSection
          title="ESSENTIALS FOR EVERY MISSION"
          items={essentials}
          checkedItems={checkedItems}
          missionaryId={missionary?.id ?? 'none'}
          onToggle={toggleItem}
        />
        <PackingSection
          title="MISSION CLIMATE AND ATTIRE"
          items={missionItems}
          checkedItems={checkedItems}
          missionaryId={missionary?.id ?? 'none'}
          onToggle={toggleItem}
        />

        <View style={styles.shoppingCard}>
          <Text style={styles.shoppingTitle}>Shopping help</Text>
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>COMING LATER</Text>
          </View>
          <Text style={styles.mutedText}>Store recommendations and discounts will be added in a future version.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function PackingSection({
  title,
  items,
  checkedItems,
  missionaryId,
  onToggle,
}: {
  title: string;
  items: { id: string; title: string }[];
  checkedItems: Record<string, boolean>;
  missionaryId: string;
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {items.map((item) => {
        const key = `${missionaryId}:${item.id}`;
        const checked = Boolean(checkedItems[key]);
        return (
          <Pressable
            key={item.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => onToggle(item.id)}
            style={({ pressed }) => [styles.itemRow, pressed && styles.pressed]}>
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.itemText, checked && styles.itemTextChecked]}>{item.title}</Text>
          </Pressable>
        );
      })}
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
  subtitle: { color: colors.textSecondary, fontSize: 14 },
  section: { gap: spacing.sm },
  sectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  selectorRow: { gap: spacing.sm, paddingVertical: 2 },
  selectorChip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 20 },
  selectorChipSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  selectorText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  selectorTextSelected: { color: colors.white },
  missionCard: { gap: spacing.xs, padding: spacing.lg, borderRadius: 14, backgroundColor: '#F0F6FB' },
  missionName: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  mutedText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  sectionCard: { gap: spacing.sm, padding: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 14 },
  itemRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkbox: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.navy, borderRadius: 5 },
  checkboxChecked: { backgroundColor: colors.navy },
  checkmark: { color: colors.white, fontSize: 15, lineHeight: 18, fontWeight: '700' },
  itemText: { flex: 1, color: colors.text, fontSize: 14 },
  itemTextChecked: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  shoppingCard: { gap: spacing.sm, padding: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 14, backgroundColor: '#FAF9F5' },
  shoppingTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  comingSoon: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 6, backgroundColor: '#E8EEF3' },
  comingSoonText: { color: colors.navy, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  pressed: { opacity: 0.78 },
});
