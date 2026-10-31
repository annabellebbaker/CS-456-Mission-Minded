import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useMissionaries } from '@/data/missionaries';
import { colors, spacing } from '@/theme/colors';

/** Chips for choosing which missionary the Calendar and Packing tabs show. */
export function MissionaryPicker() {
  const { missionaries, selectedId, setSelectedId } = useMissionaries();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {missionaries.map((missionary) => {
        const selected = missionary.id === selectedId;
        return (
          <Pressable
            key={missionary.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setSelectedId(missionary.id)}
            style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{missionary.shortName}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#D6DEE6',
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  chipSelected: { borderColor: colors.navy, backgroundColor: colors.navy },
  chipText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  chipTextSelected: { color: colors.white },
  pressed: { opacity: 0.78 },
});
