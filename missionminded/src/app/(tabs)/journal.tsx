import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText as Text, AppTextInput as TextInput } from '@/components/app-text';
import { MissionaryPicker } from '@/components/missionary-picker';
import { useMissionaries } from '@/data/missionaries';
import type { JournalEntry, MissionaryDetails } from '@/data/repository';
import { colors, spacing } from '@/theme/colors';

function formatDate(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function EntryCard({ entry }: { entry: JournalEntry }) {
  return (
    <View style={styles.entryCard}>
      <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
      {!!entry.title && <Text style={styles.entryTitle}>{entry.title}</Text>}
      <Text style={styles.entryBody}>{entry.body}</Text>
      <Text style={styles.entryAuthor}>Posted by {entry.author}</Text>
    </View>
  );
}

/** Only the main supporter sees this. Everyone else just reads the updates. */
function Composer({ missionary }: { missionary: MissionaryDetails }) {
  const { addJournalEntry } = useMissionaries();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const post = async () => {
    if (!body.trim()) {
      setError('Write an update before posting.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addJournalEntry(missionary.id, { title, body });
      setTitle('');
      setBody('');
      setOpen(false);
    } catch {
      setError('Could not post this update. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={({ pressed }) => [styles.dashedButton, pressed && styles.pressed]}>
        <Text style={styles.dashedButtonText}>+ Post an update about {missionary.firstName}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.composer}>
      <TextInput
        accessibilityLabel="Update title"
        value={title}
        onChangeText={setTitle}
        placeholder="Title (optional)"
        placeholderTextColor="#6F7C88"
        style={styles.input}
      />
      <TextInput
        accessibilityLabel="Update"
        autoFocus
        multiline
        value={body}
        onChangeText={setBody}
        placeholder={`What's new with ${missionary.firstName}?`}
        placeholderTextColor="#6F7C88"
        style={[styles.input, styles.bodyInput]}
      />
      {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
      <View style={styles.composerActions}>
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => void post()}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]}>
          <Text style={styles.primaryButtonText}>{saving ? 'Posting…' : 'Post update'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => setOpen(false)}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function JournalScreen() {
  const { missionaries, getById, selectedId } = useMissionaries();
  const missionary = getById(selectedId) ?? missionaries[0];

  if (!missionary) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Journal</Text>
          <Text style={styles.caption}>Link a missionary to follow their journal updates.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/link-missionary')} style={styles.dashedButton}>
            <Text style={styles.dashedButtonText}>+ Link a missionary</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const entries = [...missionary.journal].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Journal</Text>
        <MissionaryPicker />
        <Text style={styles.caption}>
          {missionary.isMainSupporter
            ? `You're ${missionary.firstName}'s main supporter. Your updates are shared with everyone supporting ${missionary.firstName}.`
            : `Updates from ${missionary.mainSupporter}, ${missionary.firstName}'s main supporter.`}
        </Text>

        {missionary.isMainSupporter && <Composer key={missionary.id} missionary={missionary} />}

        {entries.length === 0 ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>No updates yet.</Text>
          </View>
        ) : (
          entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
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
  caption: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  entryCard: { gap: spacing.xs, padding: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 16 },
  entryDate: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  entryTitle: { color: colors.navy, fontSize: 17, fontWeight: '700' },
  entryBody: { color: colors.text, fontSize: 15, lineHeight: 22 },
  entryAuthor: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 13 },
  composer: { gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 16, backgroundColor: '#F5F9FC' },
  input: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.text,
    fontSize: 14,
    backgroundColor: colors.white,
  },
  bodyInput: { minHeight: 110, textAlignVertical: 'top' },
  composerActions: { flexDirection: 'row', gap: spacing.sm },
  primaryButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.navy },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  secondaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 9 },
  secondaryButtonText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  errorText: { color: '#A12626', fontSize: 13 },
  disabled: { opacity: 0.6 },
  notice: { padding: spacing.md, borderRadius: 12, backgroundColor: '#F0F6FB' },
  noticeText: { color: colors.navy, fontSize: 14, textAlign: 'center' },
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
