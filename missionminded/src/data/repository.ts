import missionBoundaries from '@/data/mission-boundaries.json';
import type { MissionPhase } from '@/data/phase-labels';

/** The ordered mission phases, their display data, and tense-aware label helper. */
export { getPhaseLabel, missionPhases, phaseInfo } from '@/data/phase-labels';
export type { MissionPhase } from '@/data/phase-labels';

/** A smaller moment that happens within a phase, like a farewell talk or a transfer. */
export type PhaseMoment = {
  title: string;
  description: string;
  phase: MissionPhase;
  /** Plain-language timing, like "This January". */
  when?: string;
  done: boolean;
};

export type GrowingTogetherItem = {
  id: string;
  title: string;
  description: string;
};

/** A to-do or appointment on the Calendar tab. */
export type CalendarItem = {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
};

export type MissionaryDetails = {
  id: string;
  name: string;
  /** Used on chips, like "Sister Taylor". */
  shortName: string;
  firstName: string;
  /** How the signed-in supporter is related, like "Brother" or "Cousin". */
  relationship: string;
  missionName: string;
  /** Key into mission-boundaries.json. Regenerate with `npm run boundaries`. */
  missionId: string;
  phase: MissionPhase;
  /** When the current phase started, like "Since September". */
  phaseSince: string;
  /** Generated from the phase and area, like "Serving in Wasilla". */
  status: string;
  language: string;
  moments: PhaseMoment[];
  growingTogetherIntro: string;
  growingTogether: GrowingTogetherItem[];
  ponderText: string;
  ponderReference: string;
  guesses: { text: string; who: string }[];
  calendar: CalendarItem[];
  climate: { label: string; items: string[] } | null;
  missionDetails: {
    companion: string | null;
    area: string | null;
    leaders: string | null;
    office: string | null;
    phone: string | null;
    email: string | null;
  };
};

type MissionaryRecord = Omit<MissionaryDetails, 'status'>;

/** Packing items every missionary needs, whatever the mission. */
export const packingEssentials = [
  'Scriptures & Preach My Gospel',
  'Missionary name tags (2)',
  'Dress shirts or blouses',
  'Dress pants or skirts',
  'Comfortable walking shoes',
  'Toiletries kit',
];

