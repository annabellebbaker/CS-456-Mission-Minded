import { collection, deleteDoc, deleteField, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { PREVIEW_USER_ID, useAuth } from '@/data/auth';
import { getFirebaseFirestore, withTimeout } from '@/data/firebase';
import { deletePhoto, savePhoto, type PickedPhoto } from '@/data/photo-store';
import {
  buildMissionary,
  ensureCoreTimelineMoments,
  getSampleMissionaries,
  getPhaseLabel,
  type MissionaryForm,
  missionPhases,
  type MissionaryUpdate,
  MAX_UPDATE_PHOTOS,
  type UpdateImage,
  type GrowingTogetherItem,
  type PhaseMoment,
  type MissionPhase,
  type MissionaryDetails,
} from '@/data/repository';

type MissionariesContextValue = {
  missionaries: MissionaryDetails[];
  getById: (id: string) => MissionaryDetails | undefined;
  addMissionary: (form: MissionaryForm) => Promise<MissionaryDetails>;
  addUpdate: (missionaryId: string, update: {
    title: string;
    body: string;
    photos?: UpdatePhotoInput[];
  }) => Promise<void>;
  updateMissionary: (missionaryId: string, form: MissionaryForm) => Promise<void>;
  deleteMissionary: (missionaryId: string) => Promise<void>;
  updatePhaseMoment: (missionaryId: string, phase: MissionPhase, title: string, details: {
    date: string;
    districtNumber?: string;
    companionName?: string;
    areaName?: string;
  }, momentId?: string) => Promise<void>;
  addPhaseMoment: (missionaryId: string, moment: PhaseMoment) => Promise<void>;
  checked: Record<string, boolean>;
  toggleChecked: (key: string) => void;
  selectedId: string;
  setSelectedId: (id: string) => void;
};

/** A photo picked on the device, before it is saved. */
export type UpdatePhotoInput = PickedPhoto;

type MissionariesData = {
  userId: string | null;
  missionaries: MissionaryDetails[];
  checked: Record<string, boolean>;
};

const emptyData: MissionariesData = { userId: null, missionaries: [], checked: {} };
const MissionariesContext = createContext<MissionariesContextValue | null>(null);

function omitUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitUndefined);
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, omitUndefined(entry)]),
    );
  }
  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export { PHOTO_TOO_LARGE, PHOTO_UPLOAD_FAILED } from '@/data/photo-store';
export const DATABASE_TIMEOUT = 'database-timeout';

/** Firestore waits for the server before resolving a write; don't let that wait forever. */
function saveWithTimeout<T>(promise: Promise<T>) {
  return withTimeout(promise, 20_000, DATABASE_TIMEOUT);
}

function isMissionPhase(value: unknown): value is MissionPhase {
  return typeof value === 'string' && missionPhases.includes(value as MissionPhase);
}

function normalizePhase(value: unknown, currentStage: unknown): MissionPhase {
  if (isMissionPhase(value)) return value;
  const stage = asString(currentStage).trim().toLowerCase();
  const stagePhases: Record<string, MissionPhase> = {
    assigned: 'assigned',
    'pre-mission': 'assigned',
    called: 'assigned',
    mtc: 'mtc',
    serving: 'serving',
    home: 'home',
  };
  return stagePhases[stage] ?? 'assigned';
}

function normalizeMomentPhase(value: unknown, fallback: MissionPhase): MissionPhase {
  if (isMissionPhase(value)) return value;
  if (value === 'pre-mission' || value === 'called') return 'assigned';
  return fallback;
}

function normalizeMoments(value: unknown, legacyJourney: unknown, legacyMoments: unknown, phase: MissionPhase): PhaseMoment[] {
  const source = Array.isArray(value)
    ? value
    : Array.isArray(legacyMoments)
      ? legacyMoments
      : Array.isArray(legacyJourney)
        ? legacyJourney
        : [];
  return source.flatMap((entry, index) => {
    const item = asRecord(entry);
    const title = asString(item.title).trim();
    if (!title) return [];
    const when = asString(item.when, asString(item.date));
    return [{
      id: asString(item.id).trim() || `${phase}-${index}`,
      title,
      phase: normalizeMomentPhase(item.phase, phase),
      ...(when ? { when } : {}),
      ...(asString(item.districtNumber).trim() ? { districtNumber: asString(item.districtNumber).trim() } : {}),
      ...(asString(item.companionName).trim() ? { companionName: asString(item.companionName).trim() } : {}),
      ...(asString(item.areaName).trim() ? { areaName: asString(item.areaName).trim() } : {}),
      done: item.done === true || item.state === 'complete',
    }];
  });
}

