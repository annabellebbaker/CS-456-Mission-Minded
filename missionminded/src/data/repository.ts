export const journeyStages = ['Called', 'Preparing', 'MTC', 'Serving', 'Home'] as const;

export type JourneyStage = (typeof journeyStages)[number];

export type MissionarySummary = {
  id: string;
  name: string;
  missionName: string;
  missionId?: string;
  status: string;
  currentStage: JourneyStage;
  relationship?: string;
  mtcReportDate?: string;
  missionLengthMonths?: string;
};

export type JourneyMilestone = {
  title: string;
  description: string;
  state: 'complete' | 'current' | 'upcoming';
  date?: string;
};

export type MissionaryDetails = MissionarySummary & {
  firstName: string;
  phase: 'pre-mission' | 'serving';
  language: string;
  journey: JourneyMilestone[];
  guesses: { text: string; who: string }[];
  missionDetails: {
    companion: string | null;
    area: string | null;
    leaders: string | null;
    office: string | null;
    phone: string | null;
    email: string | null;
  };
};

const thoughtForToday = {
  text: 'Be thou humble; and the Lord thy God shall lead thee by the hand, and give thee answer to thy prayers.',
  reference: 'Doctrine and Covenants 112:10',
};

export function getHomeData() {
  return { thoughtForToday: { ...thoughtForToday } };
}

export type NewMissionary = {
  id: string;
  name: string;
  relationship: string;
  missionName: string;
  mtcReportDate: string;
  missionLengthMonths: string;
};

export type PackingSuggestion = { id: string; missionId: string; title: string };

const knownMissionIds: Record<string, string> = {
  'alaska anchorage mission': 'alaska-anchorage',
  'peru lima north mission': 'peru-lima-north',
};

export function createMissionaryProfile(input: NewMissionary): MissionaryDetails {
  const cleanName = input.name.trim();
  const cleanMissionName = input.missionName.trim();
  const missionId = knownMissionIds[cleanMissionName.toLowerCase()]
    ?? (cleanMissionName ? cleanMissionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : undefined);
  const givenName = cleanName.replace(/^(elder|sister|brother)\s+/i, '').split(/\s+/)[0] ?? cleanName;
  const mtcDate = input.mtcReportDate.trim();
  const match = mtcDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const dateParts = match?.slice(1).map(Number);
  const date = dateParts ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : undefined;
  const validMtcDate = match && date
    && date.getFullYear() === dateParts?.[0]
    && date.getMonth() === (dateParts?.[1] ?? 1) - 1
    && date.getDate() === dateParts?.[2]
    ? mtcDate
    : undefined;

  return {
    id: input.id,
    name: cleanName,
    firstName: givenName,
    missionName: cleanMissionName || 'Mission details can be added later',
    missionId,
    status: 'Preparing to serve',
    currentStage: 'Preparing',
    relationship: input.relationship.trim(),
    mtcReportDate: mtcDate || undefined,
    missionLengthMonths: input.missionLengthMonths.trim() || undefined,
    phase: 'pre-mission',
    language: 'Details coming later',
    journey: [
      { title: 'Missionary linked', description: 'Your journey together starts here', state: 'complete' },
      { title: 'Preparing to serve', description: 'Getting ready for the mission', state: 'current' },
      { title: validMtcDate ? `Enters the MTC (${validMtcDate})` : 'Enters the MTC', description: validMtcDate || 'Date can be added later', state: 'upcoming', date: validMtcDate },
      { title: 'Begins service', description: 'More details can be added later', state: 'upcoming' },
      { title: 'Returns home', description: 'More details can be added later', state: 'upcoming' },
    ],
    guesses: [],
    missionDetails: { companion: null, area: null, leaders: null, office: null, phone: null, email: null },
  };
}
