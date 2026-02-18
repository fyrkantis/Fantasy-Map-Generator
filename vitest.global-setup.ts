export default async () => {
    global.COVERAGE = true
    var functions = ["normalize()", "getHeightCost()", "markupGrid()", "expandStates()", "defineStateForms()"];
    // In the next two global variables:
    // [0] -> src/modules/states-generator/normalize()
    // [1] -> src/modules/cultures-generator/getHeightCost()
    // [2] -> src/modules/features/markupGrid()
    // [3] -> src/modules/states-generator/expandStates()
    // [4] -> src/modules/states-generator/defineStateForms()
    // Global structure containing the amount of branches in each function. Contains magic numbers.
    global.maximumCoverage = [18, 19, 22, 31, 21]; 
    // Create Structure for storing coverage results
    global.coverageLog = new Array<Array<boolean>>(5);
    for(let i = 0; i< 5; i++) { 
        global.coverageLog[i] = new Array<boolean>;
        for (let j=0; j<globalThis.maximumCoverage[i]; j++) {
            global.coverageLog[i].push(false);
        }
    }
  return async () => {
    // Log Results
    for (let i=0; i<5; i++) {
        let branchesCovered = 0;
        for (let j = 0; j < global.maximumCoverage[i]; j++) {
            branchesCovered += global.coverageLog[i][j] ? 1 : 0;
        }
        console.log(`Results for coverage of ${functions[i]}:`);
        console.log(`Branches Taken: ${branchesCovered[i]},`);
        console.log(`Out of: ${global.maximumCoverage[i]},`);
        console.log(`Resulting Branch Coverage: ${branchesCovered[i]/global.maximumCoverage[i]}`);
    }
    // Cleanup
    delete global[coverageLog];
    delete global[maximumCoverage];
    delete global[COVERAGE];
  }
}