import { arrayUnion, collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { PREVIEW_USER_ID, useAuth } from '@/data/auth';
import { getFirebaseFirestore, getFirebaseStorage } from '@/data/firebase';
import {
  buildLinkedMissionary,
  getSampleMissionaries,
  getPhaseLabel,
  type LinkMissionaryForm,
  missionPhases,
  type JournalEntry,
  type GrowingTogetherItem,
  type PhaseMoment,
  type MissionPhase,
  type MissionaryDetails,
} from '@/data/repository';

type MissionariesContextValue = {
  missionaries: MissionaryDetails[];
  getById: (id: string) => MissionaryDetails | undefined;
  linkMissionary: (form: LinkMissionaryForm) => Promise<MissionaryDetails>;
  addJournalEntry: (missionaryId: string, entry: {
    title: string;
    body: string;
    photo?: { uri: string; mimeType?: string | null };
  }) => Promise<void>;
  updateMissionary: (missionaryId: string, form: LinkMissionaryForm) => Promise<void>;
  deleteMissionary: (missionaryId: string) => Promise<void>;
  updatePhaseMomentDate: (missionaryId: string, phase: MissionPhase, title: string, date: string) => Promise<void>;
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
    preparing: 'assigned',
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
  if (value === 'preparing' || value === 'pre-mission' || value === 'called') return 'assigned';
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
  return source.flatMap((entry) => {
    const item = asRecord(entry);
    const title = asString(item.title).trim();
    if (!title) return [];
    const when = asString(item.when, asString(item.date));
    return [{
      title,
      phase: normalizeMomentPhase(item.phase, phase),
      ...(when ? { when } : {}),
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

  const moments = normalizeMoments(raw.moments, raw.journey, raw['milestones'], phase);
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
  const journal = Array.isArray(raw.journal)
    ? raw.journal.flatMap((entry, index) => {
      const item = asRecord(entry);
      const body = asString(item.body).trim();
      const date = asString(item.date);
      return body && date ? [{
        id: asString(item.id, `${id}-journal-${index}`),
        title: asString(item.title).trim(),
        body,
        date,
        author: asString(item.author, 'Main supporter'),
        ...(asString(item.imageUrl) ? { imageUrl: asString(item.imageUrl) } : {}),
        ...(asString(item.imagePath) ? { imagePath: asString(item.imagePath) } : {}),
      } satisfies JournalEntry] : [];
    })
    : [];
  const isMainSupporter = raw.isMainSupporter !== false;
  return {
    id,
    title,
    name,
    shortName,
    firstName,
    lastName,
    relationship: asString(raw.relationship, 'Supporter'),
    missionName: asString(raw.missionName, 'Mission not yet known'),
    missionLength: asString(raw.missionLength),
    missionId: asString(raw.missionId),
    phase,
    phaseSince: asString(raw.phaseSince),
    status: asString(raw.status, getPhaseLabel(phase, phase)),
    language: asString(raw.language),
    moments,
    growingTogetherIntro: asString(raw.growingTogetherIntro),
    growingTogether,
    ponderText: asString(raw.ponderText),
    ponderReference: asString(raw.ponderReference),
    mainSupporter: asString(raw.mainSupporter, isMainSupporter ? 'You' : 'Main supporter'),
    isMainSupporter,
    journal,
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

  const linkMissionary = useCallback(async (form: LinkMissionaryForm) => {
    if (!user) throw new Error('Sign in to link a missionary.');
    const missionary = buildLinkedMissionary(form);
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

  const addJournalEntry = useCallback(async (missionaryId: string, entry: {
    title: string;
    body: string;
    photo?: { uri: string; mimeType?: string | null };
  }) => {
    if (!user) throw new Error('Sign in to post a journal update.');
    const missionary = missionaries.find((item) => item.id === missionaryId);
    if (!missionary?.isMainSupporter) throw new Error('Only the main supporter can post journal updates.');
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const id = `${missionaryId}-journal-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
    const mimeType = entry.photo?.mimeType?.startsWith('image/') ? entry.photo.mimeType : 'image/jpeg';
    let photoRef: ReturnType<typeof ref> | null = null;
    let imageUrl: string | undefined;
    let imagePath: string | undefined;

    if (entry.photo && user.id !== PREVIEW_USER_ID) {
      imagePath = `missionJournals/${user.id}/${missionaryId}/${id}/photo.${getImageExtension(mimeType)}`;
      photoRef = ref(getFirebaseStorage(), imagePath);
      const photoBlob = await blobFromUri(entry.photo.uri);
      try {
        await uploadBytes(photoRef, photoBlob, { contentType: mimeType });
        imageUrl = await getDownloadURL(photoRef);
      } catch (error) {
        await deleteObject(photoRef).catch(() => undefined);
        throw error;
      }
    } else if (entry.photo) {
      imageUrl = entry.photo.uri;
    }

    const item: JournalEntry = {
      id,
      title: entry.title.trim(),
      body: entry.body.trim(),
      date,
      author: user.name || 'You',
      ...(imageUrl ? { imageUrl } : {}),
      ...(imagePath ? { imagePath } : {}),
    };
    if (user.id === PREVIEW_USER_ID) {
      setData((current) => ({
        ...current,
        missionaries: current.missionaries.map((existing) => existing.id === missionaryId
          ? { ...existing, journal: [...existing.journal, item] }
          : existing),
      }));
      return;
    }
    const reference = doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionaryId);
    try {
      await updateDoc(reference, { journal: arrayUnion(item) });
    } catch (error) {
      if (photoRef) await deleteObject(photoRef).catch(() => undefined);
      throw error;
    }
  }, [missionaries, user]);

  const updateMissionary = useCallback(async (missionaryId: string, form: LinkMissionaryForm) => {
    if (!user) throw new Error('Sign in to update a missionary.');
    const existing = missionaries.find((item) => item.id === missionaryId);
    if (!existing) throw new Error('Missionary not found.');
    const mtcWhen = form.mtcDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const name = [form.title, form.firstName.trim(), form.lastName.trim()].join(' ');
    const moments = existing.moments.map((moment) => {
      if (moment.phase === 'mtc' && /MTC/i.test(moment.title)) return { ...moment, when: mtcWhen };
      if (moment.phase === 'home' && /return/i.test(moment.title)) {
        return { ...moment, when: `After ${form.missionLength}` };
      }
      return moment;
    });
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
      await updateDoc(doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionaryId),
        omitUndefined(updated) as Record<string, unknown>);
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

  const updatePhaseMomentDate = useCallback(async (missionaryId: string, phase: MissionPhase, title: string, date: string) => {
    if (!user) throw new Error('Sign in to update a phase moment.');
    const current = missionaries.find((missionary) => missionary.id === missionaryId);
    if (!current) throw new Error('Missionary not found.');
    const trimmedDate = date.trim();
    const moments = current.moments.map((moment) => {
      if (moment.phase !== phase || moment.title !== title) return moment;
      return trimmedDate
        ? { ...moment, when: trimmedDate }
        : { title: moment.title, phase: moment.phase, done: moment.done };
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
    linkMissionary,
    addJournalEntry,
    updateMissionary,
    deleteMissionary,
    updatePhaseMomentDate,
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
