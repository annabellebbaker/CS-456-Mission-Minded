import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/colors';

/** One tappable row in a checklist card, with an optional detail line like a date. */
export function CheckRow({
  title,
  detail,
  checked,
  onToggle,
  last = false,
}: {
  title: string;
  detail?: string;
  checked: boolean;
  onToggle: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.pressed]}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, checked && styles.titleChecked]}>{title}</Text>
        {detail && <Text style={styles.detail}>{detail}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: '#E7EBEF' },
  box: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 5,
  },
  boxChecked: { backgroundColor: colors.navy },
  checkmark: { color: colors.white, fontSize: 15, lineHeight: 18, fontWeight: '700' },
  copy: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 14, fontWeight: '600' },
  titleChecked: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  detail: { color: colors.textSecondary, fontSize: 13 },
  pressed: { opacity: 0.78 },
});
