import { useRef, useState } from 'react';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';

import { AppText as Text, AppTextInput as TextInput } from '@/components/app-text';
import { MissionaryPicker } from '@/components/missionary-picker';
import { PHOTO_TOO_LARGE, PHOTO_UPLOAD_FAILED, useMissionaries } from '@/data/missionaries';
import { PhotoImage, pickerBase64Option } from '@/data/photo-store';
import { MAX_UPDATE_PHOTOS, type MissionaryUpdate, type MissionaryDetails } from '@/data/repository';
import { colors, spacing } from '@/theme/colors';

function formatDate(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** Swipeable photo strip with a page indicator. One photo shows full width. */
function PhotoGallery({ images, label }: { images: NonNullable<MissionaryUpdate['images']>; label: string }) {
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(Math.min(windowWidth - spacing.lg * 4, 448));
  const [page, setPage] = useState(0);
  const strip = useRef<ScrollViewInstance | null>(null);

  const goTo = (next: number) => {
    const target = Math.max(0, Math.min(images.length - 1, next));
    strip.current?.scrollTo({ x: target * width, animated: true });
    setPage(target);
  };

  if (images.length === 1) {
    return <PhotoImage accessibilityLabel={`${label} photo`} url={images[0].url} style={styles.entryImage} />;
  }

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.gallery}>
      <ScrollView
        ref={strip}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1)))}>
        {images.map((image, index) => (
          <PhotoImage
            key={image.url}
            accessibilityLabel={`${label} photo ${index + 1} of ${images.length}`}
            url={image.url}
            style={[styles.entryImage, { width }]}
          />
        ))}
      </ScrollView>
      {page > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous photo"
          hitSlop={8}
          onPress={() => goTo(page - 1)}
          style={({ pressed }) => [styles.arrowButton, styles.arrowLeft, pressed && styles.pressed]}>
          <View style={[styles.chevron, styles.chevronLeft]} />
        </Pressable>
      )}
      {page < images.length - 1 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next photo"
          hitSlop={8}
          onPress={() => goTo(page + 1)}
          style={({ pressed }) => [styles.arrowButton, styles.arrowRight, pressed && styles.pressed]}>
          <View style={[styles.chevron, styles.chevronRight]} />
        </Pressable>
      )}
      <View style={styles.photoCount} pointerEvents="none">
        <Text style={styles.photoCountText}>{page + 1}/{images.length}</Text>
      </View>
      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {images.map((image, index) => (
          <View key={image.url} style={[styles.dot, index === page && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function UpdateCard({ update }: { update: MissionaryUpdate }) {
  return (
    <View style={styles.entryCard}>
      <Text style={styles.entryDate}>{formatDate(update.date)}</Text>
      {!!update.title && <Text style={styles.entryTitle}>{update.title}</Text>}
      {!!update.images?.length && <PhotoGallery images={update.images} label={update.title || 'Update'} />}
      <Text style={styles.entryBody}>{update.body}</Text>
      <Text style={styles.entryAuthor}>Posted by {update.author}</Text>
    </View>
  );
}

/** Any supporter can post an update. */
function Composer({ missionary, onClose }: { missionary: MissionaryDetails; onClose: () => void }) {
  const { addUpdate } = useMissionaries();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const remaining = MAX_UPDATE_PHOTOS - photos.length;

  const pickPhotos = async () => {
    setError('');
    setPickingPhoto(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        orderedSelection: true,
        selectionLimit: remaining,
        quality: pickerBase64Option ? 0.5 : 0.8,
        base64: pickerBase64Option,
      });
      if (result.canceled) return;
      const tooLarge = result.assets.filter((asset) => asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES);
      const accepted = result.assets
        .filter((asset) => !tooLarge.includes(asset))
        .filter((asset) => !photos.some((existing) => existing.uri === asset.uri));
      const next = [...photos, ...accepted].slice(0, MAX_UPDATE_PHOTOS);
      setPhotos(next);
      if (tooLarge.length) {
        setError(`${tooLarge.length === 1 ? 'One photo was' : `${tooLarge.length} photos were`} over 10 MB and skipped.`);
      } else if (photos.length + accepted.length > MAX_UPDATE_PHOTOS) {
        setError(`Updates can hold up to ${MAX_UPDATE_PHOTOS} photos.`);
      }
    } catch {
      setError('Could not open your photos. Please try again.');
    } finally {
      setPickingPhoto(false);
    }
  };

  const removePhoto = (uri: string) => setPhotos((current) => current.filter((item) => item.uri !== uri));

  const post = async () => {
    if (!body.trim()) {
      setError('Add a caption before posting.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addUpdate(missionary.id, {
        title,
        body,
        photos: photos.map((item) => ({ uri: item.uri, mimeType: item.mimeType, base64: item.base64 })),
      });
      setTitle('');
      setBody('');
      setPhotos([]);
      onClose();
    } catch (postError) {
      const code = postError instanceof Error ? postError.message : '';
      setError(
        code === PHOTO_TOO_LARGE
          ? 'One of the photos is too large. Try a smaller photo or a screenshot of it.'
          : code === PHOTO_UPLOAD_FAILED
            ? "A photo couldn't be saved, so the update wasn't posted. Try again."
            : 'Could not post this update. Check your connection and try again.',
      );
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
      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {photos.map((item, index) => (
            <View key={item.uri} style={styles.thumbWrap}>
              <Image
                accessibilityLabel={`Selected photo ${index + 1} of ${photos.length}`}
                source={{ uri: item.uri }}
                style={styles.thumb}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${index + 1}`}
                disabled={saving}
                hitSlop={8}
                onPress={() => removePhoto(item.uri)}
                style={({ pressed }) => [styles.thumbRemove, pressed && styles.pressed]}>
                <Text style={styles.thumbRemoveText}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
      {remaining > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityHint={`You can attach up to ${MAX_UPDATE_PHOTOS} photos.`}
          disabled={pickingPhoto || saving}
          onPress={() => void pickPhotos()}
          style={({ pressed }) => [styles.addPhotoButton, pressed && styles.pressed, (pickingPhoto || saving) && styles.disabled]}>
          <Text style={styles.addPhotoButtonText}>
            {pickingPhoto
              ? 'Opening photos...'
              : photos.length
                ? `+ Add more photos (${photos.length}/${MAX_UPDATE_PHOTOS})`
                : '+ Add photos'}
          </Text>
        </Pressable>
      )}
      {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
      <View style={styles.composerActions}>
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => void post()}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]}>
          <Text style={styles.primaryButtonText}>
            {saving ? (photos.length ? `Uploading ${photos.length} photo${photos.length === 1 ? '' : 's'}…` : 'Posting…') : 'Post update'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => {
            onClose();
            setTitle('');
            setBody('');
            setPhotos([]);
            setError('');
          }}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, saving && styles.disabled]}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function UpdatesScreen() {
  const { missionaries, getById, selectedId } = useMissionaries();
  const missionary = getById(selectedId) ?? missionaries[0];
  const [composerOpen, setComposerOpen] = useState(false);
  const scrollView = useRef<ScrollViewInstance | null>(null);

  if (!missionary) {
    return (
      <View style={styles.screen}>
        <ScrollView style={styles.feed} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.pageTitle}>Updates</Text>
            <Text style={styles.caption}>Add a Missionary to follow their updates.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/add-missionary')} style={styles.dashedButton}>
              <Text style={styles.dashedButtonText}>+ Add a Missionary</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  const updates = [...missionary.updates].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollView}
        style={styles.feed}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Updates</Text>
          <MissionaryPicker />
          <Text style={styles.caption}>
            Updates about {missionary.firstName} are shared with everyone supporting them.
          </Text>

          {composerOpen && (
            <Composer key={missionary.id} missionary={missionary} onClose={() => setComposerOpen(false)} />
          )}

          {updates.length === 0 ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>No updates yet.</Text>
            </View>
          ) : (
            updates.map((update) => <UpdateCard key={update.id} update={update} />)
          )}
        </View>
      </ScrollView>
      {!composerOpen && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Create an update about ${missionary.firstName}`}
          onPress={() => {
            scrollView.current?.scrollTo({ y: 0, animated: true });
            setComposerOpen(true);
          }}
          style={({ pressed }) => [styles.addPostButton, pressed && styles.pressed]}>
          {/* Drawn with two bars so it's exactly centered; the font's "+" glyph sits high. */}
          <View style={styles.plusHorizontal} />
          <View style={styles.plusVertical} />
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
  gallery: { position: 'relative', borderRadius: 10, overflow: 'hidden' },
  photoCount: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 50, 85, 0.72)',
  },
  photoCountText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  arrowButton: {
    position: 'absolute',
    // Centered on the photo (the dots row sits below it).
    top: '50%',
    marginTop: -26,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
  arrowLeft: { left: spacing.sm },
  arrowRight: { right: spacing.sm },
  // A rotated corner makes a chevron that stays centered regardless of font.
  chevron: { width: 10, height: 10, borderColor: colors.navy, borderTopWidth: 2.5, borderLeftWidth: 2.5 },
  chevronLeft: { marginLeft: 4, transform: [{ rotate: '-45deg' }] },
  chevronRight: { marginRight: 4, transform: [{ rotate: '135deg' }] },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C9D6E3' },
  dotActive: { width: 16, backgroundColor: colors.brandBlue },
  thumbRow: { gap: spacing.sm, paddingTop: spacing.xs, paddingRight: spacing.xs },
  thumbWrap: { position: 'relative' },
  thumb: { width: 84, height: 84, borderRadius: 10, backgroundColor: '#EAF2F8' },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 12,
    backgroundColor: colors.brandBlue,
  },
  thumbRemoveText: { color: colors.white, fontSize: 15, fontWeight: '700', lineHeight: 17 },
  addPhotoButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.white },
  addPhotoButtonText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
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
  plusHorizontal: { position: 'absolute', width: 22, height: 2.5, borderRadius: 2, backgroundColor: colors.white },
  plusVertical: { position: 'absolute', width: 2.5, height: 22, borderRadius: 2, backgroundColor: colors.white },
  pressed: { opacity: 0.78 },
});
