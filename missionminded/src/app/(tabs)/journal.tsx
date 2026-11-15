import { useRef, useState } from 'react';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

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
      {!!entry.imageUrl && (
        <Image accessibilityLabel={entry.title || 'Journal photo'} source={{ uri: entry.imageUrl }} style={styles.entryImage} />
      )}
      <Text style={styles.entryBody}>{entry.body}</Text>
      <Text style={styles.entryAuthor}>Posted by {entry.author}</Text>
    </View>
  );
}

/** Only the main supporter sees this. Everyone else just reads the updates. */
function Composer({ missionary, onClose }: { missionary: MissionaryDetails; onClose: () => void }) {
  const { addJournalEntry } = useMissionaries();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pickPhoto = async () => {
    setError('');
    setPickingPhoto(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (result.canceled) return;
      const selectedPhoto = result.assets[0];
      if (selectedPhoto.fileSize && selectedPhoto.fileSize > 10 * 1024 * 1024) {
        setError('Choose a photo smaller than 10 MB.');
        return;
      }
      setPhoto(selectedPhoto);
    } catch {
      setError('Could not open your photos. Please try again.');
    } finally {
      setPickingPhoto(false);
    }
  };

  const post = async () => {
    if (!body.trim()) {
      setError('Add a caption before posting.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addJournalEntry(missionary.id, {
        title,
        body,
        ...(photo ? { photo: { uri: photo.uri, mimeType: photo.mimeType } } : {}),
      });
      setTitle('');
      setBody('');
      setPhoto(null);
      onClose();
    } catch {
      setError('Could not post this update. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

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
        accessibilityLabel="Caption"
        autoFocus
        multiline
        value={body}
        onChangeText={setBody}
        placeholder={`Write a caption about ${missionary.firstName}...`}
        placeholderTextColor="#6F7C88"
        style={[styles.input, styles.bodyInput]}
      />
      {photo ? (
        <View style={styles.photoPreviewWrap}>
          <Image accessibilityLabel="Selected journal photo preview" source={{ uri: photo.uri }} style={styles.photoPreview} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove selected photo"
            disabled={saving}
            onPress={() => setPhoto(null)}
            style={({ pressed }) => [styles.removePhotoButton, pressed && styles.pressed]}>
            <Text style={styles.removePhotoText}>Remove photo</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={pickingPhoto || saving}
          onPress={() => void pickPhoto()}
          style={({ pressed }) => [styles.addPhotoButton, pressed && styles.pressed, (pickingPhoto || saving) && styles.disabled]}>
          <Text style={styles.addPhotoButtonText}>{pickingPhoto ? 'Opening photos...' : '+ Add photo'}</Text>
        </Pressable>
      )}
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
          onPress={() => {
            onClose();
            setTitle('');
            setBody('');
            setPhoto(null);
            setError('');
          }}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, saving && styles.disabled]}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function JournalScreen() {
  const { missionaries, getById, selectedId } = useMissionaries();
  const missionary = getById(selectedId) ?? missionaries[0];
  const [composerOpen, setComposerOpen] = useState(false);
  const scrollView = useRef<ScrollViewInstance | null>(null);

  if (!missionary) {
    return (
      <View style={styles.screen}>
        <ScrollView style={styles.feed} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.pageTitle}>Journal</Text>
            <Text style={styles.caption}>Link a missionary to follow their journal updates.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/link-missionary')} style={styles.dashedButton}>
              <Text style={styles.dashedButtonText}>+ Link a missionary</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  const entries = [...missionary.journal].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollView}
        style={styles.feed}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Journal</Text>
          <MissionaryPicker />
          <Text style={styles.caption}>
            {missionary.isMainSupporter
              ? `You're ${missionary.firstName}'s main supporter. Your updates are shared with everyone supporting ${missionary.firstName}.`
              : `Updates from ${missionary.mainSupporter}, ${missionary.firstName}'s main supporter.`}
          </Text>

          {missionary.isMainSupporter && composerOpen && (
            <Composer key={missionary.id} missionary={missionary} onClose={() => setComposerOpen(false)} />
          )}

          {entries.length === 0 ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>No updates yet.</Text>
            </View>
          ) : (
            entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
          )}
        </View>
      </ScrollView>
      {missionary.isMainSupporter && !composerOpen && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Create a journal post about ${missionary.firstName}`}
          onPress={() => {
            scrollView.current?.scrollTo({ y: 0, animated: true });
            setComposerOpen(true);
          }}
          style={({ pressed }) => [styles.addPostButton, pressed && styles.pressed]}>
          <Text style={styles.addPostButtonText}>+</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  feed: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl + 64 },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.md },
  pageTitle: { color: colors.navy, fontSize: 27, fontWeight: '700' },
  caption: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  entryCard: { gap: spacing.xs, padding: spacing.lg, borderWidth: 1, borderColor: '#D6DEE6', borderRadius: 16 },
  entryDate: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  entryTitle: { color: colors.navy, fontSize: 17, fontWeight: '700' },
  entryImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: 10, backgroundColor: '#EAF2F8' },
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
  photoPreviewWrap: { gap: spacing.xs },
  photoPreview: { width: '100%', aspectRatio: 4 / 3, borderRadius: 10, backgroundColor: '#EAF2F8' },
  addPhotoButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.white },
  addPhotoButtonText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  removePhotoButton: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.sm },
  removePhotoText: { color: '#A12626', fontSize: 13, fontWeight: '600' },
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
  addPostButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: colors.navy,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    zIndex: 10,
  },
  addPostButtonText: { color: colors.white, fontSize: 34, fontWeight: '400', lineHeight: 38 },
  pressed: { opacity: 0.78 },
});