const missionaries: MissionaryRecord[] = [
  {
    id: 'jacob',
    name: 'Elder Jacob Thompson-Whitaker',
    shortName: 'Elder Thompson-Whitaker',
    firstName: 'Jacob',
    relationship: 'Brother',
    missionId: 'peru-lima-north',
    missionName: 'Peru Lima North Mission',
    phase: 'preparing',
    phaseSince: 'Since September',
    language: 'Spanish-speaking',
    moments: [
      { title: 'Papers submitted', description: 'The first step is done', phase: 'preparing', when: 'September', done: true },
      { title: 'Mission call arrives', description: 'A day the family will remember', phase: 'preparing', when: 'Any day now', done: false },
      { title: 'Receiving his endowment', description: 'At the temple', phase: 'called', done: false },
      { title: 'Farewell talk', description: 'Sharing his testimony with the ward', phase: 'called', done: false },
      { title: 'Enters the MTC', description: 'Learning Spanish and how to teach', phase: 'mtc', when: 'This January', done: false },
      { title: 'First area', description: 'Learning to love the people', phase: 'serving', done: false },
    ],
    growingTogetherIntro: 'Jacob is preparing in Preach My Gospel. Study alongside him:',
    growingTogether: [
      { id: 'preach-my-gospel', title: 'Read Preach My Gospel ch. 3', description: 'The message of the Restoration' },
      { id: 'pray-for-jacob', title: 'Pray for Jacob as a family', description: 'For his preparation and the people he will serve' },
    ],
    ponderText: 'Wherefore, if ye have desires to serve God ye are called to the work.',
    ponderReference: 'Doctrine and Covenants 4:3',
    guesses: [
      { text: 'Brazil', who: 'Grandma' },
      { text: 'Japan', who: 'Ben' },
      { text: 'Somewhere cold!', who: 'Mom' },
    ],
    calendar: [
      { id: 'jacob-1', title: 'Temple preparation class', date: '2026-11-04' },
      { id: 'jacob-2', title: 'Plan the call-opening night', date: '2026-11-08' },
      { id: 'jacob-3', title: 'Passport photos', date: '2026-11-14' },
      { id: 'jacob-4', title: 'Dinner with the bishop', date: '2026-11-22' },
    ],
    climate: {
      label: 'Warm & humid',
      items: ['Lightweight breathable shirts', 'Packable rain jacket', 'Sunscreen & wide-brim hat', 'Insect repellent', 'Quick-dry socks'],
    },
    missionDetails: { companion: null, area: null, leaders: null, office: null, phone: null, email: null },
  },
  {
    id: 'ana',
    name: 'Sister Ana Taylor',
    shortName: 'Sister Taylor',
    firstName: 'Ana',
    relationship: 'Cousin',
    missionId: 'alaska-anchorage',
    missionName: 'Alaska Anchorage Mission',
    phase: 'serving',
    phaseSince: 'Since May 2026',
    language: 'English-speaking',
    moments: [
      { title: 'Entered the MTC', description: 'Three weeks in Provo', phase: 'mtc', when: 'Spring 2026', done: true },
      { title: 'First area: Eagle River', description: 'Where she first felt at home', phase: 'serving', when: 'May 2026', done: true },
      { title: 'Transferred to Wasilla', description: 'A new area and new people to love', phase: 'serving', when: 'September 2026', done: true },
      { title: 'Halfway point', description: 'A time to reflect on her growth', phase: 'serving', when: 'Winter 2027', done: false },
      { title: 'Returning home', description: 'Welcome her at the airport', phase: 'home', when: 'Fall 2027', done: false },
    ],
    growingTogetherIntro: 'Ana wrote that she is studying faith in Jesus Christ. Study alongside her:',
    growingTogether: [
      { id: 'alma-32', title: 'Read Alma 32 together', description: 'Faith like a seed' },
      { id: 'pray-for-ana', title: 'Pray for Ana and her companion', description: 'And for the people of Wasilla' },
    ],
    ponderText: 'Ye are the light of the world. A city that is set on an hill cannot be hid.',
    ponderReference: 'Matthew 5:14',
    guesses: [],
    calendar: [
      { id: 'ana-1', title: 'Write back on P-day', date: '2026-11-02' },
      { id: 'ana-2', title: 'Write back on P-day', date: '2026-11-09' },
      { id: 'ana-3', title: 'Transfer day', date: '2026-11-10' },
      { id: 'ana-4', title: 'Mail Christmas package by', date: '2026-11-16' },
    ],
    climate: {
      label: 'Cold & snowy',
      items: ['Insulated winter coat', 'Waterproof snow boots', 'Thermal base layers', 'Gloves, hat & scarf', 'Ice traction cleats'],
    },
    missionDetails: { companion: null, area: 'Wasilla', leaders: null, office: null, phone: null, email: null },
  },
  {
    id: 'david',
    name: 'Elder David Kim',
    shortName: 'Elder Kim',
    firstName: 'David',
    relationship: 'Friend',
    missionId: 'japan-tokyo-south',
    missionName: 'Japan Tokyo South Mission',
    phase: 'mtc',
    phaseSince: 'Since October 2026',
    language: 'Japanese-speaking',
    moments: [
      { title: 'Entered the MTC', description: 'Beginning language and teaching training', phase: 'mtc', when: 'October 2026', done: true },
      { title: 'Enters the field', description: 'Begins serving in the assigned area', phase: 'serving', when: 'January 2027', done: false },
    ],
    growingTogetherIntro: 'David is learning to teach and serve. Study alongside him:',
    growingTogether: [{ id: 'pray-for-david', title: 'Pray for David', description: 'And for the people he will serve' }],
    ponderText: 'I will go before your face. I will be on your right hand and on your left.',
    ponderReference: 'Doctrine and Covenants 84:88',
    guesses: [],
    calendar: [],
    climate: null,
    missionDetails: { companion: null, area: null, leaders: null, office: null, phone: null, email: null },
  },
  {
    id: 'claire',
    name: 'Sister Claire Miller',
    shortName: 'Sister Miller',
    firstName: 'Claire',
    relationship: 'Friend',
    missionId: 'canada-calgary',
    missionName: 'Canada Calgary Mission',
    phase: 'home',
    phaseSince: 'Since August 2026',
    language: 'English-speaking',
    moments: [
      { title: 'Returned home', description: 'Welcomed home by family and friends', phase: 'home', when: 'August 2026', done: true },
    ],
    growingTogetherIntro: 'Claire is home and continuing to serve in new ways:',
    growingTogether: [{ id: 'pray-for-claire', title: 'Pray with Claire', description: 'As she finds ways to keep serving' }],
    ponderText: 'By small and simple things are great things brought to pass.',
    ponderReference: 'Alma 37:6',
    guesses: [],
    calendar: [],
    climate: null,
    missionDetails: { companion: null, area: null, leaders: null, office: null, phone: null, email: null },
  },
];

