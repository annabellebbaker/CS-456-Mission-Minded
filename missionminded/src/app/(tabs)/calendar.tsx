import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useMissionaries } from '@/data/missionaries-context';
import { colors, spacing } from '@/theme/colors';

type Appointment = { id: number; missionaryId: string; title: string; dateKey: string };

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function CalendarScreen() {
  const { missionaries } = useMissionaries();
  const [selectedMissionaryId, setSelectedMissionaryId] = useState(missionaries[0]?.id ?? '');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [checkedTodos, setCheckedTodos] = useState<Record<string, boolean>>({});
  const [appointmentError, setAppointmentError] = useState('');

  const missionary = missionaries.find((item) => item.id === selectedMissionaryId) ?? missionaries[0];
  const nextMilestone = missionary?.journey.find((item) => item.state === 'upcoming')
    ?? missionary?.journey.find((item) => item.state === 'current');
  const appointmentsForMonth = useMemo(
    () => appointments.filter((item) => item.missionaryId === missionary?.id),
    [appointments, missionary?.id],
  );
  const selectedDayAppointments = appointmentsForMonth.filter((item) => item.dateKey === dateKey(selectedDate));
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDayOfMonth + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const todoItems = missionary
    ? [
        { id: `${missionary.id}-scripture`, title: 'Read a scripture as a family' },
        { id: `${missionary.id}-prayer`, title: `Pray for ${missionary.firstName}` },
      ]
    : [];

  const moveMonth = (amount: number) => {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + amount, 1);
    setMonth(nextMonth);
    setSelectedDate(nextMonth);
  };

  const addAppointment = () => {
    const title = appointmentTitle.trim();
    if (!title || !missionary) {
      setAppointmentError('Enter an appointment name first.');
      return;
    }

    setAppointments((current) => [
      ...current,
      { id: Date.now(), missionaryId: missionary.id, title, dateKey: dateKey(selectedDate) },
    ]);
    setAppointmentTitle('');
    setAppointmentError('');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.brand}>MissionMinded</Text>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>Keep up with the moments that matter.</Text>
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

        {missionary && (
          <View style={styles.nextCard}>
            <Text style={styles.sectionLabel}>NEXT MILESTONE</Text>
            <Text style={styles.nextTitle}>{nextMilestone?.title ?? 'Milestones can be added later'}</Text>
            <Text style={styles.mutedText}>{nextMilestone?.description ?? 'Add dates and details as you learn them.'}</Text>
          </View>
        )}

        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => moveMonth(-1)}
              style={({ pressed }) => [styles.monthArrow, pressed && styles.pressed]}>
              <Text style={styles.monthArrowText}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() => moveMonth(1)}
              style={({ pressed }) => [styles.monthArrow, pressed && styles.pressed]}>
              <Text style={styles.monthArrowText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.calendarGrid}>
            {weekdayLabels.map((label, index) => (
              <View key={`${label}-${index}`} style={styles.dayCell}>
                <Text style={styles.weekday}>{label}</Text>
              </View>
            ))}
            {calendarDays.map((day, index) => {
              if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
              const date = new Date(month.getFullYear(), month.getMonth(), day);
              const selected = dateKey(date) === dateKey(selectedDate);
              const hasAppointment = appointmentsForMonth.some((item) => item.dateKey === dateKey(date));
              return (
                <Pressable
                  key={dateKey(date)}
                  accessibilityRole="button"
                  accessibilityLabel={date.toLocaleDateString()}
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedDate(date)}
                  style={({ pressed }) => [styles.dayCell, styles.dayButton, selected && styles.selectedDay, pressed && styles.pressed]}>
                  <Text style={[styles.dayText, selected && styles.selectedDayText]}>{day}</Text>
                  {hasAppointment && <View style={[styles.eventDot, selected && styles.eventDotSelected]} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>TO DOS</Text>
          {todoItems.map((item) => {
            const checked = Boolean(checkedTodos[item.id]);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => setCheckedTodos((current) => ({ ...current, [item.id]: !current[item.id] }))}
                style={({ pressed }) => [styles.todoRow, pressed && styles.pressed]}>
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.todoText, checked && styles.todoTextChecked]}>{item.title}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>APPOINTMENTS · {formatDate(selectedDate).toUpperCase()}</Text>
          {selectedDayAppointments.length ? selectedDayAppointments.map((item) => (
            <View key={item.id} style={styles.appointmentRow}>
              <View style={styles.appointmentDot} />
              <Text style={styles.appointmentText}>{item.title}</Text>
            </View>
          )) : <Text style={styles.mutedText}>No appointments yet for this day.</Text>}
          <View style={styles.addAppointmentRow}>
            <TextInput
              accessibilityLabel="Appointment name"
              value={appointmentTitle}
              onChangeText={(value) => {
                setAppointmentTitle(value);
                if (value.trim()) setAppointmentError('');
              }}
              onSubmitEditing={addAppointment}
              placeholder="Add an appointment"
              placeholderTextColor="#6F7C88"
              returnKeyType="done"
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              onPress={addAppointment}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
          {appointmentError ? <Text accessibilityRole="alert" style={styles.errorText}>{appointmentError}</Text> : null}
        </View>
      </View>
    </ScrollView>
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
  nextCard: { gap: spacing.xs, padding: spacing.lg, borderRadius: 14, backgroundColor: '#F0F6FB' },
  nextTitle: { color: colors.navy, fontSize: 17, fontWeight: '700' },
  mutedText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  calendarCard: { gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 14 },
  monthHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthArrow: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  monthArrowText: { color: colors.navy, fontSize: 27, lineHeight: 30 },
  monthTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  weekday: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  dayButton: { borderRadius: 20 },
  selectedDay: { backgroundColor: colors.navy },
  dayText: { color: colors.text, fontSize: 14 },
  selectedDayText: { color: colors.white, fontWeight: '700' },
  eventDot: { position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.lightBlue },
  eventDotSelected: { backgroundColor: colors.white },
  sectionCard: { gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 14, backgroundColor: colors.white },
  todoRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkbox: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.navy, borderRadius: 5 },
  checkboxChecked: { backgroundColor: colors.navy },
  checkmark: { color: colors.white, fontSize: 15, lineHeight: 18, fontWeight: '700' },
  todoText: { flex: 1, color: colors.text, fontSize: 14 },
  todoTextChecked: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  appointmentRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  appointmentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.lightBlue },
  appointmentText: { color: colors.text, fontSize: 14 },
  addAppointmentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { flex: 1, minHeight: 46, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 9, color: colors.text, fontSize: 14 },
  addButton: { minHeight: 46, minWidth: 62, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: 9, backgroundColor: colors.navy },
  addButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  errorText: { color: '#B42318', fontSize: 13 },
  pressed: { opacity: 0.78 },
});
