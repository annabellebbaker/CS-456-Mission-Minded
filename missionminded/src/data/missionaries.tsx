import { arrayUnion, collection, deleteDoc, deleteField, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { PREVIEW_USER_ID, useAuth } from '@/data/auth';
import { getFirebaseFirestore, getFirebaseStorage } from '@/data/firebase';
import {
  buildMissionary,
  ensureCoreTimelineMoments,
  getSampleMissionaries,
  getPhaseLabel,
  type MissionaryForm,
  missionPhases,
  type MissionaryUpdate,
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
    photo?: { uri: string; mimeType?: string | null };
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

function blobFromUri(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.onload = () => {
      if (request.status === 0 || (request.status >= 200 && request.status < 300)) {
        resolve(request.response as Blob);
      } else {
        reject(new Error('Could not read the selected photo.'));
      }
    };
    request.onerror = () => reject(new Error('Could not read the selected photo.'));
    request.responseType = 'blob';
    request.open('GET', uri, true);
    request.send(null);
  });
}

function getImageExtension(mimeType: string): string {
  const subtype = mimeType.split('/')[1]?.toLowerCase().split(';')[0];
  if (!subtype) return 'jpg';
  return subtype === 'jpeg' ? 'jpg' : subtype.replace(/[^a-z0-9]/g, '') || 'jpg';
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
    return body && date ? [{
      id: asString(item.id, `${id}-update-${index}`),
      title: asString(item.title).trim(),
      body,
      date,
      author: asString(item.author, 'Supporter'),
      ...(asString(item.imageUrl) ? { imageUrl: asString(item.imageUrl) } : {}),
      ...(asString(item.imagePath) ? { imagePath: asString(item.imagePath) } : {}),
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
    const missionary = buildMissionary(form);
    if (user.id === PREVIEW_USER_ID) {
      setData((current) => ({ ...current, missionaries: [...current.missionaries, missionary] }));
      return missionary;
    }
    const reference = doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionary.id);
    await setDoc(reference, omitUndefined(missionary) as Record<string, unknown>);
    setData((current) => current.userId === user.id
      ? { ...current, missionaries: [...current.missionaries.filter((item) => item.id !== missionary.id), missionary] }
      : current);
    return missionary;
  }, [user]);

  const addUpdate = useCallback(async (missionaryId: string, update: {
    title: string;
    body: string;
    photo?: { uri: string; mimeType?: string | null };
  }) => {
    if (!user) throw new Error('Sign in to post an update.');
    const missionary = missionaries.find((item) => item.id === missionaryId);
    if (!missionary) throw new Error('Missionary not found.');
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const id = `${missionaryId}-update-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
    const mimeType = update.photo?.mimeType?.startsWith('image/') ? update.photo.mimeType : 'image/jpeg';
    let photoRef: ReturnType<typeof ref> | null = null;
    let imageUrl: string | undefined;
    let imagePath: string | undefined;

    if (update.photo && user.id !== PREVIEW_USER_ID) {
      imagePath = `missionUpdates/${user.id}/${missionaryId}/${id}/photo.${getImageExtension(mimeType)}`;
      photoRef = ref(getFirebaseStorage(), imagePath);
      const photoBlob = await blobFromUri(update.photo.uri);
      try {
        await uploadBytes(photoRef, photoBlob, { contentType: mimeType });
        imageUrl = await getDownloadURL(photoRef);
      } catch (error) {
        await deleteObject(photoRef).catch(() => undefined);
        throw error;
      }
    } else if (update.photo) {
      imageUrl = update.photo.uri;
    }

    const item: MissionaryUpdate = {
      id,
      title: update.title.trim(),
      body: update.body.trim(),
      date,
      author: user.name || 'You',
      ...(imageUrl ? { imageUrl } : {}),
      ...(imagePath ? { imagePath } : {}),
    };
    if (user.id === PREVIEW_USER_ID) {
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
      await updateDoc(reference, {
        updates: arrayUnion(...missionary.updates, item),
        journal: deleteField(),
      });
    } catch (error) {
      if (photoRef) await deleteObject(photoRef).catch(() => undefined);
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
    };
    if (user.id !== PREVIEW_USER_ID) {
      await updateDoc(
        doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionaryId),
        {
          ...omitUndefined(updated) as Record<string, unknown>,
          journal: deleteField(),
          mainSupporter: deleteField(),
          isMainFollower: deleteField(),
          isMainSupporter: deleteField(),
        },
      );
    }
    setData((current) => current.userId === user.id
      ? { ...current, missionaries: current.missionaries.map((item) => item.id === missionaryId ? updated : item) }
      : current);
  }, [missionaries, user]);

  const deleteMissionary = useCallback(async (missionaryId: string) => {
    if (!user) throw new Error('Sign in to delete a missionary.');
    if (user.id !== PREVIEW_USER_ID) {
      await deleteDoc(doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionaryId));
    }
    setData((current) => current.userId === user.id
      ? { ...current, missionaries: current.missionaries.filter((item) => item.id !== missionaryId) }
      : current);
  }, [user]);

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