function describeStatus({ phase, missionDetails }: MissionaryRecord) {
  switch (phase) {
    case 'preparing':
      return 'Waiting for the call';
    case 'called':
      return 'Preparing to serve';
    case 'mtc':
      return 'At the MTC';
    case 'serving':
      return missionDetails.area ? `Serving in ${missionDetails.area}` : 'Serving';
    case 'home':
      return 'Home from the mission';
  }
}

function withStatus(missionary: MissionaryRecord): MissionaryDetails {
  return { ...missionary, status: describeStatus(missionary) };
}

/** The Phase 1 sample missionaries. The in-memory store starts from these. */
export function getSampleMissionaries(): MissionaryDetails[] {
  return missionaries.map((missionary) =>
    withStatus({
      ...missionary,
      moments: [...missionary.moments],
      growingTogether: [...missionary.growingTogether],
      guesses: [...missionary.guesses],
      calendar: [...missionary.calendar],
      missionDetails: { ...missionary.missionDetails },
    }),
  );
}

/** The first phase moment that hasn't happened yet. Calendar shows this instead of a countdown. */
export function getNextMoment(missionary: MissionaryDetails): PhaseMoment | undefined {
  return missionary.moments.find((moment) => !moment.done);
}

export type LinkMissionaryForm = {
  name: string;
  relationship: string;
  missionName: string;
  /** Parsed MTC report date, or null if unknown. */
  mtcDate: Date | null;
  missionLength: string;
};

/** Builds a missionary from the Link a Missionary form. Anything unknown is left for later. */
export function buildLinkedMissionary(form: LinkMissionaryForm, today = new Date()): MissionaryDetails {
  const name = form.name.trim();
  const words = name.split(/\s+/);
  const hasTitle = /^(elder|sister)$/i.test(words[0] ?? '');
  const firstName = (hasTitle ? words[1] : words[0]) ?? name;
  const lastName = words.length > 1 ? words[words.length - 1] : '';
  const mtcWhen = form.mtcDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Without a mission name the call hasn't come. After the MTC date, they're out serving.
  let phase: MissionPhase = 'preparing';
  if (form.missionName.trim()) phase = form.mtcDate && form.mtcDate <= today ? 'serving' : 'called';

  return withStatus({
    id: `linked-${Date.now()}`,
    name,
    shortName: hasTitle && lastName ? `${words[0]} ${lastName}` : firstName,
    firstName,
    relationship: form.relationship.trim() || 'Supporter',
    missionName: form.missionName.trim() || 'Mission not yet known',
    missionId: '',
    phase,
    phaseSince: 'Just linked',
    language: '',
    moments: [
      { title: 'Enters the MTC', description: 'The start of the mission', phase: 'mtc', when: mtcWhen, done: phase === 'serving' },
      ...(form.missionLength
        ? [{ title: 'Returning home', description: `After ${form.missionLength}`, phase: 'home' as const, done: false }]
        : []),
    ],
    growingTogetherIntro: `Study and pray alongside ${firstName}:`,
    growingTogether: [{ id: 'pray', title: `Pray for ${firstName} as a family`, description: 'And for the people they serve' }],
    ponderText: 'By small and simple things are great things brought to pass.',
    ponderReference: 'Alma 37:6',
    guesses: [],
    calendar: [],
    climate: null,
    missionDetails: { companion: null, area: null, leaders: null, office: null, phone: null, email: null },
  });
}

export type MissionBoundary = {
  name: string;
  areas: string[];
  approximate: boolean;
  /** [west, south, east, north] in degrees. West can be below -180 for date-line missions. */
  bbox: [number, number, number, number];
  geometry: { type: 'MultiPolygon'; coordinates: number[][][][] };
};

/** Mission outline built from OpenStreetMap admin areas, or undefined if not mapped yet. */
export function getMissionBoundary(missionId: string): MissionBoundary | undefined {
  const missions = missionBoundaries.missions as unknown as Record<string, MissionBoundary>;
  return missions[missionId];
}
