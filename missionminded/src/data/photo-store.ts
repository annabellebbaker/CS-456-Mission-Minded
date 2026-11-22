import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { Image, type ImageProps } from 'expo-image';
import { createElement, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { getFirebaseFirestore, getFirebaseStorage, withTimeout } from '@/data/firebase';

/**
 * Photos are saved in Firestore instead of Firebase Storage, because Storage
 * needs the paid Blaze plan and Firestore is free (1 GiB on the Spark plan).
 *
 * Each photo is shrunk to a JPEG under ~600 KB and saved as its own document at
 * users/{uid}/photos/{photoId}. Missionaries and updates store a short reference
 * like "photo:users/{uid}/photos/{photoId}", so their own documents stay small
 * (Firestore caps a document at 1 MiB).
 */

/** A photo picked on the device, before it is saved. */
export type PickedPhoto = { uri: string; mimeType?: string | null; base64?: string | null };

export const PHOTO_UPLOAD_FAILED = 'photo-upload-failed';
export const PHOTO_TOO_LARGE = 'photo-too-large';

const PHOTO_REF_PREFIX = 'photo:';
/** Characters of base64 data; keeps each photo document well under Firestore's 1 MiB cap. */
const MAX_DATA_URL_LENGTH = 800_000;
const MAX_EDGE = 1280;

/** Pass to ImagePicker so native platforms return the image data we need. */
export const pickerBase64Option = Platform.OS !== 'web';

function loadHtmlImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read the selected photo.'));
    image.src = uri;
  });
}

/** Web: redraw on a canvas, shrinking size and quality until it fits. */
async function compressOnWeb(uri: string): Promise<string> {
  const image = await loadHtmlImage(uri);
  let edge = MAX_EDGE;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) break;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.65, 0.5]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
    }
    edge = Math.round(edge * 0.75);
  }
  throw new Error(PHOTO_TOO_LARGE);
}

/** Turns a picked photo into a small JPEG data URL. */
export async function compressPhoto(photo: PickedPhoto): Promise<string> {
  if (Platform.OS === 'web') return compressOnWeb(photo.uri);
  // Native: the picker already re-encoded it at reduced quality and gave us base64.
  if (!photo.base64) throw new Error(PHOTO_UPLOAD_FAILED);
  const dataUrl = `data:${photo.mimeType?.startsWith('image/') ? photo.mimeType : 'image/jpeg'};base64,${photo.base64}`;
  if (dataUrl.length > MAX_DATA_URL_LENGTH) throw new Error(PHOTO_TOO_LARGE);
  return dataUrl;
}

/** Saves one photo and returns the reference to keep on the missionary or update. */
export async function savePhoto(userId: string, photo: PickedPhoto): Promise<{ url: string; path: string }> {
  let dataUrl: string;
  try {
    dataUrl = await compressPhoto(photo);
  } catch (error) {
    throw error instanceof Error && error.message === PHOTO_TOO_LARGE ? error : new Error(PHOTO_UPLOAD_FAILED, { cause: error });
  }
  const photoId = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `users/${userId}/photos/${photoId}`;
  try {
    await withTimeout(
      setDoc(doc(getFirebaseFirestore(), 'users', userId, 'photos', photoId), { dataUrl, createdAt: new Date().toISOString() }),
      20_000,
      PHOTO_UPLOAD_FAILED,
    );
  } catch (error) {
    console.warn('Saving the photo to Firestore failed.', error);
    throw new Error(PHOTO_UPLOAD_FAILED, { cause: error });
  }
  photoCache.set(path, dataUrl);
  return { url: `${PHOTO_REF_PREFIX}${path}`, path };
}

/** Deletes a saved photo. Also handles older photos that were saved to Firebase Storage. */
export async function deletePhoto(path?: string): Promise<void> {
  if (!path) return;
  photoCache.delete(path);
  try {
    if (path.startsWith('users/')) {
      const [, userId, , photoId] = path.split('/');
      await deleteDoc(doc(getFirebaseFirestore(), 'users', userId, 'photos', photoId));
    } else {
      await deleteObject(ref(getFirebaseStorage(), path));
    }
  } catch {
    // Best effort: a leftover photo is harmless.
  }
}

const photoCache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

function loadPhoto(path: string): Promise<string | null> {
  const cached = photoCache.get(path);
  if (cached) return Promise.resolve(cached);
  const inFlight = pending.get(path);
  if (inFlight) return inFlight;
  const [, userId, , photoId] = path.split('/');
  const request = getDoc(doc(getFirebaseFirestore(), 'users', userId, 'photos', photoId))
    .then((snapshot) => {
      const dataUrl = snapshot.data()?.dataUrl;
      if (typeof dataUrl !== 'string') return null;
      photoCache.set(path, dataUrl);
      return dataUrl;
    })
    .catch(() => null)
    .finally(() => pending.delete(path));
  pending.set(path, request);
  return request;
}

/** Turns a stored photo reference (or a normal URL) into something an <Image> can show. */
export function usePhotoUri(url?: string): string | undefined {
  const path = url?.startsWith(PHOTO_REF_PREFIX) ? url.slice(PHOTO_REF_PREFIX.length) : undefined;
  const [loaded, setLoaded] = useState<{ path: string; uri: string | null } | null>(null);

  useEffect(() => {
    if (!path || photoCache.has(path)) return;
    let active = true;
    void loadPhoto(path).then((uri) => {
      if (active) setLoaded({ path, uri });
    });
    return () => {
      active = false;
    };
  }, [path]);

  if (!url) return undefined;
  if (!path) return url;
  return photoCache.get(path) ?? (loaded?.path === path ? loaded.uri ?? undefined : undefined);
}

/** expo-image <Image> that understands stored photo references. Shows the placeholder color while loading. */
export function PhotoImage({ url, ...props }: Omit<ImageProps, 'source'> & { url?: string }) {
  const uri = usePhotoUri(url);
  return createElement(Image, { ...props, source: uri ? { uri } : undefined });
}
