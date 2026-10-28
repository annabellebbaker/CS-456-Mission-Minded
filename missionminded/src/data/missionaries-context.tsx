import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

import {
  createMissionaryProfile,
  getInitialMissionaries,
  type MissionaryDetails,
  type NewMissionary,
} from '@/data/repository';

type MissionariesContextValue = {
  missionaries: MissionaryDetails[];
  addMissionary: (input: Omit<NewMissionary, 'id'>) => string;
};

const MissionariesContext = createContext<MissionariesContextValue | null>(null);

/** Holds Phase 1 missionary additions in memory until the app is refreshed. */
export function MissionariesProvider({ children }: { children: ReactNode }) {
  const [missionaries, setMissionaries] = useState(getInitialMissionaries);
  const nextId = useRef(1);

  const addMissionary = useCallback((input: Omit<NewMissionary, 'id'>) => {
    const id = `linked-${nextId.current}`;
    nextId.current += 1;
    const profile = createMissionaryProfile({ ...input, id });
    setMissionaries((current) => [...current, profile]);
    return id;
  }, []);

  return (
    <MissionariesContext.Provider value={{ missionaries, addMissionary }}>
      {children}
    </MissionariesContext.Provider>
  );
}

export function useMissionaries() {
  const value = useContext(MissionariesContext);
  if (!value) throw new Error('useMissionaries must be used inside MissionariesProvider');
  return value;
}
