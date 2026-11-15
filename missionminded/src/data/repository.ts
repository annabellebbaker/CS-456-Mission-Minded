import missionBoundaries from '@/data/mission-boundaries.json';
import type { MissionPhase } from '@/data/phase-labels';

/** The ordered mission phases, their display data, and tense-aware label helper. */
export { getPhaseLabel, missionPhases, phaseInfo } from '@/data/phase-labels';
export type { MissionPhase } from '@/data/phase-labels';

/** A smaller moment that happens within a phase, like a farewell talk or a transfer. */
export type PhaseMoment = {
  title: string;
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

/** An update the main supporter posts to the Journal tab for other supporters to read. */
export type JournalEntry = {
  id: string;
  title: string;
  body: string;
  /** YYYY-MM-DD */
  date: string;
  /** Name of the supporter who posted it. */
  author: string;
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
  /** Who posts Journal updates for this missionary, like "Michelle Taylor (Mom)". */
  mainSupporter: string;
  /** True when the signed-in user is the main supporter and can post to the Journal. */
  isMainSupporter: boolean;
  journal: JournalEntry[];
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

const missionaries: MissionaryRecord[] = [
  {
    id: 'jacob',
    name: 'Elder Jacob Thompson-Whitaker',
    shortName: 'Elder Thompson-Whitaker',
    firstName: 'Jacob',
    relationship: 'Brother',
    missionId: 'peru-lima-north',
    missionName: 'Peru Lima North Mission',
    phase: 'assigned',
    phaseSince: 'Since September',
    language: 'Spanish-speaking',
    moments: [
      { title: 'Papers submitted', phase: 'assigned', when: 'September', done: true },
      { title: 'Mission call received', phase: 'assigned', when: 'September', done: true },
      { title: 'Receiving his endowment', phase: 'assigned', done: false },
      { title: 'Farewell talk', phase: 'assigned', done: false },
      { title: 'Enters the MTC', phase: 'mtc', when: 'This January', done: false },
      { title: 'First area', phase: 'serving', done: false },
    ],
    growingTogetherIntro: 'Jacob is preparing in Preach My Gospel. Study alongside him:',
    growingTogether: [
      { id: 'preach-my-gospel', title: 'Read Preach My Gospel ch. 3', description: 'The message of the Restoration' },
      { id: 'pray-for-jacob', title: 'Pray for Jacob as a family', description: 'For his preparation and the people he will serve' },
    ],
    ponderText: 'Wherefore, if ye have desires to serve God ye are called to the work.',
    ponderReference: 'Doctrine and Covenants 4:3',
    mainSupporter: 'You',
    isMainSupporter: true,
    journal: [
      {
        id: 'jacob-j1',
        title: 'Mission call opened!',
        body: 'Jacob opened his call with the whole family on video. He reports to the MTC in January and is already practicing his Spanish at dinner.',
        date: '2026-09-21',
        author: 'You',
      },
      {
        id: 'jacob-j2',
        title: 'Passport appointment done',
        body: 'Photos taken and paperwork submitted. Visa paperwork is next.',
        date: '2026-11-14',
        author: 'You',
      },
    ],
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
      { title: 'Entered the MTC', phase: 'mtc', when: 'Spring 2026', done: true },
      { title: 'First area: Eagle River', phase: 'serving', when: 'May 2026', done: true },
      { title: 'Transferred to Wasilla', phase: 'serving', when: 'September 2026', done: true },
      { title: 'Halfway point', phase: 'serving', when: 'Winter 2027', done: false },
      { title: 'Returning home', phase: 'home', when: 'Fall 2027', done: false },
    ],
    growingTogetherIntro: 'Ana wrote that she is studying faith in Jesus Christ. Study alongside her:',
    growingTogether: [
      { id: 'alma-32', title: 'Read Alma 32 together', description: 'Faith like a seed' },
      { id: 'pray-for-ana', title: 'Pray for Ana and her companion', description: 'And for the people of Wasilla' },
    ],
    ponderText: 'Ye are the light of the world. A city that is set on an hill cannot be hid.',
    ponderReference: 'Matthew 5:14',
    mainSupporter: 'Michelle Taylor (Mom)',
    isMainSupporter: false,
    journal: [
      {
        id: 'ana-j1',
        title: 'Settling into Wasilla',
        body: 'Ana says Wasilla already has snow on the ground. She and her companion are teaching three families this week.',
        date: '2026-09-28',
        author: 'Michelle Taylor (Mom)',
      },
      {
        id: 'ana-j2',
        title: 'Christmas packages',
        body: 'Packages to Alaska take about three weeks. Please mail anything for Ana by November 30.',
        date: '2026-11-09',
        author: 'Michelle Taylor (Mom)',
      },
    ],
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
      { title: 'Entered the MTC', phase: 'mtc', when: 'October 2026', done: true },
      { title: 'Enters the field', phase: 'serving', when: 'January 2027', done: false },
    ],
    growingTogetherIntro: 'David is learning to teach and serve. Study alongside him:',
    growingTogether: [{ id: 'pray-for-david', title: 'Pray for David', description: 'And for the people he will serve' }],
    ponderText: 'I will go before your face. I will be on your right hand and on your left.',
    ponderReference: 'Doctrine and Covenants 84:88',
    mainSupporter: 'Grace Kim (Mom)',
    isMainSupporter: false,
    journal: [
      {
        id: 'david-j1',
        title: 'First week at the MTC',
        body: 'David wrote that Japanese is hard but his district is great. He gets emails on Mondays.',
        date: '2026-10-19',
        author: 'Grace Kim (Mom)',
      },
    ],
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
      { title: 'Returned home', phase: 'home', when: 'August 2026', done: true },
    ],
    growingTogetherIntro: 'Claire is home and continuing to serve in new ways:',
    growingTogether: [{ id: 'pray-for-claire', title: 'Pray with Claire', description: 'As she finds ways to keep serving' }],
    ponderText: 'By small and simple things are great things brought to pass.',
    ponderReference: 'Alma 37:6',
    mainSupporter: 'Robert Miller (Dad)',
    isMainSupporter: false,
    journal: [],
    missionDetails: { companion: null, area: null, leaders: null, office: null, phone: null, email: null },
  },
];

function describeStatus({ phase, missionDetails }: MissionaryRecord) {
  switch (phase) {
    case 'assigned':
      return 'Assigned';
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
      journal: [...missionary.journal],
      missionDetails: { ...missionary.missionDetails },
    }),
  );
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
  let phase: MissionPhase = 'assigned';
  if (form.missionName.trim() && form.mtcDate && form.mtcDate <= today) phase = 'serving';

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
      { title: 'Enters the MTC', phase: 'mtc', when: mtcWhen, done: phase === 'serving' },
      ...(form.missionLength
        ? [{ title: 'Returning home', phase: 'home' as const, when: `After ${form.missionLength}`, done: false }]
        : []),
    ],
    growingTogetherIntro: `Study and pray alongside ${firstName}:`,
    growingTogether: [{ id: 'pray', title: `Pray for ${firstName} as a family`, description: 'And for the people they serve' }],
    ponderText: 'By small and simple things are great things brought to pass.',
    ponderReference: 'Alma 37:6',
    // Whoever links a missionary starts as their main supporter, so they can post to the Journal.
    mainSupporter: 'You',
    isMainSupporter: true,
    journal: [],
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
