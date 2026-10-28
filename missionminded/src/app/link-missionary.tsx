import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useMissionaries } from '@/data/missionaries-context';
import { colors, spacing } from '@/theme/colors';

export default function LinkMissionaryScreen() {
  const { addMissionary } = useMissionaries();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [missionName, setMissionName] = useState('');
  const [mtcReportDate, setMtcReportDate] = useState('');
  const [missionLengthMonths, setMissionLengthMonths] = useState('');
  const [nameError, setNameError] = useState('');

  const submit = () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setNameError('Enter your missionary’s name to continue.');
      return;
    }

    const id = addMissionary({
      name: cleanName,
      relationship,
      missionName,
      mtcReportDate,
      missionLengthMonths,
    });
    router.replace({ pathname: '/missionary/[id]', params: { id } });
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
          <Text style={styles.backText}>‹  Back</Text>
        </Pressable>

        <View style={styles.heading}>
          <Text style={styles.title}>Link a missionary</Text>
          <Text style={styles.intro}>Add someone you support. You can fill in details as you learn them.</Text>
        </View>

        <View style={styles.form}>
          <FormField
            label="Missionary name"
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (value.trim()) setNameError('');
            }}
            placeholder="For example, Elder Jordan Smith"
            error={nameError}
            required
          />
          <FormField
            label="Your relationship"
            value={relationship}
            onChangeText={setRelationship}
            placeholder="For example, Mom, sibling, or friend"
          />
          <FormField
            label="Mission name"
            value={missionName}
            onChangeText={setMissionName}
            placeholder="Add later if you don’t know yet"
          />
          <FormField
            label="MTC report date"
            value={mtcReportDate}
            onChangeText={setMtcReportDate}
            placeholder="For example, Jan 12, 2027"
          />
          <FormField
            label="Mission length in months"
            value={missionLengthMonths}
            onChangeText={setMissionLengthMonths}
            placeholder="Add later if unknown"
            keyboardType="number-pad"
          />
        </View>

        <Text style={styles.note}>These details stay on this device in the Phase 1 prototype and reset when you refresh.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={submit}
          style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}>
          <Text style={styles.submitText}>Link missionary</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required ? ' *' : ' (optional)'}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={required ? 'Required field' : 'Optional field; you can add this later'}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6F7C88"
        keyboardType={keyboardType}
        returnKeyType="next"
        style={[styles.input, error && styles.inputError]}
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.lg },
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
  heading: { gap: spacing.sm },
  title: { color: colors.navy, fontSize: 26, fontWeight: '700' },
  intro: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  form: { gap: spacing.md },
  field: { gap: spacing.xs },
  label: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#AEB8C2',
    borderRadius: 9,
    color: colors.text,
    fontSize: 15,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: '#B42318' },
  error: { color: '#B42318', fontSize: 13 },
  note: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  submitButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.navy,
  },
  submitText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.78 },
});
