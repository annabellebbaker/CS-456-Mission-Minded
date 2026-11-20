import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInputProps,
} from 'react-native';

import { AppText as Text, AppTextInput as TextInput } from '@/components/app-text';
import { getBundledMissionCatalog, loadMissionCatalog, type MissionCatalogEntry } from '@/data/mission-catalog';
import { useMissionaries } from '@/data/missionaries';
import { colors, spacing } from '@/theme/colors';

const titles = ['Elder', 'Sister'] as const;
const relationships = ['Parent', 'Sibling', 'Friend', 'Relative'] as const;
const missionLengths = ['18 months', '24 months', 'Other'] as const;
const durationUnits = ['days', 'months'] as const;

type MissionLengthChoice = typeof missionLengths[number];
type DurationUnit = typeof durationUnits[number];
type FieldErrorKey =
  | 'title'
  | 'firstName'
  | 'lastName'
  | 'relationship'
  | 'missionName'
  | 'mtcDate'
  | 'missionLength'
  | 'otherDuration'
  | 'otherUnit';

const eighteenMonthDayEquivalents = new Set([540, 546, 547, 548, 549, 550]);
const twentyFourMonthDayEquivalents = new Set([720, 730, 731]);

function duplicatedStandardMissionLength(duration: number, unit: DurationUnit | ''): 18 | 24 | undefined {
  if (unit === 'months' && duration === 18) return 18;
  if (unit === 'months' && duration === 24) return 24;
  if (unit === 'days' && eighteenMonthDayEquivalents.has(duration)) return 18;
  if (unit === 'days' && twentyFourMonthDayEquivalents.has(duration)) return 24;
  return undefined;
}

// Default field error codes/messages. Edit these values to match the final product copy.
const errorMessages: Record<FieldErrorKey | 'mtcDateInvalid' | 'save' | 'otherDuration18' | 'otherDuration24', string> = {
  title: 'AM001: Choose Elder or Sister.',
  firstName: 'AM002: Enter the missionary’s first name.',
  lastName: 'AM003: Enter the missionary’s last name.',
  relationship: 'AM004: Enter your relationship to the missionary.',
  missionName: 'AM005: Select or enter a mission.',
  mtcDate: 'AM006: Enter the MTC report date.',
  missionLength: 'AM007: Choose a mission length.',
  otherDuration: 'AM008: Enter a positive whole number for the custom length.',
  otherDuration18: 'Choose 18 months',
  otherDuration24: 'Choose 24 months',
  otherUnit: 'AM009: Choose days or months.',
  mtcDateInvalid: 'AM010: Use a real date in MM / DD / YYYY format.',
  save: 'AM011: Could not save. Check your connection and try again.',
};

