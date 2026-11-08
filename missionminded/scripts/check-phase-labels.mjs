import assert from "node:assert/strict";

import { getPhaseLabel, missionPhases } from "../src/data/phase-labels.ts";

const expected = {
  assigned: ["Assigned", "Serve in the MTC", "Serve in the field", "Return home"],
  mtc: ["Assigned", "Serving in the MTC", "Serve in the field", "Return home"],
  serving: ["Assigned", "Served in the MTC", "Serving in the field", "Return home"],
  home: ["Assigned", "Served in the MTC", "Served in the field", "Returned home"],
};

for (const currentPhase of missionPhases) {
  const labels = missionPhases.map((phase) =>
    getPhaseLabel(phase, currentPhase),
  );
  assert.deepEqual(
    labels,
    expected[currentPhase],
    `Unexpected labels for a missionary in ${currentPhase}`,
  );
  console.log(`${currentPhase}: ${labels.join(" | ")}`);
}

console.log("Phase label checks passed for all four missionary phases.");