function normalizeMissionary(id: string, value: unknown): MissionaryDetails {
  const raw = asRecord(value);
  const storedName = asString(raw.name, 'Missionary').trim();
  const words = storedName.split(/\s+/).filter(Boolean);
  const titleFromName = /^(Elder|Sister)\b/i.exec(words[0] ?? '')?.[1] ?? '';
  const title = asString(raw.title).trim() || titleFromName;
  const firstName = asString(raw.firstName).trim() || words[titleFromName ? 1 : 0] || storedName;
  const lastName = asString(raw.lastName).trim()
    || (words.length > (titleFromName ? 2 : 1) ? words.slice(titleFromName ? 2 : 1).join(' ') : '');
  const name = title && firstName && lastName
    ? [title, firstName, lastName].join(' ')
    : storedName;
  const shortName = asString(raw.shortName).trim() || [title, lastName || firstName].filter(Boolean).join(' ');
  const phase = normalizePhase(raw.phase, raw.currentStage);
  const details = asRecord(raw.missionDetails);

  const missionLength = asString(raw.missionLength);
  const moments = ensureCoreTimelineMoments(
    normalizeMoments(raw.moments, raw.journey, raw['milestones'], phase),
    missionLength,
    phase,
  );
  const growingTogether = Array.isArray(raw.growingTogether)
    ? raw.growingTogether.flatMap((entry, index) => {
      const item = asRecord(entry);
      const title = asString(item.title).trim();
      return title ? [{
        id: asString(item.id, `${id}-study-${index}`),
        title,
        description: asString(item.description),
      } satisfies GrowingTogetherItem] : [];
    })
    : [];
  const rawUpdates = Array.isArray(raw.updates)
    ? raw.updates
    : Array.isArray(raw.journal)
      ? raw.journal
      : [];
  const updates = rawUpdates.flatMap((entry, index) => {
    const item = asRecord(entry);
    const body = asString(item.body).trim();
    const date = asString(item.date);
    const images: UpdateImage[] = Array.isArray(item.images)
      ? item.images.flatMap((image) => {
        const value = asRecord(image);
        const url = asString(value.url);
        return url ? [{ url, ...(asString(value.path) ? { path: asString(value.path) } : {}) }] : [];
      })
      : [];
    // Fourth-prototype posts saved a single imageUrl. Fold it into the images list.
    const legacyUrl = asString(item.imageUrl);
    if (legacyUrl && !images.some((image) => image.url === legacyUrl)) {
      images.unshift({ url: legacyUrl, ...(asString(item.imagePath) ? { path: asString(item.imagePath) } : {}) });
    }
    return body && date ? [{
      id: asString(item.id, `${id}-update-${index}`),
      title: asString(item.title).trim(),
      body,
      date,
      author: asString(item.author, 'Supporter'),
      ...(images.length ? { images } : {}),
    } satisfies MissionaryUpdate] : [];
  });
  return {
    id,
    title,
    name,
    shortName,
    firstName,
    lastName,
    relationship: asString(raw.relationship, 'Supporter'),
    ...(asString(raw.photoUrl) ? { photoUrl: asString(raw.photoUrl) } : {}),
    ...(asString(raw.photoPath) ? { photoPath: asString(raw.photoPath) } : {}),
    missionName: asString(raw.missionName, 'Mission not yet known'),
    missionLength,
    missionId: asString(raw.missionId),
    phase,
    phaseSince: asString(raw.phaseSince),
    status: phase === 'serving' && typeof details.area === 'string' && details.area.trim()
      ? `Serving in ${details.area.trim()}`
      : getPhaseLabel(phase, phase),
    language: asString(raw.language),
    moments,
    growingTogetherIntro: asString(raw.growingTogetherIntro),
    growingTogether,
    ponderText: asString(raw.ponderText),
    ponderReference: asString(raw.ponderReference),
    updates,
    missionDetails: {
      companion: typeof details.companion === 'string' ? details.companion : null,
      area: typeof details.area === 'string' ? details.area : null,
      leaders: typeof details.leaders === 'string' ? details.leaders : null,
      office: typeof details.office === 'string' ? details.office : null,
      phone: typeof details.phone === 'string' ? details.phone : null,
      email: typeof details.email === 'string' ? details.email : null,
    },
  };
}