/** Reads "MM / DD / YYYY" (spaces optional). Returns null for blank, undefined for invalid. */
function parseDate(text: string): Date | null | undefined {
  if (!text.trim()) return null;
  const match = text.replace(/\s/g, '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return undefined;
  const [, month, day, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day ? date : undefined;
}

function Field({ label, hint, error, ...inputProps }: { label: string; hint?: string; error?: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#6F7C88"
        style={styles.textInput}
        {...inputProps}
      />
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </View>
  );
}

function DropdownField({
  label,
  value,
  placeholder,
  options,
  error,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: readonly string[];
  error?: string;
  onSelect: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((open) => !open)}
        style={({ pressed }) => [styles.dropdown, pressed && styles.pressed]}>
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>{value || placeholder}</Text>
        <View accessibilityElementsHidden style={[styles.dropdownChevron, expanded && styles.dropdownChevronExpanded]} />
      </Pressable>
      {expanded && (
        <View style={styles.dropdownOptions}>
          {options.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: option === value }}
              onPress={() => {
                onSelect(option);
                setExpanded(false);
              }}
              style={({ pressed }) => [styles.dropdownOption, pressed && styles.pressed]}>
              <Text style={[styles.dropdownOptionText, option === value && styles.dropdownOptionTextSelected]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </View>
  );
}

export default function AddMissionaryScreen() {
  const { id: editIdParam } = useLocalSearchParams<{ id?: string }>();
  const editId = Array.isArray(editIdParam) ? editIdParam[0] : editIdParam;
  const { addMissionary, updateMissionary, getById, setSelectedId } = useMissionaries();
  const missionaryToEdit = editId ? getById(editId) : undefined;
  const initialMtcDate = missionaryToEdit?.moments.find((moment) => moment.phase === 'mtc')?.when ?? '';
  const parsedInitialMtcDate = new Date(initialMtcDate);
  const initialMtcDateInput = Number.isNaN(parsedInitialMtcDate.getTime())
    ? ''
    : `${String(parsedInitialMtcDate.getMonth() + 1).padStart(2, '0')}/${String(parsedInitialMtcDate.getDate()).padStart(2, '0')}/${parsedInitialMtcDate.getFullYear()}`;
  const initialLengthMatch = /^(\d+)\s+(days|months)$/i.exec(missionaryToEdit?.missionLength ?? '');
  const [title, setTitle] = useState(missionaryToEdit?.title ?? '');
  const [firstName, setFirstName] = useState(missionaryToEdit?.firstName ?? '');
  const [lastName, setLastName] = useState(missionaryToEdit?.lastName ?? '');
  const [relationship, setRelationship] = useState(
    relationships.includes(missionaryToEdit?.relationship as typeof relationships[number]) ? missionaryToEdit?.relationship ?? '' : '',
  );
  const [missionName, setMissionName] = useState(missionaryToEdit?.missionName ?? '');
  const [selectedMissionId, setSelectedMissionId] = useState(missionaryToEdit?.missionId ?? '');
  const [mtcDate, setMtcDate] = useState(initialMtcDateInput);
  const [pickerDate, setPickerDate] = useState(() => {
    const parsed = parseDate(initialMtcDateInput);
    return parsed instanceof Date ? parsed : new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(pickerDate.getFullYear(), pickerDate.getMonth(), 1));
  const [missionLength, setMissionLength] = useState<MissionLengthChoice | ''>(
    initialLengthMatch ? 'Other' : missionLengths.includes(missionaryToEdit?.missionLength as MissionLengthChoice) ? missionaryToEdit?.missionLength as MissionLengthChoice : '',
  );
  const [otherDuration, setOtherDuration] = useState(initialLengthMatch?.[1] ?? '');
  const [otherUnit, setOtherUnit] = useState<DurationUnit | ''>((initialLengthMatch?.[2].toLowerCase() as DurationUnit | undefined) ?? '');
  const [missionOptions, setMissionOptions] = useState<MissionCatalogEntry[]>(getBundledMissionCatalog);
  const [missionCatalogLoading, setMissionCatalogLoading] = useState(true);
  const [missionCatalogError, setMissionCatalogError] = useState(false);
  const [missionInputFocused, setMissionInputFocused] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const clearErrors = (...keys: FieldErrorKey[]) => {
    setErrors((current) => {
      const next = { ...current };
      keys.forEach((key) => delete next[key]);
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    void loadMissionCatalog()
      .then((entries) => {
        if (active) setMissionOptions(entries);
      })
      .catch(() => {
        if (active) setMissionCatalogError(true);
      })
      .finally(() => {
        if (active) setMissionCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const matchingMissions = useMemo(() => {
    const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();
    const search = normalize(missionName.trim());
    if (search.length < 2) return [];
    return missionOptions
      .filter((mission) => normalize(mission.name).includes(search))
      .sort((a, b) => {
        const aStartsWithSearch = normalize(a.name).startsWith(search);
        const bStartsWithSearch = normalize(b.name).startsWith(search);
        if (aStartsWithSearch !== bStartsWithSearch) return aStartsWithSearch ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [missionName, missionOptions]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const visibleDayCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    return Array.from({ length: visibleDayCount }, (_, index) => {
      const date = new Date(year, month, index - firstWeekday + 1);
      return { date, inMonth: date.getMonth() === month };
    });
  }, [calendarMonth]);

  const save = async () => {
    const nextErrors: Partial<Record<FieldErrorKey, string>> = {};
    if (!title) nextErrors.title = errorMessages.title;
    if (!firstName.trim()) nextErrors.firstName = errorMessages.firstName;
    if (!lastName.trim()) nextErrors.lastName = errorMessages.lastName;
    if (!relationship.trim()) nextErrors.relationship = errorMessages.relationship;
    if (!missionName.trim()) nextErrors.missionName = errorMessages.missionName;

    const parsedDate = parseDate(mtcDate);
    if (!mtcDate.trim()) nextErrors.mtcDate = errorMessages.mtcDate;
    else if (!parsedDate) nextErrors.mtcDate = errorMessages.mtcDateInvalid;

    if (!missionLength) nextErrors.missionLength = errorMessages.missionLength;
    if (missionLength === 'Other') {
      const duration = Number(otherDuration);
      if (!Number.isInteger(duration) || duration <= 0) nextErrors.otherDuration = errorMessages.otherDuration;
      else {
        const duplicateLength = duplicatedStandardMissionLength(duration, otherUnit);
        if (duplicateLength === 18) nextErrors.otherDuration = errorMessages.otherDuration18;
        if (duplicateLength === 24) nextErrors.otherDuration = errorMessages.otherDuration24;
      }
      if (!otherUnit) nextErrors.otherUnit = errorMessages.otherUnit;
    }

    setErrors(nextErrors);
    setSaveError('');
    if (Object.keys(nextErrors).length > 0 || !parsedDate) {
      return;
    }

    const normalizedMissionLength = missionLength === 'Other'
      ? `${Number(otherDuration)} ${otherUnit}`
      : missionLength;

    setSaving(true);
    try {
      const form = {
        title: title as 'Elder' | 'Sister',
        firstName,
        lastName,
        relationship,
        missionName,
        missionId: selectedMissionId,
        mtcDate: parsedDate,
        missionLength: normalizedMissionLength,
      };
      if (editId) {
        await updateMissionary(editId, form);
        setSelectedId(editId);
        router.replace({ pathname: '/missionary/[id]', params: { id: editId } });
      } else {
        const missionary = await addMissionary(form);
        setSelectedId(missionary.id);
        router.replace({ pathname: '/missionary/[id]', params: { id: missionary.id } });
      }
    } catch {
      setSaveError(errorMessages.save);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Pressable accessibilityRole="button" onPress={goBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹  Back</Text>
          </Pressable>

          <View style={styles.heading}>
            <Text style={styles.pageTitle}>{editId ? 'Edit missionary details' : 'Add a Missionary'}</Text>
            <Text style={styles.mutedText}>All fields marked with * are required.</Text>
          </View>

          <View style={styles.card}>
            <DropdownField
              label="Title *"
              value={title}
              placeholder="Choose Elder or Sister"
              options={titles}
              error={errors.title}
              onSelect={(value) => {
                setTitle(value);
                clearErrors('title');
              }}
            />
            <Field
              label="First name *"
              value={firstName}
              onChangeText={(value) => {
                setFirstName(value);
                clearErrors('firstName');
              }}
              placeholder="e.g. Sam"
              autoCapitalize="words"
              error={errors.firstName}
            />
            <Field
              label="Last name *"
              value={lastName}
              onChangeText={(value) => {
                setLastName(value);
                clearErrors('lastName');
              }}
              placeholder="e.g. Rivera"
              autoCapitalize="words"
              error={errors.lastName}
            />
            <DropdownField
              label="Your relationship *"
              value={relationship}
              placeholder="Choose your relationship"
              options={relationships}
              error={errors.relationship}
              onSelect={(value) => {
                setRelationship(value);
                clearErrors('relationship');
              }}
            />
            <Field
              label="Mission name *"
              value={missionName}
              onFocus={() => setMissionInputFocused(true)}
              onChangeText={(value) => {
                setMissionName(value);
                setSelectedMissionId('');
                clearErrors('missionName');
              }}
              placeholder="e.g. Japan Tokyo South Mission"
              hint="Search and select a mission, or enter its name."
              autoCapitalize="words"
              error={errors.missionName}
            />
            {missionInputFocused && missionName.trim().length >= 2 && matchingMissions.length > 0 && (
              <View accessibilityRole="list" style={styles.missionSuggestions}>
                {matchingMissions.map((mission) => (
                  <Pressable
                    key={mission.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setMissionName(mission.name);
                      setSelectedMissionId(mission.id);
                      setMissionInputFocused(false);
                      clearErrors('missionName');
                    }}
                    style={({ pressed }) => [styles.missionSuggestion, pressed && styles.pressed]}>
                    <Text style={styles.missionSuggestionName}>{mission.name}</Text>
                    {!!mission.region && <Text style={styles.missionSuggestionRegion}>{mission.region}</Text>}
                  </Pressable>
                ))}
              </View>
            )}
            {missionInputFocused && missionName.trim().length >= 2 && matchingMissions.length === 0 && (
              <Text style={styles.hint}>
                {missionCatalogLoading
                  ? 'Loading mission names…'
                  : missionCatalogError
                    ? 'Mission names could not load. You can still enter the name manually.'
                    : 'No matching mission. You can enter the name manually.'}
              </Text>
            )}
            <View style={styles.field}>
              <Text style={styles.label}>MTC report date *</Text>
              {Platform.OS === 'web' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose MTC report date from calendar"
                  accessibilityState={{ expanded: showDatePicker }}
                  onPress={() => {
                    setCalendarMonth(new Date(pickerDate.getFullYear(), pickerDate.getMonth(), 1));
                    setShowDatePicker((visible) => !visible);
                  }}
                  style={({ pressed }) => [styles.datePickerButton, pressed && styles.pressed]}>
                  <Text style={[styles.dropdownText, !mtcDate && styles.dropdownPlaceholder]}>
                    {mtcDate || 'Choose a date'}
                  </Text>
                  <View style={styles.calendarIcon}>
                    <View style={styles.calendarIconHeader} />
                  </View>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={mtcDate ? `Choose MTC report date from calendar. Selected ${mtcDate}` : 'Choose MTC report date from calendar'}
                  accessibilityState={{ expanded: showDatePicker }}
                  onPress={() => {
                    setCalendarMonth(new Date(pickerDate.getFullYear(), pickerDate.getMonth(), 1));
                    setShowDatePicker((visible) => !visible);
                  }}
                  style={({ pressed }) => [styles.datePickerButton, pressed && styles.pressed]}>
                  <Text style={[styles.dropdownText, !mtcDate && styles.dropdownPlaceholder]}>
                    {mtcDate || 'Choose date'}
                  </Text>
                  <View style={styles.calendarIcon}>
                    <View style={styles.calendarIconHeader} />
                  </View>
                </Pressable>
              )}
              {showDatePicker && (
                <View style={styles.webCalendar}>
                  <View style={styles.webCalendarHeader}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Previous year"
                      onPress={() => setCalendarMonth((current) => new Date(current.getFullYear() - 1, current.getMonth(), 1))}
                      style={({ pressed }) => [styles.calendarNavButton, pressed && styles.pressed]}>
                      <Text style={styles.calendarNavText}>«</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Previous month"
                      onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                      style={({ pressed }) => [styles.calendarNavButton, pressed && styles.pressed]}>
                      <Text style={styles.calendarNavText}>‹</Text>
                    </Pressable>
                    <Text style={styles.calendarMonthTitle}>
                      {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next month"
                      onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                      style={({ pressed }) => [styles.calendarNavButton, pressed && styles.pressed]}>
                      <Text style={styles.calendarNavText}>›</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next year"
                      onPress={() => setCalendarMonth((current) => new Date(current.getFullYear() + 1, current.getMonth(), 1))}
                      style={({ pressed }) => [styles.calendarNavButton, pressed && styles.pressed]}>
                      <Text style={styles.calendarNavText}>»</Text>
                    </Pressable>
                  </View>
                  <View style={styles.calendarGrid}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <View key={day} style={styles.calendarWeekday}>
                        <Text style={styles.calendarWeekdayText}>{day}</Text>
                      </View>
                    ))}
                    {calendarDays.map(({ date, inMonth }) => {
                      const selected = date.toDateString() === pickerDate.toDateString() && Boolean(mtcDate);
                      return (
                        <Pressable
                          key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                          accessibilityRole="button"
                          accessibilityLabel={date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          accessibilityState={{ selected }}
                          onPress={() => {
                            setPickerDate(date);
                            setMtcDate(`${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`);
                            setShowDatePicker(false);
                            clearErrors('mtcDate');
                          }}
                          style={({ pressed }) => [
                            styles.calendarDay,
                            !inMonth && styles.calendarDayOutside,
                            selected && styles.calendarDaySelected,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={[
                            styles.calendarDayText,
                            !inMonth && styles.calendarDayOutsideText,
                            selected && styles.calendarDaySelectedText,
                          ]}>{date.getDate()}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
              {!!errors.mtcDate && <Text accessibilityRole="alert" style={styles.error}>{errors.mtcDate}</Text>}
            </View>

            <DropdownField
              label="Mission length *"
              value={missionLength}
              placeholder="Choose a mission length"
              options={missionLengths}
              error={errors.missionLength}
              onSelect={(value) => {
                const selection = value as MissionLengthChoice;
                setMissionLength(selection);
                clearErrors('missionLength', 'otherDuration', 'otherUnit');
                if (selection !== 'Other') {
                  setOtherDuration('');
                  setOtherUnit('');
                }
              }}
            />
            {missionLength === 'Other' && (
              <>
                <Field
                  label="Custom mission length *"
                  value={otherDuration}
                  onChangeText={(value) => {
                    setOtherDuration(value.replace(/[^0-9]/g, ''));
                    clearErrors('otherDuration');
                  }}
                  placeholder="Enter a number"
                  keyboardType="number-pad"
                  error={errors.otherDuration}
                />
                <DropdownField
                  label="Custom length format *"
                  value={otherUnit}
                  placeholder="Choose days or months"
                  options={durationUnits}
                  error={errors.otherUnit}
                  onSelect={(value) => {
                    setOtherUnit(value as DurationUnit);
                    clearErrors('otherUnit');
                  }}
                />
              </>
            )}

            {!!saveError && <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text>}

            <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]}>
              <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : editId ? 'Save details' : 'Add a Missionary'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.md },
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
  heading: { gap: spacing.xs },
  pageTitle: { color: colors.navy, fontSize: 24, fontWeight: '700' },
  mutedText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  card: { gap: spacing.lg, padding: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 16 },
  field: { gap: spacing.xs },
  label: { color: colors.navy, fontSize: 13, fontWeight: '700' },
  textInput: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.text,
    fontSize: 15,
  },
  datePickerButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.white,
  },
  webCalendar: { gap: spacing.xs, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white },
  webCalendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarNavButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#F0F4F7' },
  calendarNavText: { color: colors.navy, fontSize: 21, lineHeight: 25, fontWeight: '600' },
  calendarMonthTitle: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarWeekday: { width: '14.2857%', height: 25, alignItems: 'center', justifyContent: 'center' },
  calendarWeekdayText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  calendarDay: { width: '14.2857%', height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  calendarDayOutside: { opacity: 0.45 },
  calendarDaySelected: { backgroundColor: colors.navy },
  calendarDayText: { color: colors.text, fontSize: 13 },
  calendarDayOutsideText: { color: colors.textSecondary },
  calendarDaySelectedText: { color: colors.white, fontWeight: '700' },
  calendarIcon: { width: 17, height: 17, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.navy, borderRadius: 3 },
  calendarIconHeader: { height: 5, borderBottomWidth: 1.5, borderBottomColor: colors.navy, backgroundColor: '#EAF2F8' },
  hint: { color: colors.textSecondary, fontSize: 12 },
  dropdown: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.white,
  },
  dropdownText: { color: colors.text, fontSize: 15 },
  dropdownPlaceholder: { color: '#6F7C88' },
  dropdownChevron: {
    width: 9,
    height: 9,
    marginTop: -4,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.navy,
    transform: [{ rotate: '45deg' }],
  },
  dropdownChevronExpanded: { marginTop: 4, transform: [{ rotate: '225deg' }] },
  dropdownOptions: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.white,
  },
  dropdownOption: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EBEF',
  },
  dropdownOptionText: { color: colors.text, fontSize: 14 },
  dropdownOptionTextSelected: { color: colors.navy, fontWeight: '700' },
  missionSuggestions: {
    maxHeight: 240,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  missionSuggestion: {
    minHeight: 48,
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EBEF',
  },
  missionSuggestionName: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  missionSuggestionRegion: { color: colors.textSecondary, fontSize: 11 },
  error: { color: '#B3261E', fontSize: 14 },
  primaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.navy,
  },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.6 },
});
