import { createContext, useContext, useState, type ReactNode } from 'react';

import {
  buildLinkedMissionary,
  getSampleMissionaries,
  type LinkMissionaryForm,
  type MissionaryDetails,
} from '@/data/repository';

type MissionariesContextValue = {
  missionaries: MissionaryDetails[];
  getById: (id: string) => MissionaryDetails | undefined;
  /** Adds a missionary from the Link a Missionary form and returns it. */
  linkMissionary: (form: LinkMissionaryForm) => MissionaryDetails;
  addCalendarItem: (missionaryId: string, title: string, date: string) => void;
  /** Checkmarks for to-dos and packing items, keyed like "ana:packing:Toiletries kit". */
  checked: Record<string, boolean>;
  toggleChecked: (key: string) => void;
  /** The missionary picked on Calendar and Packing, so switching tabs keeps the choice. */
  selectedId: string;
  setSelectedId: (id: string) => void;
};

const MissionariesContext = createContext<MissionariesContextValue | null>(null);

/** Keeps linked missionaries and checklists in memory. Refreshing the app resets them. */
export function MissionariesProvider({ children }: { children: ReactNode }) {
  const [missionaries, setMissionaries] = useState(getSampleMissionaries);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState(() => missionaries[0]?.id ?? '');

  const linkMissionary = (form: LinkMissionaryForm) => {
    const missionary = buildLinkedMissionary(form);
    setMissionaries((current) => [...current, missionary]);
    return missionary;
  };

  const addCalendarItem = (missionaryId: string, title: string, date: string) => {
    setMissionaries((current) =>
      current.map((missionary) =>
        missionary.id === missionaryId
          ? { ...missionary, calendar: [...missionary.calendar, { id: `${missionaryId}-${Date.now()}`, title, date }] }
          : missionary,
      ),
    );
  };

  return (
    <MissionariesContext.Provider
      value={{
        missionaries,
        getById: (id) => missionaries.find((missionary) => missionary.id === id),
        linkMissionary,
        addCalendarItem,
        checked,
        toggleChecked: (key) => setChecked((current) => ({ ...current, [key]: !current[key] })),
        selectedId,
        setSelectedId,
      }}>
      {children}
    </MissionariesContext.Provider>
  );
}

export function useMissionaries() {
  const value = useContext(MissionariesContext);
  if (!value) throw new Error('useMissionaries must be used inside MissionariesProvider');
  return value;
}
