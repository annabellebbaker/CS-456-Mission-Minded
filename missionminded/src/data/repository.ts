export const journeyStages = ['Called', 'Preparing', 'MTC', 'Serving', 'Home'] as const;

export type JourneyStage = (typeof journeyStages)[number];

export type MissionarySummary = {
  id: string;
  name: string;
  missionName: string;
  status: string;
  currentStage: JourneyStage;
};

const thoughtForToday = {
  text: 'Be thou humble; and the Lord thy God shall lead thee by the hand, and give thee answer to thy prayers.',
  reference: 'Doctrine and Covenants 112:10',
};

const missionaries: MissionarySummary[] = [
  {
    id: 'jacob',
    name: 'Elder Jacob Thompson-Whitaker',
    missionName: 'Peru Lima North Mission',
    status: 'Preparing to serve',
    currentStage: 'Preparing',
  },
  {
    id: 'ana',
    name: 'Sister Ana Taylor',
    missionName: 'Alaska Anchorage Mission',
    status: 'Serving in Wasilla',
    currentStage: 'Serving',
  },
];

/** Read the local Phase 1 home data through this module. */
export function getHomeData() {
  return {
    thoughtForToday: { ...thoughtForToday },
    missionaries: missionaries.map((missionary) => ({ ...missionary })),
  };
}