export function MissionariesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<MissionariesData>(emptyData);
  const [selectedIdPreference, setSelectedId] = useState('');

  const missionaries = useMemo(
    () => data.userId === user?.id ? data.missionaries : [],
    [data.missionaries, data.userId, user?.id],
  );
  const checked = useMemo(
    () => data.userId === user?.id ? data.checked : {},
    [data.checked, data.userId, user?.id],
  );
  const selectedId = missionaries.some((missionary) => missionary.id === selectedIdPreference)
    ? selectedIdPreference
    : missionaries[0]?.id ?? '';

  useEffect(() => {
    if (!user) return;

    // Preview mode (dev only): sample missionaries kept in memory, nothing touches Firebase.
    if (user.id === PREVIEW_USER_ID) {
      let active = true;
      const previewData = { userId: user.id, missionaries: getSampleMissionaries(), checked: {} };
      queueMicrotask(() => {
        if (active) setData(previewData);
      });
      return () => {
        active = false;
      };
    }

    const db = getFirebaseFirestore();
    const missionaryCollection = collection(db, 'users', user.id, 'missionaries');
    const checklistDocument = doc(db, 'users', user.id, 'settings', 'checklist');
    const stopMissionaries = onSnapshot(missionaryCollection, (snapshot) => {
      const nextMissionaries = snapshot.docs.map((item) => normalizeMissionary(item.id, item.data()));
      setData((current) => ({
        userId: user.id,
        missionaries: nextMissionaries,
        checked: current.userId === user.id ? current.checked : {},
      }));
    }, (error) => {
      console.warn('Could not load missionaries from Firebase.', error);
    });

    const stopChecklist = onSnapshot(checklistDocument, (snapshot) => {
      const value = snapshot.data()?.checked;
      setData((current) => ({
        userId: user.id,
        missionaries: current.userId === user.id ? current.missionaries : [],
        checked: value && typeof value === 'object' ? value as Record<string, boolean> : {},
      }));
    }, (error) => {
      console.warn('Could not load checklist progress from Firebase.', error);
    });

    return () => {
      stopMissionaries();
      stopChecklist();
    };
  }, [user]);

  const addMissionary = useCallback(async (form: MissionaryForm) => {
    if (!user) throw new Error('Sign in to add a missionary.');
    let missionary = buildMissionary(form);
    if (user.id === PREVIEW_USER_ID) {
      if (form.photo) missionary = { ...missionary, photoUrl: form.photo.uri };
      setData((current) => ({ ...current, missionaries: [...current.missionaries, missionary] }));
      return missionary;
    }
    const saved = form.photo ? await savePhoto(user.id, form.photo) : null;
    if (saved) missionary = { ...missionary, photoUrl: saved.url, photoPath: saved.path };
    const reference = doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionary.id);
    try {
      await saveWithTimeout(setDoc(reference, omitUndefined(missionary) as Record<string, unknown>));
    } catch (error) {
      console.warn('Saving the missionary to Firestore failed.', error);
      await deletePhoto(saved?.path);
      throw error;
    }
    setData((current) => current.userId === user.id
      ? { ...current, missionaries: [...current.missionaries.filter((item) => item.id !== missionary.id), missionary] }
      : current);
    return missionary;
  }, [user]);

  const addUpdate = useCallback(async (missionaryId: string, update: {
    title: string;
    body: string;
    photos?: UpdatePhotoInput[];
  }) => {
    if (!user) throw new Error('Sign in to post an update.');
    const missionary = missionaries.find((item) => item.id === missionaryId);
    if (!missionary) throw new Error('Missionary not found.');
    const photos = (update.photos ?? []).slice(0, MAX_UPDATE_PHOTOS);
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const id = `${missionaryId}-update-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
    const isPreview = user.id === PREVIEW_USER_ID;
    const savedPaths: string[] = [];
    const removeSaved = () => Promise.all(savedPaths.map((path) => deletePhoto(path)));

    let images: UpdateImage[] = [];
    if (isPreview) {
      // Preview mode never touches Firebase; show the local files directly.
      images = photos.map((photo) => ({ url: photo.uri }));
    } else if (photos.length) {
      try {
        // One at a time keeps memory low while photos are shrunk.
        for (const photo of photos) {
          const saved = await savePhoto(user.id, photo);
          savedPaths.push(saved.path);
          images.push(saved);
        }
      } catch (error) {
        // Don't leave orphaned photos behind if any one fails.
        await removeSaved();
        throw error;
      }
    }

    const item: MissionaryUpdate = {
      id,
      title: update.title.trim(),
      body: update.body.trim(),
      date,
      author: user.name || 'You',
      ...(images.length ? { images } : {}),
    };
    if (isPreview) {
      setData((current) => ({
        ...current,
        missionaries: current.missionaries.map((existing) => existing.id === missionaryId
          ? { ...existing, updates: [...existing.updates, item] }
          : existing),
      }));
      return;
    }
    const reference = doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionaryId);
    try {
      await saveWithTimeout(updateDoc(reference, {
        // Write the normalized list so legacy single-photo posts are saved in the new `images` shape.
        updates: omitUndefined([...missionary.updates, item]),
        journal: deleteField(),
      }));
    } catch (error) {
      await removeSaved();
      throw error;
    }
  }, [missionaries, user]);

  const updateMissionary = useCallback(async (missionaryId: string, form: MissionaryForm) => {
    if (!user) throw new Error('Sign in to update a missionary.');
    const existing = missionaries.find((item) => item.id === missionaryId);
    if (!existing) throw new Error('Missionary not found.');
    const name = [form.title, form.firstName.trim(), form.lastName.trim()].join(' ');
    const moments = ensureCoreTimelineMoments(
      existing.moments,
      form.missionLength,
      existing.phase,
      form.assignedDate,
      form.mtcDate,
    );
    const updated: MissionaryDetails = {
      ...existing,
      title: form.title,
      name,
      shortName: `${form.title} ${form.lastName.trim()}`,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      relationship: form.relationship.trim(),
      missionName: form.missionName.trim(),
      missionId: form.missionId?.trim() ?? '',
      missionLength: form.missionLength,
      moments,
      ...(form.missionDetails ? { missionDetails: form.missionDetails } : {}),
    };
    const area = updated.missionDetails.area?.trim();
    if (updated.phase === 'serving') updated.status = area ? `Serving in ${area}` : 'Serving';
    const isPreview = user.id === PREVIEW_USER_ID;
    let newPhotoPath: string | undefined;
    if (form.photo === null) {
      delete updated.photoUrl;
      delete updated.photoPath;
    } else if (form.photo) {
      if (isPreview) {
        updated.photoUrl = form.photo.uri;
      } else {
        const saved = await savePhoto(user.id, form.photo);
        updated.photoUrl = saved.url;
        updated.photoPath = saved.path;
        newPhotoPath = saved.path;
      }
    }
    if (!isPreview) {
      try {
        await saveWithTimeout(updateDoc(
          doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionaryId),
          {
            ...omitUndefined(updated) as Record<string, unknown>,
            ...(form.photo === null ? { photoUrl: deleteField(), photoPath: deleteField() } : {}),
            journal: deleteField(),
            mainSupporter: deleteField(),
            isMainFollower: deleteField(),
            isMainSupporter: deleteField(),
          },
        ));
      } catch (error) {
        console.warn('Saving the missionary to Firestore failed.', error);
        await deletePhoto(newPhotoPath);
        throw error;
      }
      // Clean up the replaced or removed photo only after the save succeeded.
      if (form.photo !== undefined && existing.photoPath !== updated.photoPath) {
        await deletePhoto(existing.photoPath);
      }
    }
    setData((current) => current.userId === user.id
      ? { ...current, missionaries: current.missionaries.map((item) => item.id === missionaryId ? updated : item) }
      : current);
  }, [missionaries, user]);

  const deleteMissionary = useCallback(async (missionaryId: string) => {
    if (!user) throw new Error('Sign in to delete a missionary.');
    if (user.id !== PREVIEW_USER_ID) {
      const photoPath = missionaries.find((item) => item.id === missionaryId)?.photoPath;
      await deleteDoc(doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionaryId));
      await deletePhoto(photoPath);
    }
    setData((current) => current.userId === user.id
      ? { ...current, missionaries: current.missionaries.filter((item) => item.id !== missionaryId) }
      : current);
  }, [missionaries, user]);

  const updatePhaseMoment = useCallback(async (missionaryId: string, phase: MissionPhase, title: string, details: {
    date: string;
    districtNumber?: string;
    companionName?: string;
    areaName?: string;
  }, momentId?: string) => {
    if (!user) throw new Error('Sign in to update a phase moment.');
    const current = missionaries.find((missionary) => missionary.id === missionaryId);
    if (!current) throw new Error('Missionary not found.');
    const trimmedDate = details.date.trim();
    const moments = current.moments.map((moment) => {
      const matches = momentId
        ? moment.id === momentId
        : moment.phase === phase && moment.title === title;
      if (!matches) return moment;
      return {
        ...moment,
        when: trimmedDate,
        ...(details.districtNumber !== undefined ? { districtNumber: details.districtNumber.trim() } : {}),
        ...(details.companionName !== undefined ? { companionName: details.companionName.trim() } : {}),
        ...(details.areaName !== undefined ? { areaName: details.areaName.trim() } : {}),
      };
    });

    if (user.id !== PREVIEW_USER_ID) {
      await updateDoc(
        doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionaryId),
        { moments },
      );
    }

    setData((currentData) => currentData.userId === user.id
      ? {
        ...currentData,
        missionaries: currentData.missionaries.map((missionary) => missionary.id === missionaryId
          ? { ...missionary, moments }
          : missionary),
      }
      : currentData);
  }, [missionaries, user]);

  const addPhaseMoment = useCallback(async (missionaryId: string, moment: PhaseMoment) => {
    if (!user) throw new Error('Sign in to add a timeline event.');
    const current = missionaries.find((item) => item.id === missionaryId);
    if (!current) throw new Error('Missionary not found.');
    const nextMoment = {
      ...moment,
      id: moment.id || `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: moment.title.trim(),
      ...(moment.when?.trim() ? { when: moment.when.trim() } : {}),
      done: moment.done === true,
    };
    const moments = [...current.moments, nextMoment];
    if (user.id !== PREVIEW_USER_ID) {
      await updateDoc(
        doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionaryId),
        { moments },
      );
    }
    setData((currentData) => currentData.userId === user.id
      ? {
        ...currentData,
        missionaries: currentData.missionaries.map((missionary) => missionary.id === missionaryId
          ? { ...missionary, moments }
          : missionary),
      }
      : currentData);
  }, [missionaries, user]);

  const toggleChecked = useCallback((key: string) => {
    if (!user) return;
    const nextChecked = { ...checked, [key]: !checked[key] };
    setData((current) => current.userId === user.id
      ? { ...current, checked: nextChecked }
      : current);
    if (user.id === PREVIEW_USER_ID) return;
    void setDoc(
      doc(getFirebaseFirestore(), 'users', user.id, 'settings', 'checklist'),
      { checked: nextChecked },
      { merge: true },
    ).catch((error) => console.warn('Could not save checklist progress to Firebase.', error));
  }, [checked, user]);

  const value: MissionariesContextValue = {
    missionaries,
    getById: (id) => missionaries.find((missionary) => missionary.id === id),
    addMissionary,
    addUpdate,
    updateMissionary,
    deleteMissionary,
    updatePhaseMoment,
    addPhaseMoment,
    checked,
    toggleChecked,
    selectedId,
    setSelectedId,
  };

  return <MissionariesContext.Provider value={value}>{children}</MissionariesContext.Provider>;
}

export function useMissionaries() {
  const value = useContext(MissionariesContext);
  if (!value) throw new Error('useMissionaries must be used inside MissionariesProvider');
  return value;
}
