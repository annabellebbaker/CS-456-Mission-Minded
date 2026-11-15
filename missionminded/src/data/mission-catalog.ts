import { collection, getDocs, orderBy, query } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/data/firebase';
import missionCatalogSnapshot from '@/data/mission-catalog.json';

export type MissionCatalogEntry = {
  id: string;
  name: string;
  region?: string;
};

const bundledMissionCatalog: MissionCatalogEntry[] = missionCatalogSnapshot.entries.map((entry) => ({
  id: entry.id,
  name: entry.name,
  region: entry.region,
}));

export function getBundledMissionCatalog(): MissionCatalogEntry[] {
  return bundledMissionCatalog.map((entry) => ({ ...entry }));
}

/** Uses the bundled catalog immediately, then overlays admin-maintained Firestore records. */
export async function loadMissionCatalog(): Promise<MissionCatalogEntry[]> {
  const entriesById = new Map(bundledMissionCatalog.map((entry) => [entry.id, entry]));

  try {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), 'missions'), orderBy('name')));
    for (const item of snapshot.docs) {
      const value = item.data();
      if (typeof value.name !== 'string' || !value.name.trim()) continue;
      const bundled = entriesById.get(item.id);
      entriesById.set(item.id, {
        id: item.id,
        name: value.name.trim(),
        ...(typeof value.region === 'string'
          ? { region: value.region }
          : bundled?.region
            ? { region: bundled.region }
            : {}),
      });
    }
  } catch {
    // Keep the bundled names available when Firestore is empty, offline, or not yet configured.
  }

  return [...entriesById.values()].sort((a, b) => a.name.localeCompare(b.name));
}
