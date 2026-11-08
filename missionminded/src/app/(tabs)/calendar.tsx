import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText as Text } from '@/components/app-text';
import { CheckRow } from '@/components/check-row';
import { MissionaryPicker } from '@/components/missionary-picker';
import { useMissionaries } from '@/data/missionaries';
import { getNextMoment, getPhaseLabel } from '@/data/repository';
import { colors, spacing } from '@/theme/colors';

const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** YYYY-MM-DD in local time. */
function toKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const formatDay = (key: string) =>
  fromKey(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** Start on the month of the next upcoming item, so the calendar opens on something useful. */
function initialMonth(dates: string[], today: Date) {
  const upcoming = dates.filter((date) => date >= toKey(today)).sort()[0];
  const start = upcoming ? fromKey(upcoming) : today;
  return new Date(start.getFullYear(), start.getMonth(), 1);
}

export default function CalendarScreen() {
  const { missionaries, getById, selectedId, addCalendarItem, checked, toggleChecked } = useMissionaries();
  const missionary = getById(selectedId) ?? missionaries[0];
  const today = new Date();
  const [month, setMonth] = useState(() => initialMonth(missionary?.calendar.map((item) => item.date) ?? [], today));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addText, setAddText] = useState('');
  const [saveError, setSaveError] = useState('');

  const next = missionary ? getNextMoment(missionary) : undefined;
  const monthPrefix = toKey(month).slice(0, 7);
  const monthItems = (missionary?.calendar ?? [])
    .filter((item) => item.date.startsWith(monthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date));
  const busyDays = new Set(monthItems.map((item) => item.date));

  const firstWeekday = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => toKey(new Date(month.getFullYear(), month.getMonth(), index + 1))),
  ];

  const shiftMonth = (amount: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
    setSelectedDay(null);
  };

  const appointmentDay = selectedDay ?? toKey(today);

  const saveAppointment = async () => {
    const title = addText.trim();
    if (!title || !missionary) return;
    try {
      await addCalendarItem(missionary.id, title, appointmentDay);
      setAddText('');
      setAddOpen(false);
      setSaveError('');
    } catch {
      setSaveError('Could not save this appointment. Check your connection and try again.');
    }
  };

  if (!missionary) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Calendar</Text>
          <Text style={styles.emptyText}>Link a missionary first to create appointments and view phase moments.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/link-missionary')} style={styles.dashedButton}>
            <Text style={styles.dashedButtonText}>+ Link a missionary</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Calendar</Text>
        <MissionaryPicker />

        <View style={styles.momentCard}>
          <Text style={styles.eyebrowOnDark}>NEXT PHASE</Text>
          {next ? (
            <>
              <Text style={styles.momentTitle}>{getPhaseLabel(next.phase, missionary.phase)}</Text>
              <Text style={styles.momentDetail}>
                {[next.title, next.when].filter(Boolean).join(' · ')}
              </Text>
            </>
          ) : (
            <Text style={styles.momentTitle}>All upcoming moments are complete.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.monthHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => shiftMonth(-1)} style={styles.monthArrow}>
              <Text style={styles.monthArrowText}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>
              {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => shiftMonth(1)} style={styles.monthArrow}>
              <Text style={styles.monthArrowText}>›</Text>
            </Pressable>
          </View>
          <View style={styles.grid}>
            {weekdays.map((day, index) => (
              <Text key={`${day}-${index}`} style={[styles.cell, styles.weekday]}>
                {day}
              </Text>
            ))}
            {cells.map((key, index) =>
              key ? (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatDay(key)}${busyDays.has(key) ? ', has plans' : ''}`}
                  accessibilityState={{ selected: key === selectedDay }}
                  onPress={() => setSelectedDay(key === selectedDay ? null : key)}
                  style={styles.cell}>
                  <View
                    style={[
                      styles.dayCircle,
                      key === toKey(today) && styles.dayToday,
                      key === selectedDay && styles.daySelected,
                    ]}>
                    <Text style={[styles.dayText, key === selectedDay && styles.dayTextSelected]}>
                      {fromKey(key).getDate()}
                    </Text>
                  </View>
                  <View style={[styles.dayDot, !busyDays.has(key) && styles.dayDotHidden]} />
                </Pressable>
              ) : (
                <View key={`blank-${index}`} style={styles.cell} />
              ),
            )}
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.eyebrow}>TO-DOS & APPOINTMENTS</Text>
        </View>
        <View style={styles.listCard}>
          {monthItems.length === 0 ? (
            <Text style={styles.emptyText}>Nothing planned this month.</Text>
          ) : (
            monthItems.map((item, index) => (
              <CheckRow
                key={item.id}
                title={item.title}
                detail={formatDay(item.date)}
                checked={Boolean(checked[`${missionary.id}:todo:${item.id}`])}
                onToggle={() => toggleChecked(`${missionary.id}:todo:${item.id}`)}
                last={index === monthItems.length - 1}
              />
            ))
          )}
        </View>

        {addOpen ? (
          <View style={styles.addForm}>
            <Text style={styles.addLabel}>New appointment on {formatDay(appointmentDay)}</Text>
            <View style={styles.addRow}>
              <TextInput
                accessibilityLabel="New appointment"
                autoFocus
                value={addText}
                onChangeText={setAddText}
                onSubmitEditing={() => void saveAppointment()}
                placeholder="e.g. Passport photos"
                placeholderTextColor="#6F7C88"
                returnKeyType="done"
                style={styles.textInput}
              />
              <Pressable accessibilityRole="button" onPress={() => void saveAppointment()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </Pressable>
            </View>
            {!!saveError && <Text accessibilityRole="alert" style={styles.errorText}>{saveError}</Text>}
            <Text style={styles.hint}>Tap a day on the calendar to pick a different date.</Text>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setAddOpen(true)} style={({ pressed }) => [styles.dashedButton, pressed && styles.pressed]}>
            <Text style={styles.dashedButtonText}>+ Add appointment</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.md },
  pageTitle: { color: colors.navy, fontSize: 27, fontWeight: '700' },
  momentCard: { gap: spacing.xs, padding: spacing.lg, borderRadius: 16, backgroundColor: colors.navy },
  eyebrowOnDark: { color: '#9FB6CC', fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  momentTitle: { color: colors.white, fontSize: 20, fontWeight: '700' },
  momentDetail: { color: '#C9D8E6', fontSize: 14 },
  card: { padding: spacing.md, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 16 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  monthArrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  monthArrowText: { color: colors.navy, fontSize: 26 },
  monthTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  weekday: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  dayCircle: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  dayToday: { borderWidth: 1.5, borderColor: colors.lightBlue },
  daySelected: { borderWidth: 0, backgroundColor: colors.navy },
  dayText: { color: colors.text, fontSize: 14 },
  dayTextSelected: { color: colors.white, fontWeight: '700' },
  dayDot: { width: 5, height: 5, marginTop: 1, borderRadius: 3, backgroundColor: colors.lightBlue },
  dayDotHidden: { opacity: 0 },
  sectionHeading: { marginTop: spacing.xs },
  eyebrow: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  listCard: { paddingHorizontal: spacing.md, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 16 },
  emptyText: { paddingVertical: spacing.lg, color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  errorText: { color: '#A12626', fontSize: 13 },
  addForm: { gap: spacing.sm },
  addLabel: { color: colors.navy, fontSize: 13, fontWeight: '600' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  textInput: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.text,
    fontSize: 14,
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
  hint: { color: colors.textSecondary, fontSize: 12 },
  dashedButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.navy,
    borderRadius: 12,
  },
  dashedButtonText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.78 },
});
