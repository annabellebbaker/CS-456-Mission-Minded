import { useState } from 'react';
import { router } from 'expo-router';
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
import { useMissionaries } from '@/data/missionaries';
import { colors, spacing } from '@/theme/colors';

const missionLengths = ['18 months', '24 months', 'Not sure yet'];

/** Reads "MM / DD / YYYY" (spaces optional). Returns null for blank, undefined for invalid. */
function parseDate(text: string): Date | null | undefined {
  if (!text.trim()) return null;
  const match = text.replace(/\s/g, '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return undefined;
  const [, month, day, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day ? date : undefined;
}

function Field({ label, hint, ...inputProps }: { label: string; hint?: string } & TextInputProps) {
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
    </View>
  );
}

export default function LinkMissionaryScreen() {
  const { linkMissionary, setSelectedId } = useMissionaries();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [missionName, setMissionName] = useState('');
  const [mtcDate, setMtcDate] = useState('');
  const [missionLength, setMissionLength] = useState('');
  const [error, setError] = useState('');

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const save = () => {
    if (!name.trim()) {
      setError("Please enter the missionary's name.");
      return;
    }
    const parsedDate = parseDate(mtcDate);
    if (parsedDate === undefined) {
      setError('Enter the MTC date as MM / DD / YYYY, or leave it blank.');
      return;
    }

    const missionary = linkMissionary({
      name,
      relationship,
      missionName,
      mtcDate: parsedDate,
      missionLength: missionLength === 'Not sure yet' ? '' : missionLength,
    });
    setSelectedId(missionary.id);
    router.replace({ pathname: '/missionary/[id]', params: { id: missionary.id } });
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Pressable accessibilityRole="button" onPress={goBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹  Back</Text>
          </Pressable>

          <View style={styles.heading}>
            <Text style={styles.pageTitle}>Link a missionary</Text>
            <Text style={styles.mutedText}>Anything you don&apos;t know yet can be added later.</Text>
          </View>

          <View style={styles.card}>
            <Field label="Missionary name" value={name} onChangeText={setName} placeholder="e.g. Elder Sam Rivera" autoCapitalize="words" />
            <Field label="Your relationship" value={relationship} onChangeText={setRelationship} placeholder="e.g. Mom, Sister, Friend" autoCapitalize="words" />
            <Field
              label="Mission name"
              value={missionName}
              onChangeText={setMissionName}
              placeholder="e.g. Japan Tokyo South Mission"
              hint="Leave blank if the call hasn't come yet."
              autoCapitalize="words"
            />
            <Field
              label="MTC report date"
              value={mtcDate}
              onChangeText={setMtcDate}
              placeholder="MM / DD / YYYY"
              keyboardType="numbers-and-punctuation"
            />

            <View style={styles.field}>
              <Text style={styles.label}>Mission length</Text>
              <View style={styles.chips}>
                {missionLengths.map((length) => {
                  const selected = length === missionLength;
                  return (
                    <Pressable
                      key={length}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => setMissionLength(selected ? '' : length)}
                      style={[styles.chip, selected && styles.chipSelected]}>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{length}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {!!error && (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            )}

            <Pressable accessibilityRole="button" onPress={save} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>Save & connect</Text>
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
  hint: { color: colors.textSecondary, fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#D6DEE6',
    borderRadius: 20,
  },
  chipSelected: { borderColor: colors.navy, backgroundColor: colors.navy },
  chipText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  chipTextSelected: { color: colors.white },
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
});
