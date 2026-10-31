import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

import {
  createMissionaryProfile,
  getInitialMissionaries,
  type MissionaryDetails,
  type NewMissionary,
} from '@/data/repository';
import { cancelLocalReminder } from '@/data/notification-service';

type MissionariesContextValue = {
  missionaries: MissionaryDetails[];
  appointments: CalendarAppointment[];
  addMissionary: (input: Omit<NewMissionary, 'id'>) => string;
  addAppointment: (appointment: Omit<CalendarAppointment, 'id'>) => void;
  updateMilestoneDate: (missionaryId: string, milestoneIndex: number, date: string) => void;
};

export type CalendarAppointment = {
  id: string;
  missionaryId: string;
  title: string;
  startsAt: string;
};

const MissionariesContext = createContext<MissionariesContextValue | null>(null);

/** Holds Phase 1 missionary additions in memory until the app is refreshed. */
export function MissionariesProvider({ children }: { children: ReactNode }) {
  const [missionaries, setMissionaries] = useState(getInitialMissionaries);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const nextId = useRef(1);
  const nextAppointmentId = useRef(1);

  const addMissionary = useCallback((input: Omit<NewMissionary, 'id'>) => {
    const id = `linked-${nextId.current}`;
    nextId.current += 1;
    const profile = createMissionaryProfile({ ...input, id });
    setMissionaries((current) => [...current, profile]);
    return id;
  }, []);

  const addAppointment = useCallback((appointment: Omit<CalendarAppointment, 'id'>) => {
    const id = `appointment-${nextAppointmentId.current}`;
    nextAppointmentId.current += 1;
    setAppointments((current) => [...current, { ...appointment, id }]);
  }, []);

  const updateMilestoneDate = useCallback((missionaryId: string, milestoneIndex: number, date: string) => {
    if (!date.trim()) {
      void cancelLocalReminder(`milestone:${missionaryId}:${milestoneIndex}`);
    }
    setMissionaries((current) => current.map((missionary) => {
      if (missionary.id !== missionaryId) return missionary;
      return {
        ...missionary,
        journey: missionary.journey.map((milestone, index) => (
          index === milestoneIndex ? { ...milestone, date: date.trim() || undefined } : milestone
        )),
      };
    }));
  }, []);

  return (
    <MissionariesContext.Provider value={{ missionaries, addMissionary, appointments, addAppointment, updateMilestoneDate }}>
      {children}
    </MissionariesContext.Provider>
  );
}

export function useMissionaries() {
  const value = useContext(MissionariesContext);
  if (!value) throw new Error('useMissionaries must be used inside MissionariesProvider');
  return value;
}
