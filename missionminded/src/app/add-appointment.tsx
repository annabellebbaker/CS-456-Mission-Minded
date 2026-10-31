import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useMissionaries } from '@/data/missionaries-context';
import { colors, spacing } from '@/theme/colors';

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function parseRouteDate(value: string | string[] | undefined) {
  const dateString = Array.isArray(value) ? value[0] : value;
  const match = dateString?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AddAppointmentScreen() {
  const { missionaryId: routeMissionaryId, date: routeDate } = useLocalSearchParams<{
    missionaryId?: string;
    date?: string;
  }>();
  const { missionaries, addAppointment } = useMissionaries();
  const initialDate = parseRouteDate(routeDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [month, setMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedMissionaryId, setSelectedMissionaryId] = useState(
    Array.isArray(routeMissionaryId) ? routeMissionaryId[0] : routeMissionaryId ?? missionaries[0]?.id ?? '',
  );
  const [title, setTitle] = useState('');
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [error, setError] = useState('');
  const missionary = missionaries.find((item) => item.id === selectedMissionaryId) ?? missionaries[0];
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDayOfMonth + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  const updateMonth = (amount: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const saveAppointment = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Add a title for this appointment.');
      return;
    }
    if (!missionary) {
      setError('Link a missionary before adding an appointment.');
      return;
    }

    const hour24 = (hour % 12) + (period === 'PM' ? 12 : 0);
    const startsAt = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hour24,
      minute,
      0,
      0,
    );
    addAppointment({ missionaryId: missionary.id, title: cleanTitle, startsAt: startsAt.toISOString() });
    router.back();
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backText}>‹  Calendar</Text>
        </Pressable>

        <View style={styles.heading}>
          <Text style={styles.title}>Add appointment</Text>
          <Text style={styles.subtitle}>Choose a date and time, then give it a title.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>FOR</Text>
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

          <Text style={styles.fieldLabel}>TITLE</Text>
          <TextInput
            accessibilityLabel="Appointment title"
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              if (value.trim()) setError('');
            }}
            placeholder="For example, family call"
            placeholderTextColor="#6F7C88"
            returnKeyType="done"
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>DATE</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: datePickerOpen }}
            onPress={() => setDatePickerOpen((open) => !open)}
            style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}>
            <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
            <Text style={styles.dateButtonIcon}>{datePickerOpen ? '−' : '⌄'}</Text>
          </Pressable>

          {datePickerOpen && (
            <View style={styles.datePicker}>
              <View style={styles.monthHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  onPress={() => updateMonth(-1)}
                  style={({ pressed }) => [styles.monthArrow, pressed && styles.pressed]}>
                  <Text style={styles.monthArrowText}>‹</Text>
                </Pressable>
                <Text style={styles.monthTitle}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  onPress={() => updateMonth(1)}
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
                  const selected = date.toDateString() === selectedDate.toDateString();
                  return (
                    <Pressable
                      key={day}
                      accessibilityRole="button"
                      accessibilityLabel={date.toLocaleDateString()}
                      accessibilityState={{ selected }}
                      onPress={() => {
                        setSelectedDate(date);
                        setDatePickerOpen(false);
                      }}
                      style={({ pressed }) => [styles.dayCell, styles.dayButton, selected && styles.selectedDay, pressed && styles.pressed]}>
                      <Text style={[styles.dayText, selected && styles.selectedDayText]}>{day}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <Text style={styles.fieldLabel}>TIME</Text>
          <View style={styles.timePicker}>
            <TimeUnit label="HOUR" value={`${hour}`.padStart(2, '0')} onPrevious={() => setHour((value) => value === 1 ? 12 : value - 1)} onNext={() => setHour((value) => value === 12 ? 1 : value + 1)} />
            <Text style={styles.timeColon}>:</Text>
            <TimeUnit label="MINUTES" value={`${minute}`.padStart(2, '0')} onPrevious={() => setMinute((value) => (value + 45) % 60)} onNext={() => setMinute((value) => (value + 15) % 60)} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Toggle AM or PM, currently ${period}`}
              onPress={() => setPeriod((value) => value === 'AM' ? 'PM' : 'AM')}
              style={({ pressed }) => [styles.periodButton, pressed && styles.pressed]}>
              <Text style={styles.periodText}>{period}</Text>
            </Pressable>
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            onPress={saveAppointment}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
            <Text style={styles.saveButtonText}>Save appointment</Text>
          </Pressable>
          <Text style={styles.notice}>Appointments stay on this device for this session. If notifications are enabled in Profile, this device will remind you one day before.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function TimeUnit({
  label,
  value,
  onPrevious,
  onNext,
}: {
  label: string;
  value: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.timeUnit}>
      <Text style={styles.timeUnitLabel}>{label}</Text>
      <View style={styles.timeUnitControls}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label.toLowerCase()}`} onPress={onPrevious} style={({ pressed }) => [styles.timeControl, pressed && styles.pressed]}>
          <Text style={styles.timeControlText}>−</Text>
        </Pressable>
        <Text style={styles.timeValue}>{value}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label.toLowerCase()}`} onPress={onNext} style={({ pressed }) => [styles.timeControl, pressed && styles.pressed]}>
          <Text style={styles.timeControlText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.lg },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 9 },
  backText: { color: colors.navy, fontSize: 15, fontWeight: '600' },
  heading: { gap: spacing.xs },
  title: { color: colors.navy, fontSize: 26, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  card: { gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 14 },
  fieldLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  selectorRow: { gap: spacing.sm, paddingVertical: 2 },
  selectorChip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 20 },
  selectorChipSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  selectorText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  selectorTextSelected: { color: colors.white },
  input: { minHeight: 48, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 9, color: colors.text, fontSize: 15 },
  dateButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 9 },
  dateButtonText: { color: colors.text, fontSize: 14 },
  dateButtonIcon: { color: colors.navy, fontSize: 20 },
  datePicker: { gap: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 10 },
  monthHeader: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthArrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  monthArrowText: { color: colors.navy, fontSize: 25, lineHeight: 28 },
  monthTitle: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  weekday: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  dayButton: { borderRadius: 20 },
  selectedDay: { backgroundColor: colors.navy },
  dayText: { color: colors.text, fontSize: 13 },
  selectedDayText: { color: colors.white, fontWeight: '700' },
  timePicker: { minHeight: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  timeUnit: { flex: 1, alignItems: 'center', gap: spacing.xs },
  timeUnitLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  timeUnitControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  timeControl: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 17 },
  timeControlText: { color: colors.navy, fontSize: 20, lineHeight: 22 },
  timeValue: { minWidth: 24, color: colors.navy, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  timeColon: { color: colors.navy, fontSize: 20, fontWeight: '700', marginTop: spacing.md },
  periodButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: 9, backgroundColor: '#F0F6FB' },
  periodText: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  errorText: { color: '#B42318', fontSize: 13 },
  saveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.navy },
  saveButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  notice: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.78 },
});
