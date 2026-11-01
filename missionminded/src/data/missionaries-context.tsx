import { addDoc, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/data/auth';
import { getFirebaseFirestore } from '@/data/firebase';
import {
  createMissionaryProfile,
  type MissionaryDetails,
  type NewMissionary,
} from '@/data/repository';
import { cancelLocalReminder } from '@/data/notification-service';

type MissionariesContextValue = {
  missionaries: MissionaryDetails[];
  appointments: CalendarAppointment[];
  loading: boolean;
  addMissionary: (input: Omit<NewMissionary, 'id'>) => Promise<string>;
  addAppointment: (appointment: Omit<CalendarAppointment, 'id'>) => Promise<void>;
  updateMilestoneDate: (missionaryId: string, milestoneIndex: number, date: string) => Promise<void>;
};

export type CalendarAppointment = {
  id: string;
  missionaryId: string;
  title: string;
  startsAt: string;
};

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

export function MissionariesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<{
    userId: string | null;
    missionaries: MissionaryDetails[];
    appointments: CalendarAppointment[];
  }>({ userId: null, missionaries: [], appointments: [] });
  const missionaries = useMemo(
    () => data.userId === user?.id ? data.missionaries : [],
    [data.missionaries, data.userId, user?.id],
  );
  const appointments = useMemo(
    () => data.userId === user?.id ? data.appointments : [],
    [data.appointments, data.userId, user?.id],
  );
  const loading = Boolean(user && data.userId !== user.id);

  useEffect(() => {
    if (!user) return;

    const db = getFirebaseFirestore();
    const missionaryCollection = collection(db, 'users', user.id, 'missionaries');
    const appointmentCollection = collection(db, 'users', user.id, 'appointments');
    const stopMissionaries = onSnapshot(missionaryCollection, (snapshot) => {
      setData((current) => ({
        userId: user.id,
        missionaries: snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as MissionaryDetails),
        appointments: current.userId === user.id ? current.appointments : [],
      }));
    }, () => {
      setData((current) => ({
        userId: user.id,
        missionaries: [],
        appointments: current.userId === user.id ? current.appointments : [],
      }));
    });
    const stopAppointments = onSnapshot(appointmentCollection, (snapshot) => {
      setData((current) => ({
        userId: user.id,
        missionaries: current.userId === user.id ? current.missionaries : [],
        appointments: snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as CalendarAppointment),
      }));
    }, () => {
      setData((current) => ({
        userId: user.id,
        missionaries: current.userId === user.id ? current.missionaries : [],
        appointments: [],
      }));
    });

    return () => {
      stopMissionaries();
      stopAppointments();
    };
  }, [user]);

  const addMissionary = useCallback(async (input: Omit<NewMissionary, 'id'>) => {
    if (!user) throw new Error('Sign in to link a missionary.');
    const profile = createMissionaryProfile({ ...input, id: '' });
    const { id: _unusedId, ...profileData } = profile;
    const db = getFirebaseFirestore();
    const reference = await addDoc(collection(db, 'users', user.id, 'missionaries'),
      omitUndefined(profileData) as Record<string, unknown>);
    const savedProfile = { ...profile, id: reference.id };
    setData((current) => current.userId === user.id
      ? { ...current, missionaries: [...current.missionaries.filter((item) => item.id !== reference.id), savedProfile] }
      : current);
    return reference.id;
  }, [user]);

  const addAppointment = useCallback(async (appointment: Omit<CalendarAppointment, 'id'>) => {
    if (!user) throw new Error('Sign in to add an appointment.');
    await addDoc(collection(getFirebaseFirestore(), 'users', user.id, 'appointments'), appointment);
  }, [user]);

  const updateMilestoneDate = useCallback(async (missionaryId: string, milestoneIndex: number, date: string) => {
    if (!user) throw new Error('Sign in to update a milestone.');
    const missionary = missionaries.find((item) => item.id === missionaryId);
    if (!missionary || !missionary.journey[milestoneIndex]) return;
    const cleanDate = date.trim();
    if (!cleanDate) void cancelLocalReminder(`milestone:${missionaryId}:${milestoneIndex}`);
    const journey = missionary.journey.map((milestone, index) => (
      index === milestoneIndex ? { ...milestone, date: cleanDate || null } : milestone
    ));
    await updateDoc(doc(getFirebaseFirestore(), 'users', user.id, 'missionaries', missionaryId), {
      journey: omitUndefined(journey) as typeof journey,
    });
  }, [missionaries, user]);

  return (
    <MissionariesContext.Provider value={{ missionaries, appointments, loading, addMissionary, addAppointment, updateMilestoneDate }}>
      {children}
    </MissionariesContext.Provider>
  );
}

export function useMissionaries() {
  const value = useContext(MissionariesContext);
  if (!value) throw new Error('useMissionaries must be used inside MissionariesProvider');
  return value;
}
