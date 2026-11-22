import missionBoundaries from '@/data/mission-boundaries.json';
import type { MissionPhase } from '@/data/phase-labels';

/** The ordered mission phases, their display data, and tense-aware label helper. */
export { getPhaseLabel, missionPhases, phaseInfo } from '@/data/phase-labels';
export type { MissionPhase } from '@/data/phase-labels';

/** A smaller moment that happens within a phase, like a farewell talk or a transfer. */
export type PhaseMoment = {
  id?: string;
  title: string;
  phase: MissionPhase;
  /** Plain-language timing, like "This January". */
  when?: string;
  districtNumber?: string;
  companionName?: string;
  areaName?: string;
  done: boolean;
};

export type GrowingTogetherItem = {
  id: string;
  title: string;
  description: string;
};

/** A photo stored in Firebase Storage. `path` lets us delete it later. */
export type UpdateImage = {
  url: string;
  path?: string;
};

/** Most photos a single update can hold. */
export const MAX_UPDATE_PHOTOS = 6;

/** An update a supporter posts for others to read. */
export type MissionaryUpdate = {
  id: string;
  title: string;
  /** The post caption. */
  body: string;
  /** Photos attached to the post, in the order the supporter picked them. */
  images?: UpdateImage[];
  /** @deprecated Single-photo field from the fourth prototype. Read into `images`. */
  imageUrl?: string;
  /** @deprecated Single-photo field from the fourth prototype. Read into `images`. */
  imagePath?: string;
  /** YYYY-MM-DD */
  date: string;
  /** Name of the supporter who posted it. */
  author: string;
};

