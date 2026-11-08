import assert from 'node:assert/strict';

import { getPhaseLabel, missionPhases } from '../src/data/phase-labels.ts';

const expected = {
  preparing: ['Assigned', 'Will be called', 'Will serve in the MTC', 'Will serve in the field', 'Will return home'],
  called: ['Assigned', 'Called', 'Will serve in the MTC', 'Will serve in the field', 'Will return home'],
  mtc: ['Assigned', 'Was called', 'Serving in the MTC', 'Will serve in the field', 'Will return home'],
  serving: ['Assigned', 'Was called', 'Served in the MTC', 'Serving in the field', 'Will return home'],
  home: ['Assigned', 'Was called', 'Served in the MTC', 'Served in the field', 'Returning home'],
};

for (const currentPhase of missionPhases) {
  const labels = missionPhases.map((phase) => getPhaseLabel(phase, currentPhase));
  assert.deepEqual(labels, expected[currentPhase], `Unexpected labels for a missionary in ${currentPhase}`);
  console.log(`${currentPhase}: ${labels.join(' | ')}`);
}

console.log('Phase label checks passed for all five missionary phases.');
