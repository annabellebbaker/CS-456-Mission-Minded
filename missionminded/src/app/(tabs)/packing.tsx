import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';

import { useAuth } from '@/data/auth';
import { getFirebaseFirestore } from '@/data/firebase';
import { useMissionaries } from '@/data/missionaries-context';
import type { PackingSuggestion } from '@/data/repository';
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

function missionSuggestions(missionId: string, value: unknown): PackingSuggestion[] {
  const rows = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? Object.entries(value).flatMap(([climate, items]) => Array.isArray(items)
        ? items.map((item) => typeof item === 'string' ? { title: item, climate } : { ...item as object, climate })
        : [])
      : [];
  return rows.flatMap((row) => {
    if (typeof row === 'string') {
      const title = row.trim();
      return title ? [{ id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), missionId, title }] : [];
    }
    if (!row || typeof row !== 'object') return [];
    const item = row as { id?: unknown; title?: unknown; name?: unknown };
    const title = typeof item.title === 'string' ? item.title : typeof item.name === 'string' ? item.name : '';
    if (!title.trim()) return [];
    const id = typeof item.id === 'string' ? item.id : title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return [{ id, missionId, title: title.trim() }];
  });
}

export default function PackingScreen() {
  const { user } = useAuth();
  const { missionaries } = useMissionaries();
  const [selectedMissionaryId, setSelectedMissionaryId] = useState(missionaries[0]?.id ?? '');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ essentials: true });
  const [customItems, setCustomItems] = useState<Record<string, { id: string; title: string }[]>>({});
  const [suggestionSnapshot, setSuggestionSnapshot] = useState<{ missionId: string | null; items: PackingSuggestion[] }>({
    missionId: null,
    items: [],
  });
  const [missionDocSuggestions, setMissionDocSuggestions] = useState<{ missionId: string | null; items: PackingSuggestion[] }>({
    missionId: null,
    items: [],
  });
  const [addedSuggestions, setAddedSuggestions] = useState<Record<string, boolean>>({});
  const missionary = missionaries.find((item) => item.id === selectedMissionaryId) ?? missionaries[0];
  const missionItems = climateItems(missionary?.missionName ?? '');
  const missionaryCustomItems = customItems[missionary?.id ?? 'none'] ?? [];
  const suggestions = suggestionSnapshot.missionId === missionary?.missionId && suggestionSnapshot.items.length
    ? suggestionSnapshot.items
    : missionDocSuggestions.missionId === missionary?.missionId
      ? missionDocSuggestions.items
      : [];

  useEffect(() => {
    if (!missionary?.missionId) return;
    return onSnapshot(doc(getFirebaseFirestore(), 'missions', missionary.missionId), (snapshot) => {
      const data = snapshot.data();
      setMissionDocSuggestions({
        missionId: missionary.missionId as string,
        items: missionSuggestions(missionary.missionId as string, data?.packingItems),
      });
    }, () => setMissionDocSuggestions({ missionId: missionary.missionId as string, items: [] }));
  }, [missionary?.missionId]);

  useEffect(() => {
    if (!missionary?.missionId) return;
    return onSnapshot(
      collection(getFirebaseFirestore(), 'missions', missionary.missionId, 'packingItems'),
      (snapshot) => setSuggestionSnapshot({
        missionId: missionary.missionId as string,
        items: snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
          missionId: missionary.missionId as string,
        }) as PackingSuggestion),
      }),
      () => setSuggestionSnapshot({ missionId: missionary.missionId as string, items: [] }),
    );
  }, [missionary?.missionId]);

  useEffect(() => {
    if (!user || !missionary) return;
    return onSnapshot(
      collection(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionary.id, 'packingChecks'),
      (snapshot) => {
        const checked: Record<string, boolean> = {};
        const custom: { id: string; title: string }[] = [];
        snapshot.docs.forEach((item) => {
          const data = item.data();
          if (data.checked) checked[`${missionary.id}:${item.id}`] = true;
          if (data.custom === true && typeof data.title === 'string') custom.push({ id: item.id, title: data.title });
        });
        setCheckedItems((current) => ({
          ...Object.fromEntries(
            Object.entries(current).filter(([key]) => !key.startsWith(`${missionary.id}:`)),
          ),
          ...checked,
        }));
        setCustomItems((current) => ({ ...current, [missionary.id]: custom }));
      },
    );
  }, [missionary, user]);

  const toggleSection = (id: string) => {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }));
  };

  const toggleItem = (id: string) => {
    const key = `${missionary?.id ?? 'none'}:${id}`;
    const checked = !checkedItems[key];
    setCheckedItems((current) => ({ ...current, [key]: checked }));
    if (user && missionary) {
      void setDoc(doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionary.id, 'packingChecks', id), { checked }, { merge: true });
    }
  };

  const addSuggestion = async (suggestion: PackingSuggestion) => {
    if (!missionary || !user) return;
    const suggestionKey = `${missionary.id}:${suggestion.id}`;
    await setDoc(doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionary.id, 'packingChecks', suggestion.id), {
      title: suggestion.title,
      checked: false,
      custom: true,
    }, { merge: true });
    setAddedSuggestions((current) => ({ ...current, [suggestionKey]: true }));
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
          <Text style={styles.mutedText}>Check items off as you gather them. Your checklist syncs to your account.</Text>
          </View>
        ) : (
          <View style={styles.missionCard}>
            <Text style={styles.missionName}>No missionaries linked yet</Text>
            <Text style={styles.mutedText}>Link a missionary from the Home or Profile tab to start a packing list.</Text>
          </View>
        )}

        <PackingSection
          id="essentials"
          title="ESSENTIALS FOR EVERY MISSION"
          items={[...essentials, ...missionaryCustomItems]}
          checkedItems={checkedItems}
          missionaryId={missionary?.id ?? 'none'}
          onToggle={toggleItem}
          expanded={Boolean(openSections.essentials)}
          onToggleSection={toggleSection}
        />
        <PackingSection
          id="climate"
          title="MISSION CLIMATE AND ATTIRE"
          items={missionItems}
          checkedItems={checkedItems}
          missionaryId={missionary?.id ?? 'none'}
          onToggle={toggleItem}
          expanded={Boolean(openSections.climate)}
          onToggleSection={toggleSection}
        />

        <View style={styles.sectionCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: Boolean(openSections.suggestions) }}
            onPress={() => toggleSection('suggestions')}
            style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}>
            <Text style={styles.sectionLabel}>SUGGESTED BY OTHER RECENT MISSIONARIES FROM YOUR MISSION</Text>
            <Text style={styles.expandIcon}>{openSections.suggestions ? '−' : '+'}</Text>
          </Pressable>
          {openSections.suggestions && (
            <View style={styles.suggestionList}>
              <Text style={styles.mutedText}>Suggestions shared for this mission will appear here.</Text>
              {suggestions.length ? suggestions.map((suggestion) => {
                const added = Boolean(addedSuggestions[`${missionary?.id ?? 'none'}:${suggestion.id}`])
                  || missionaryCustomItems.some((item) => item.id === suggestion.id);
                return (
                  <View key={suggestion.id} style={styles.suggestionRow}>
                    <Text style={styles.itemText}>{suggestion.title}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: added }}
                      disabled={added}
                      onPress={() => void addSuggestion(suggestion)}
                      style={({ pressed }) => [styles.suggestionButton, added && styles.suggestionButtonAdded, pressed && styles.pressed]}>
                      <Text style={[styles.suggestionButtonText, added && styles.suggestionButtonTextAdded]}>{added ? 'Added' : 'Add'}</Text>
                    </Pressable>
                  </View>
                );
              }) : <Text style={styles.mutedText}>No suggestions yet for this mission.</Text>}
            </View>
          )}
        </View>

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
  id,
  title,
  items,
  checkedItems,
  missionaryId,
  onToggle,
  expanded,
  onToggleSection,
}: {
  id: string;
  title: string;
  items: { id: string; title: string }[];
  checkedItems: Record<string, boolean>;
  missionaryId: string;
  onToggle: (id: string) => void;
  expanded: boolean;
  onToggleSection: (id: string) => void;
}) {
  return (
    <View style={styles.sectionCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => onToggleSection(id)}
        style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}>
        <Text style={styles.sectionLabel}>{title}</Text>
        <Text style={styles.expandIcon}>{expanded ? '−' : '+'}</Text>
      </Pressable>
      {expanded && items.map((item) => {
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
  sectionLabel: { flex: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  selectorRow: { gap: spacing.sm, paddingVertical: 2 },
  selectorChip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 20 },
  selectorChipSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  selectorText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  selectorTextSelected: { color: colors.white },
  missionCard: { gap: spacing.xs, padding: spacing.lg, borderRadius: 14, backgroundColor: '#F0F6FB' },
  missionName: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  mutedText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  sectionCard: { gap: spacing.sm, padding: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 14 },
  sectionHeader: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  expandIcon: { color: colors.navy, fontSize: 21, fontWeight: '600' },
  itemRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkbox: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.navy, borderRadius: 5 },
  checkboxChecked: { backgroundColor: colors.navy },
  checkmark: { color: colors.white, fontSize: 15, lineHeight: 18, fontWeight: '700' },
  itemText: { flex: 1, color: colors.text, fontSize: 14 },
  itemTextChecked: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  suggestionList: { gap: spacing.sm },
  suggestionRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  suggestionButton: { minHeight: 36, minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: 8, backgroundColor: colors.navy },
  suggestionButtonAdded: { backgroundColor: '#E8EEF3' },
  suggestionButtonText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  suggestionButtonTextAdded: { color: colors.navy },
  shoppingCard: { gap: spacing.sm, padding: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 14, backgroundColor: '#FAF9F5' },
  shoppingTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  comingSoon: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 6, backgroundColor: '#E8EEF3' },
  comingSoonText: { color: colors.navy, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  pressed: { opacity: 0.78 },
});