export type MissionaryDetails = {
  id: string;
  title: string;
  name: string;
  /** Used on chips, like "Sister Taylor". */
  shortName: string;
  firstName: string;
  lastName: string;
  /** How the signed-in supporter is related, like "Brother" or "Cousin". */
  relationship: string;
  /** Uploaded missionary photo (Firebase Storage download URL). Shown on the home page card. */
  photoUrl?: string;
  /** Storage path of `photoUrl`, so the old file can be deleted when the photo changes. */
  photoPath?: string;
  missionName: string;
  missionLength: string;
  /** Mission catalog ID. Used to look up the boundary map (bundled or loaded on demand). */
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
  updates: MissionaryUpdate[];
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
    title: 'Elder',
    name: 'Elder Jacob Thompson-Whitaker',
    shortName: 'Elder Thompson-Whitaker',
    firstName: 'Jacob',
    lastName: 'Thompson-Whitaker',
    relationship: 'Brother',
    missionLength: '24 months',
    missionId: 'peru-lima-north',
    missionName: 'Peru Lima North Mission',
    phase: 'assigned',
    phaseSince: 'Since September',
    language: 'Spanish-speaking',
    moments: [
      { title: 'Papers submitted', phase: 'assigned', when: '09/01/2026', done: true },
      { title: 'Mission call received', phase: 'assigned', when: '09/21/2026', done: true },
      { title: 'Receiving his endowment', phase: 'assigned', done: false },
      { title: 'Farewell talk', phase: 'assigned', done: false },
      { title: 'Enters the MTC', phase: 'mtc', when: '01/04/2027', done: false },
      { title: 'First area', phase: 'serving', when: '02/15/2027', done: false },
    ],
    growingTogetherIntro: 'Jacob is preparing in Preach My Gospel. Study alongside him:',
    growingTogether: [
      { id: 'preach-my-gospel', title: 'Read Preach My Gospel ch. 3', description: 'The message of the Restoration' },
      { id: 'pray-for-jacob', title: 'Pray for Jacob as a family', description: 'For his preparation and the people he will serve' },
    ],
    ponderText: 'Wherefore, if ye have desires to serve God ye are called to the work.',
    ponderReference: 'Doctrine and Covenants 4:3',
    updates: [
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
    title: 'Sister',
    name: 'Sister Ana Taylor',
    shortName: 'Sister Taylor',
    firstName: 'Ana',
    lastName: 'Taylor',
    relationship: 'Cousin',
    missionLength: '18 months',
    missionId: 'alaska-anchorage',
    missionName: 'Alaska Anchorage Mission',
    phase: 'serving',
    phaseSince: 'Since May 2026',
    language: 'English-speaking',
    moments: [
      { title: 'Mission call received', phase: 'assigned', when: '03/12/2025', done: true },
      { title: 'Entered the MTC', phase: 'mtc', when: '03/10/2026', done: true },
      { title: 'First area: Eagle River', phase: 'serving', when: '04/21/2026', done: true },
      { title: 'Transferred to Wasilla', phase: 'serving', when: '09/15/2026', done: true },
      { title: 'Halfway point', phase: 'serving', when: '12/10/2026', done: false },
      { title: 'Returning home', phase: 'home', when: '09/10/2027', done: false },
    ],
    growingTogetherIntro: 'Ana wrote that she is studying faith in Jesus Christ. Study alongside her:',
    growingTogether: [
      { id: 'alma-32', title: 'Read Alma 32 together', description: 'Faith like a seed' },
      { id: 'pray-for-ana', title: 'Pray for Ana and her companion', description: 'And for the people of Wasilla' },
    ],
    ponderText: 'Ye are the light of the world. A city that is set on an hill cannot be hid.',
    ponderReference: 'Matthew 5:14',
    updates: [
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
    title: 'Elder',
    name: 'Elder David Kim',
    shortName: 'Elder Kim',
    firstName: 'David',
    lastName: 'Kim',
    relationship: 'Friend',
    missionLength: '24 months',
    missionId: 'japan-tokyo-south',
    missionName: 'Japan Tokyo South Mission',
    phase: 'mtc',
    phaseSince: 'Since October 2026',
    language: 'Japanese-speaking',
    moments: [
      { title: 'Mission call received', phase: 'assigned', when: '08/18/2026', done: true },
      { title: 'Entered the MTC', phase: 'mtc', when: '10/05/2026', done: true },
      { title: 'Enters the field', phase: 'serving', when: '01/15/2027', done: false },
    ],
    growingTogetherIntro: 'David is learning to teach and serve. Study alongside him:',
    growingTogether: [{ id: 'pray-for-david', title: 'Pray for David', description: 'And for the people he will serve' }],
    ponderText: 'I will go before your face. I will be on your right hand and on your left.',
    ponderReference: 'Doctrine and Covenants 84:88',
    updates: [
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
    title: 'Sister',
    name: 'Sister Claire Miller',
    shortName: 'Sister Miller',
    firstName: 'Claire',
    lastName: 'Miller',
    relationship: 'Friend',
    missionLength: '18 months',
    missionId: 'canada-calgary',
    missionName: 'Canada Calgary Mission',
    phase: 'home',
    phaseSince: 'Since August 2026',
    language: 'English-speaking',
    moments: [
      { title: 'Mission call received', phase: 'assigned', when: '02/20/2024', done: true },
      { title: 'Entered the MTC', phase: 'mtc', when: '02/24/2025', done: true },
      { title: 'First area', phase: 'serving', when: '04/07/2025', done: true },
      { title: 'Returned home', phase: 'home', when: '08/20/2026', done: true },
    ],
    growingTogetherIntro: 'Claire is home and continuing to serve in new ways:',
    growingTogether: [{ id: 'pray-for-claire', title: 'Pray with Claire', description: 'As she finds ways to keep serving' }],
    ponderText: 'By small and simple things are great things brought to pass.',
    ponderReference: 'Alma 37:6',
    updates: [],
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
      moments: ensureCoreTimelineMoments([...missionary.moments], missionary.missionLength, missionary.phase),
      growingTogether: [...missionary.growingTogether],
      updates: [...missionary.updates],
      missionDetails: { ...missionary.missionDetails },
    }),
  );
}

