export const journeyStages = ['Called', 'Preparing', 'MTC', 'Serving', 'Home'] as const;

export type JourneyStage = (typeof journeyStages)[number];

export type MissionarySummary = {
  id: string;
  name: string;
  missionName: string;
  status: string;
  currentStage: JourneyStage;
};

export type JourneyMilestone = {
  title: string;
  description: string;
  state: 'complete' | 'current' | 'upcoming';
};

export type GrowingTogetherItem = {
  id: string;
  title: string;
  description: string;
};

export type MissionaryDetails = MissionarySummary & {
  firstName: string;
  phase: 'pre-mission' | 'serving';
  language: string;
  journey: JourneyMilestone[];
  growingTogetherIntro: string;
  growingTogether: GrowingTogetherItem[];
  ponderText: string;
  ponderReference: string;
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

const missionaries: MissionaryDetails[] = [
  {
    id: 'jacob',
    name: 'Elder Jacob Thompson-Whitaker',
    firstName: 'Jacob',
    missionName: 'Peru Lima North Mission',
    status: 'Preparing to serve',
    currentStage: 'Preparing',
    phase: 'pre-mission',
    language: 'Spanish-speaking',
    journey: [
      { title: 'Mission call opened', description: 'A day the family will remember', state: 'complete' },
      { title: 'Receiving his endowment', description: 'Upcoming at the temple', state: 'current' },
      { title: 'Farewell talk', description: 'Sharing his testimony with the ward', state: 'upcoming' },
      { title: 'Enters the MTC', description: 'This January', state: 'upcoming' },
      { title: 'Serving in Peru', description: 'Learning to love the people', state: 'upcoming' },
    ],
    growingTogetherIntro: 'Jacob is preparing in Preach My Gospel. Study alongside him:',
    growingTogether: [
      { id: 'preach-my-gospel', title: 'Read Preach My Gospel ch. 3', description: 'The message of the Restoration' },
      { id: 'pray-for-jacob', title: 'Pray for Jacob as a family', description: 'For his preparation and the people of Peru' },
    ],
    ponderText: 'Wherefore, if ye have desires to serve God ye are called to the work.',
    ponderReference: 'Doctrine and Covenants 4:3',
    guesses: [
      { text: 'Brazil', who: 'Grandma' },
      { text: 'Japan', who: 'Ben' },
      { text: 'Somewhere cold!', who: 'Mom' },
    ],
    missionDetails: { companion: null, area: null, leaders: null, office: null, phone: null, email: null },
  },
  {
    id: 'ana',
    name: 'Sister Ana Taylor',
    firstName: 'Ana',
    missionName: 'Alaska Anchorage Mission',
    status: 'Serving in Wasilla',
    currentStage: 'Serving',
    phase: 'serving',
    language: 'English-speaking',
    journey: [
      { title: 'Entered the MTC', description: 'Spring 2026', state: 'complete' },
      { title: 'First area: Eagle River', description: 'Where she first felt at home', state: 'complete' },
      { title: 'Serving in Wasilla', description: 'A new area and new people to love', state: 'current' },
      { title: 'Halfway point', description: 'A time to reflect on her growth', state: 'upcoming' },
      { title: 'Returning home', description: 'Fall 2027', state: 'upcoming' },
    ],
    growingTogetherIntro: 'Ana wrote that she is studying faith in Jesus Christ. Study alongside her:',
    growingTogether: [
      { id: 'alma-32', title: 'Read Alma 32 together', description: 'Faith like a seed' },
      { id: 'pray-for-ana', title: 'Pray for Ana and her companion', description: 'And for the people of Wasilla' },
    ],
    ponderText: 'Ye are the light of the world. A city that is set on an hill cannot be hid.',
    ponderReference: 'Matthew 5:14',
    guesses: [],
    missionDetails: { companion: null, area: 'Wasilla', leaders: null, office: null, phone: null, email: null },
  },
];

/** Read the local Phase 1 home data through this module. */
export function getHomeData() {
  return {
    thoughtForToday: { ...thoughtForToday },
    missionaries: missionaries.map(({ id, name, missionName, status, currentStage }) => ({
      id,
      name,
      missionName,
      status,
      currentStage,
    })),
  };
}

/** Find a linked missionary's Phase 1 sample profile by route ID. */
export function getMissionaryById(id: string): MissionaryDetails | undefined {
  const missionary = missionaries.find((item) => item.id === id);
  return missionary ? { ...missionary, journey: [...missionary.journey], growingTogether: [...missionary.growingTogether], guesses: [...missionary.guesses], missionDetails: { ...missionary.missionDetails } } : undefined;
}

export type User = {
  name: string;
  email: string;
};

// Phase 1 mock accounts. Phase 2 replaces signIn with Firebase Auth.
const mockUsers = [
  { name: 'Annabelle', email: 'annabelle@example.com', password: 'mission123' },
  { name: 'Sophia', email: 'sophia@example.com', password: 'elder456' },
];

/** Check an email and password against the mock accounts. */
export function signIn(email: string, password: string): User | null {
  const cleanEmail = email.trim().toLowerCase();
  const match = mockUsers.find((user) => user.email === cleanEmail && user.password === password);
  return match ? { name: match.name, email: match.email } : null;
}
