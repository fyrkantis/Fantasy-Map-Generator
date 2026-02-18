export const signalBranchCoverage = (fId: number, bID: number) => {
    if (global.COVERAGE === true) {
        global.coverageLog[fId][bID] ||= true;
    }
}