export type MissionaryForm = {
  title: 'Elder' | 'Sister';
  firstName: string;
  lastName: string;
  relationship: string;
  missionName: string;
  /** Selected shared catalog document ID, or blank for a manually entered name. */
  missionId?: string;
  assignedDate: Date;
  mtcDate: Date;
  missionLength: string;
  /** Optional details the supporter knows, like companion and area. Blank fields are saved as null. */
  missionDetails?: MissionaryDetails['missionDetails'];
  /** A newly picked photo to upload. Leave undefined to keep the current photo; null removes it. */
  photo?: { uri: string; mimeType?: string | null } | null;
};

export function formatMissionDate(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
}

export function parseMissionDate(value?: string): Date | null {
  const text = value?.trim();
  if (!text) return null;
  const slashDate = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(text);
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const writtenDate = /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/.exec(text);
  let year: number;
  let month: number;
  let day: number;
  if (slashDate) {
    month = Number(slashDate[1]);
    day = Number(slashDate[2]);
    year = Number(slashDate[3]);
    if (slashDate[3].length === 2) year += year < 70 ? 2000 : 1900;
  } else if (isoDate) {
    year = Number(isoDate[1]);
    month = Number(isoDate[2]);
    day = Number(isoDate[3]);
  } else if (writtenDate) {
    year = Number(writtenDate[3]);
    month = new Date(`${writtenDate[1]} 1, ${year}`).getMonth() + 1;
    day = Number(writtenDate[2]);
  } else {
    return null;
  }
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function calculateReturnHomeDate(mtcDate: Date, missionLength: string): Date | null {
  const duration = /^(\d+)\s+(days|months)$/i.exec(missionLength.trim());
  if (!duration) return null;
  const amount = Number(duration[1]);
  const unit = duration[2].toLowerCase();
  if (!Number.isInteger(amount) || amount <= 0) return null;
  const result = new Date(mtcDate);
  if (unit === 'days') {
    result.setDate(result.getDate() + amount);
    return result;
  }
  const targetMonth = result.getMonth() + amount;
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(targetMonth);
  result.setDate(Math.min(originalDay, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()));
  return result;
}

function normalizeCoreMomentTitle(title: string): string {
  const monthPattern = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
  const datePattern = `(?:(?:date\\s*:?\\s*)?\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?|(?:date\\s*:?\\s*)?\\d{4}-\\d{1,2}-\\d{1,2}|(?:date\\s*:?\\s*)?(?:${monthPattern})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{2,4})?|(?:date\\s*:?\\s*)?(?:${monthPattern})\\.?\\s+\\d{4}|(?:date\\s*:?\\s*)?\\d{4})`;
  return title
    .replace(new RegExp(`\\s*\\(\\s*${datePattern}\\s*\\)\\s*$`, 'i'), '')
    .replace(new RegExp(`\\s+[-–—,:|]?\\s*${datePattern}\\s*$`, 'i'), '')
    .replace(/\s*\(\s*\)\s*$/, '')
    .trim();
}

function getMomentDateFromTitle(title: string): Date | null {
  const monthPattern = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/,
    /(\d{4}-\d{1,2}-\d{1,2})/,
    new RegExp(`((?:${monthPattern})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{2,4})?)`, 'i'),
    new RegExp(`((?:${monthPattern})\\.?\\s+\\d{4})`, 'i'),
  ];
  for (const pattern of datePatterns) {
    const match = pattern.exec(title);
    if (match?.[1]) {
      const date = parseMissionDate(match[1]);
      if (date) return date;
    }
  }
  return null;
}

function isAssignedAnchor(moment: PhaseMoment): boolean {
  const title = normalizeCoreMomentTitle(moment.title);
  return /^(?:assigned(?: to (?:the )?mission)?(?: date)?|mission assignment(?: date)?|mission call(?: received| opened)?(?: with family)?|received (?:his|her|their )?(?:mission )?call|call received|called(?: to serve)?|preparing to serve|preapring to serve|prepare to serve)$/i.test(title);
}

