import { arrayUnion, collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/data/auth';
import { getFirebaseFirestore } from '@/data/firebase';
import {
  buildLinkedMissionary,
  type LinkMissionaryForm,
  missionPhases,
  phaseInfo,
  type CalendarItem,
  type GrowingTogetherItem,
  type Milestone,
  type MissionPhase,
  type MissionaryDetails,
} from '@/data/repository';

type MissionariesContextValue = {
  missionaries: MissionaryDetails[];
  getById: (id: string) => MissionaryDetails | undefined;
  linkMissionary: (form: LinkMissionaryForm) => Promise<MissionaryDetails>;
  addCalendarItem: (missionaryId: string, title: string, date: string) => Promise<void>;
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

function isMissionPhase(value: unknown): value is MissionPhase {
  return typeof value === 'string' && missionPhases.includes(value as MissionPhase);
}

function normalizePhase(value: unknown, currentStage: unknown): MissionPhase {
  if (isMissionPhase(value)) return value;
  const stage = asString(currentStage).trim().toLowerCase();
  const stagePhases: Record<string, MissionPhase> = {
    preparing: 'preparing',
    'pre-mission': 'preparing',
    called: 'called',
    mtc: 'mtc',
    serving: 'serving',
    home: 'home',
  };
  return stagePhases[stage] ?? 'preparing';
}

function normalizeMilestones(value: unknown, legacyJourney: unknown, phase: MissionPhase): Milestone[] {
  const source = Array.isArray(value) ? value : Array.isArray(legacyJourney) ? legacyJourney : [];
  return source.flatMap((entry) => {
    const item = asRecord(entry);
    const title = asString(item.title).trim();
    if (!title) return [];
    const when = asString(item.when, asString(item.date));
    return [{
      title,
      description: asString(item.description),
      phase: isMissionPhase(item.phase) ? item.phase : phase,
      ...(when ? { when } : {}),
      done: item.done === true || item.state === 'complete',
    }];
  });
}

function normalizeMissionary(id: string, value: unknown): MissionaryDetails {
  const raw = asRecord(value);
  const name = asString(raw.name, 'Missionary');
  const words = name.trim().split(/\s+/).filter(Boolean);
  const phase = normalizePhase(raw.phase, raw.currentStage);
  const details = asRecord(raw.missionDetails);
  const climateValue = asRecord(raw.climate);
  const climate = typeof climateValue.label === 'string' && Array.isArray(climateValue.items)
    ? { label: climateValue.label, items: climateValue.items.filter((item): item is string => typeof item === 'string') }
    : null;

  const milestones = normalizeMilestones(raw.milestones, raw.journey, phase);
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
  const calendar = Array.isArray(raw.calendar)
    ? raw.calendar.flatMap((entry, index) => {
      const item = asRecord(entry);
      const title = asString(item.title).trim();
      const date = asString(item.date);
      return title && date ? [{ id: asString(item.id, `${id}-calendar-${index}`), title, date } satisfies CalendarItem] : [];
    })
    : [];
  const guesses = Array.isArray(raw.guesses)
    ? raw.guesses.flatMap((entry) => {
      const guess = asRecord(entry);
      return typeof guess.text === 'string'
        ? [{ text: guess.text, who: asString(guess.who) }]
        : [];
    })
    : [];

  return {
    id,
    name,
    shortName: asString(raw.shortName, words.length > 1 ? `${words[0]} ${words[words.length - 1]}` : name),
    firstName: asString(raw.firstName, words.find((word) => !/^(elder|sister|brother)$/i.test(word)) ?? name),
    relationship: asString(raw.relationship, 'Supporter'),
    missionName: asString(raw.missionName, 'Mission not yet known'),
    missionId: asString(raw.missionId),
    phase,
    phaseSince: asString(raw.phaseSince),
    status: asString(raw.status, phaseInfo[phase].label),
    language: asString(raw.language),
    milestones,
    growingTogetherIntro: asString(raw.growingTogetherIntro),
    growingTogether,
    ponderText: asString(raw.ponderText),
    ponderReference: asString(raw.ponderReference),
    guesses,
    calendar,
    climate,
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
    const reference = doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionary.id);
    await setDoc(reference, omitUndefined(missionary) as Record<string, unknown>);
    setData((current) => current.userId === user.id
      ? { ...current, missionaries: [...current.missionaries.filter((item) => item.id !== missionary.id), missionary] }
      : current);
    return missionary;
  }, [user]);

  const addCalendarItem = useCallback(async (missionaryId: string, title: string, date: string) => {
    if (!user) throw new Error('Sign in to add an appointment.');
    const item = { id: `${missionaryId}-${Date.now()}`, title, date };
    const reference = doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionaryId);
    await updateDoc(reference, { calendar: arrayUnion(item) });
  }, [user]);

  const toggleChecked = useCallback((key: string) => {
    if (!user) return;
    const nextChecked = { ...checked, [key]: !checked[key] };
    setData((current) => current.userId === user.id
      ? { ...current, checked: nextChecked }
      : current);
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
    addCalendarItem,
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
