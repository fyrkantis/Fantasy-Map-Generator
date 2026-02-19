import { afterAll } from "vitest";

globalThis.COVERAGE = true;

const functions = [
  "normalize()",
  "getHeightCost()",
  "connectVertices()",
  "expandStates()",
  "defineStateForms()"
];

globalThis.maximumCoverage = [20, 19, 30, 32, 88];

globalThis.coverageLog = globalThis.maximumCoverage.map((max:number) =>
  new Array<boolean>(max).fill(false)
);

afterAll(() => {
  for (let i = 0; i < functions.length; i++) {
    let branchesCovered = 0;

    for (let j = 0; j < globalThis.maximumCoverage[i]; j++) {
      if (globalThis.coverageLog[i][j]) branchesCovered++;
    }

    console.log(`Results for coverage of ${functions[i]}:`);
    console.log(`Branches Taken: ${branchesCovered}`);
    console.log(`Out of: ${globalThis.maximumCoverage[i]}`);
    console.log(
      `Resulting Branch Coverage: ${
        branchesCovered / globalThis.maximumCoverage[i]
      }`
    );
  }
});