function isMtcAnchor(moment: PhaseMoment): boolean {
  const title = normalizeCoreMomentTitle(moment.title);
  return /^(?:(?:entered|enters|starting|starts|began|begins)(?: the)? MTC|MTC(?: date| start(?: date)?| report date| arrival| entry)?)$/i.test(title);
}

function isFieldAnchor(moment: PhaseMoment): boolean {
  return /^(?:serves? in (?:the )?(?:mission )?field|entered (?:the )?(?:mission )?field|enters (?:the )?(?:mission )?field|starts? serving(?: in the field)?|first area(?:\s*:.*)?)$/i.test(normalizeCoreMomentTitle(moment.title));
}

function isHomeAnchor(moment: PhaseMoment): boolean {
  return /^(?:return(?:s|ing)? home(?: date)?|returned home|home from (?:the )?mission|mission completed|homecoming)$/i.test(normalizeCoreMomentTitle(moment.title));
}

/** Adds the four anchor milestones while retaining the missionary's custom timeline events. */
export function ensureCoreTimelineMoments(
  moments: PhaseMoment[],
  missionLength: string,
  currentPhase: MissionPhase,
  assignedDate?: Date,
  mtcDate?: Date,
): PhaseMoment[] {
  const next = [...moments];
  const assignedSource = next.find((moment) => isAssignedAnchor(moment) && moment.title.trim().toLowerCase() === 'assigned' && moment.when)
    ?? next.find((moment) => isAssignedAnchor(moment) && moment.when);
  const mtcSource = next.find(isMtcAnchor);
  const fieldSource = next.find(isFieldAnchor);
  const homeSource = next.find(isHomeAnchor);
  const assignedSourceDate = parseMissionDate(assignedSource?.when)
    ?? (assignedSource ? getMomentDateFromTitle(assignedSource.title) : null);
  const resolvedMtcDate = mtcDate ?? parseMissionDate(mtcSource?.when)
    ?? (mtcSource ? getMomentDateFromTitle(mtcSource.title) : null);
  const calculatedHomeDate = resolvedMtcDate ? calculateReturnHomeDate(resolvedMtcDate, missionLength) : null;
  const mtcDateHasPassed = resolvedMtcDate ? resolvedMtcDate.getTime() <= Date.now() : undefined;
  const anchorMoments: PhaseMoment[] = [
    {
      ...(next.find((moment) => moment.id === 'core-assigned') ?? {}),
      id: 'core-assigned',
      title: 'Assigned',
      phase: 'assigned',
      ...(assignedDate || assignedSourceDate
        ? { when: formatMissionDate(assignedDate ?? assignedSourceDate!) }
        : assignedSource?.when ? { when: assignedSource.when } : {}),
      done: true,
    },
    {
      ...(mtcSource ?? {}),
      id: 'core-mtc',
      title: 'Enters the MTC',
      phase: 'mtc',
      ...(resolvedMtcDate ? { when: formatMissionDate(resolvedMtcDate) } : mtcSource?.when ? { when: mtcSource.when } : {}),
      done: mtcDateHasPassed ?? (mtcSource?.done === true || currentPhase !== 'assigned'),
    },
    {
      ...(fieldSource ?? {}),
      id: 'core-serving',
      title: 'Serves in the field',
      phase: 'serving',
      ...(!fieldSource?.areaName && fieldSource?.title.includes(':')
        ? { areaName: fieldSource.title.split(':').slice(1).join(':').trim() }
        : {}),
      done: fieldSource?.done === true || currentPhase === 'serving' || currentPhase === 'home',
    },
  ];
  const preservedHomeDate = parseMissionDate(homeSource?.when);
  const keepExistingHomeDate = preservedHomeDate
    && ((currentPhase === 'home' || homeSource?.done) || mtcDate === undefined);
  const homeWhen = keepExistingHomeDate
    ? formatMissionDate(preservedHomeDate)
    : calculatedHomeDate
      ? formatMissionDate(calculatedHomeDate)
      : undefined;
  if (homeWhen) {
    anchorMoments.push({
      ...(homeSource ?? {}),
      id: 'core-home',
      title: 'Returns home',
      phase: 'home',
      when: homeWhen,
      done: homeSource?.done === true || currentPhase === 'home'
        || (parseMissionDate(homeWhen)?.getTime() ?? Infinity) <= Date.now(),
    });
  }
  const coreIds = new Set(['core-assigned', 'core-mtc', 'core-serving', 'core-home']);
  const isExistingCoreStatus = (moment: PhaseMoment) =>
    isAssignedAnchor(moment) || isMtcAnchor(moment) || isFieldAnchor(moment) || isHomeAnchor(moment);
  const retainedMoments: PhaseMoment[] = [];
  const seenEvents = new Set<string>();
  for (const moment of next) {
    if (coreIds.has(moment.id ?? '') || isExistingCoreStatus(moment)) continue;
    const normalizedDate = parseMissionDate(moment.when);
    const dateKey = normalizedDate ? formatMissionDate(normalizedDate) : moment.when?.trim().toLowerCase() ?? '';
    const titleKey = moment.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const eventKey = [titleKey, dateKey || moment.phase].join('|');
    if (seenEvents.has(eventKey)) continue;
    seenEvents.add(eventKey);
    retainedMoments.push(moment);
  }
  return [...retainedMoments, ...anchorMoments];
}

