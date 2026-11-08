/** The mission phases in journey order. */
export const missionPhases = ['preparing', 'called', 'mtc', 'serving', 'home'] as const;

export type MissionPhase = (typeof missionPhases)[number];

type PhaseTenseLabels = { past: string; present: string; future: string };

export const phaseInfo: Record<MissionPhase, { label: string; summary: string; labels: PhaseTenseLabels }> = {
  preparing: {
    label: 'Assigned',
    summary: 'Papers are in. Waiting for the mission call.',
    labels: { past: 'Assigned', present: 'Assigned', future: 'Will be assigned' },
  },
  called: {
    label: 'Called',
    summary: 'The call has come. Getting ready to enter the MTC.',
    labels: { past: 'Was called', present: 'Called', future: 'Will be called' },
  },
  mtc: {
    label: 'MTC',
    summary: 'Training at the Missionary Training Center.',
    labels: { past: 'Served in the MTC', present: 'Serving in the MTC', future: 'Will serve in the MTC' },
  },
  serving: {
    label: 'Field',
    summary: 'Out in the mission field.',
    labels: { past: 'Served in the field', present: 'Serving in the field', future: 'Will serve in the field' },
  },
  home: {
    label: 'Home',
    summary: 'Returned home from the mission.',
    labels: { past: 'Returned home', present: 'Returning home', future: 'Will return home' },
  },
};

/** Return a phase label in the tense implied by its position around the current phase. */
export function getPhaseLabel(phase: MissionPhase, currentPhase: MissionPhase): string {
  const phaseIndex = missionPhases.indexOf(phase);
  const currentIndex = missionPhases.indexOf(currentPhase);
  const tense = phaseIndex < currentIndex ? 'past' : phaseIndex > currentIndex ? 'future' : 'present';
  return phaseInfo[phase].labels[tense];
}