/** Builds a missionary record with separate name fields and a formatted display name. */
export function buildMissionary(form: MissionaryForm, today = new Date()): MissionaryDetails {
  const title = form.title;
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  const name = [title, firstName, lastName].join(' ');
  const mtcWhen = formatMissionDate(form.mtcDate);
  const returnHomeDate = calculateReturnHomeDate(form.mtcDate, form.missionLength);

  // Without a mission name the call hasn't come. Use the known dates to place the current phase.
  let phase: MissionPhase = 'assigned';
  if (form.missionName.trim() && returnHomeDate && returnHomeDate <= today) phase = 'home';
  else if (form.missionName.trim() && form.mtcDate <= today) phase = 'serving';

  return withStatus({
    id: `missionary-${Date.now()}`,
    title,
    name,
    shortName: `${title} ${lastName}`,
    firstName,
    lastName,
    relationship: form.relationship.trim(),
    missionName: form.missionName.trim(),
    missionLength: form.missionLength,
    missionId: form.missionId?.trim() ?? '',
    phase,
    phaseSince: `Since ${form.assignedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    language: '',
    moments: ensureCoreTimelineMoments([
      { id: 'core-assigned', title: 'Assigned', phase: 'assigned', when: formatMissionDate(form.assignedDate), done: true },
      { id: 'core-mtc', title: 'Enters the MTC', phase: 'mtc', when: mtcWhen, done: phase !== 'assigned' },
      { id: 'core-serving', title: 'Serves in the field', phase: 'serving', done: phase === 'serving' || phase === 'home' },
      ...(returnHomeDate ? [{ id: 'core-home', title: 'Returns home', phase: 'home' as const, when: formatMissionDate(returnHomeDate), done: false }] : []),
    ], form.missionLength, phase, form.assignedDate, form.mtcDate),
    growingTogetherIntro: `Study and pray alongside ${firstName}:`,
    growingTogether: [{ id: 'pray', title: `Pray for ${firstName} as a family`, description: 'And for the people they serve' }],
    ponderText: 'By small and simple things are great things brought to pass.',
    ponderReference: 'Alma 37:6',
    updates: [],
    missionDetails: form.missionDetails ?? { companion: null, area: null, leaders: null, office: null, phone: null, email: null },
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

/**
 * Hand-curated outline bundled with the app, or undefined. Most missions aren't
 * bundled: use `useMissionBoundary` / `loadMissionBoundary` from
 * '@/data/mission-boundary-loader', which falls back to a live lookup.
 */
export function getMissionBoundary(missionId: string): MissionBoundary | undefined {
  const missions = missionBoundaries.missions as unknown as Record<string, MissionBoundary>;
  return missions[missionId];
}
