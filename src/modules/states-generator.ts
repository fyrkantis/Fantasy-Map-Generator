import { mean, median, sum } from "d3";
import {
  byId,
  each,
  gauss,
  getAdjective,
  getMixedColor,
  getPolesOfInaccessibility,
  getRandomColor,
  minmax,
  P,
  ra,
  rand,
  rn,
  rw,
  trimVowels,
} from "../utils";

import { signalBranchCoverage } from "../utils/testCoverageUtils";

declare global {
  var States: StatesModule;
}

interface Campaign {
  name: string;
  start: number;
  end?: number;
}

export interface State {
  i: number;
  name: string;
  expansionism: number;
  capital: number;
  type: string;
  center: number;
  culture: number;
  coa: any;
  lock?: boolean;
  removed?: boolean;
  pole?: [number, number];
  neighbors?: number[];
  color?: string;
  cells?: number;
  area?: number;
  burgs?: number;
  rural?: number;
  urban?: number;
  campaigns?: Campaign[];
  diplomacy?: string[];
  formName?: string;
  fullName?: string;
  form?: string;
  military?: any[];
  provinces?: number[];
}

class StatesModule {
  private createStates() {
    const states: State[] = [{ i: 0, name: "Neutrals" } as State];
    const each5th = each(5);
    const sizeVariety = (byId("sizeVariety") as HTMLInputElement).valueAsNumber;

    pack.burgs.forEach((burg) => {
      if (!burg.i || !burg.capital) return;

      const expansionism = rn(Math.random() * sizeVariety + 1, 1);
      const basename =
        burg.name!.length < 9 && each5th(burg.cell)
          ? burg.name!
          : Names.getCultureShort(burg.culture!);
      const name = Names.getState(basename, burg.culture!);
      const type = pack.cultures[burg.culture!].type;
      const coa = COA.generate(null, null, null, type);
      coa.shield = COA.getShield(burg.culture!);
      states.push({
        i: burg.i,
        name,
        expansionism,
        capital: burg.i,
        type: type!,
        center: burg.cell,
        culture: burg.culture!,
        coa,
      });
    });

    return states;
  }

  private getBiomeCost(b: number, biome: number, type: string) {
    if (b === biome) return 10; // tiny penalty for native biome
    if (type === "Hunting") return biomesData.cost[biome] * 2; // non-native biome penalty for hunters
    if (type === "Nomadic" && biome > 4 && biome < 10)
      return biomesData.cost[biome] * 3; // forest biome penalty for nomads
    return biomesData.cost[biome]; // general non-native biome penalty
  }

  private getHeightCost(f: any, h: number, type: string) {
    if (type === "Lake" && f.type === "lake") return 10; // low lake crossing penalty for Lake cultures
    if (type === "Naval" && h < 20) return 300; // low sea crossing penalty for Navals
    if (type === "Nomadic" && h < 20) return 10000; // giant sea crossing penalty for Nomads
    if (h < 20) return 1000; // general sea crossing penalty
    if (type === "Highland" && h < 62) return 1100; // penalty for highlanders on lowlands
    if (type === "Highland") return 0; // no penalty for highlanders on highlands
    if (h >= 67) return 2200; // general mountains crossing penalty
    if (h >= 44) return 300; // general hills crossing penalty
    return 0;
  }

  private getRiverCost(r: any, i: number, type: string) {
    if (type === "River") return r ? 0 : 100; // penalty for river cultures
    if (!r) return 0; // no penalty for others if there is no river
    return minmax(pack.cells.fl[i] / 10, 20, 100); // river penalty from 20 to 100 based on flux
  }

  private getTypeCost(t: number, type: string) {
    if (t === 1)
      return type === "Naval" || type === "Lake"
        ? 0
        : type === "Nomadic"
          ? 60
          : 20; // penalty for coastline
    if (t === 2) return type === "Naval" || type === "Nomadic" ? 30 : 0; // low penalty for land level 2 for Navals and nomads
    if (t !== -1) return type === "Naval" || type === "Lake" ? 100 : 0; // penalty for mainland for navals
    return 0;
  }

  generate() {
    TIME && console.time("generateStates");
    pack.states = this.createStates();
    this.expandStates();
    this.normalize();
    this.getPoles();
    this.findNeighbors();
    this.assignColors();
    this.generateCampaigns();
    this.generateDiplomacy();

    TIME && console.timeEnd("generateStates");
  }

  expandStates() {
    const fID = 3;
    signalBranchCoverage(fID, 0) //B0: 0
    TIME && console.time("expandStates");
    const { cells, states, cultures, burgs } = pack;

    cells.state = cells.state || new Uint16Array(cells.i.length);

    const queue = new FlatQueue();
    const cost: number[] = [];

    const globalGrowthRate =
      (byId("growthRate") as HTMLInputElement)?.valueAsNumber || 1;
    const statesGrowthRate =
      (byId("statesGrowthRate") as HTMLInputElement)?.valueAsNumber || 1;
    const growthRate =
      (cells.i.length / 2) * globalGrowthRate * statesGrowthRate; // limit cost for state growth
    signalBranchCoverage(fID, 1) //B16T17: 1
    // remove state from all cells except of locked
    for (const cellId of cells.i) {
      signalBranchCoverage(fID, 2) //B17T18: 2
      const state = states[cells.state[cellId]];
      signalBranchCoverage(fID, 3) //B18T19: 3
      if (state.lock) {
        signalBranchCoverage(fID, 4) //B19T17: 4
        continue;
      }
      signalBranchCoverage(fID, 5) //B19T20: 5
      cells.state[cellId] = 0;
      signalBranchCoverage(fID, 6) //B20T17: 6
    }
    signalBranchCoverage(fID, 7) //B17T21: 7
    for (const state of states) {
      signalBranchCoverage(fID, 8) //B21T22: 8
      if (!state.i || state.removed) {
        signalBranchCoverage(fID, 9) //B22T21: 9
        continue;
      }
      signalBranchCoverage(fID, 10) //B22T23: 10

      const capitalCell = burgs[state.capital].cell;
      cells.state[capitalCell] = state.i;
      const cultureCenter = cultures[state.culture].center!;
      const b = cells.biome[cultureCenter]; // state native biome
      queue.push({ e: state.center, p: 0, s: state.i, b }, 0);
      cost[state.center] = 1;
    }
    signalBranchCoverage(fID, 11) //B21T30: 11
    while (queue.length) {
      signalBranchCoverage(fID, 12) //B30T31: 12
      const next = queue.pop();

      const { e, p, s, b } = next;
      const { type, culture } = states[s];
      signalBranchCoverage(fID, 13) //B35T36: 13
      cells.c[e].forEach((e) => {
        signalBranchCoverage(fID, 14) //B36T37: 14
        const state = states[cells.state[e]];
        signalBranchCoverage(fID, 15) //B37T38: 15
        if (state.lock) {
          signalBranchCoverage(fID, 16) //B38E2: 16
          return; // do not overwrite cell of locked states
        }
        signalBranchCoverage(fID, 17) //B38T39: 17
        if (cells.state[e] && e === state.center) {
          signalBranchCoverage(fID, 18) //B39E3: 18
          return; // do not overwrite capital cells
        }
        signalBranchCoverage(fID, 19) //B39T40: 19

        const cultureCost = culture === cells.culture[e] ? -9 : 100;
        const populationCost =
          cells.h[e] < 20
            ? 0
            : cells.s[e]
              ? Math.max(20 - cells.s[e], 0)
              : 5000;
        const biomeCost = this.getBiomeCost(b, cells.biome[e], type);
        const heightCost = this.getHeightCost(
          pack.features[cells.f[e]],
          cells.h[e],
          type,
        );
        const riverCost = this.getRiverCost(cells.r[e], e, type);
        const typeCost = this.getTypeCost(cells.t[e], type);
        const cellCost = Math.max(
          cultureCost +
            populationCost +
            biomeCost +
            heightCost +
            riverCost +
            typeCost,
          0,
        );
        const totalCost = p + 10 + cellCost / states[s].expansionism;
        signalBranchCoverage(fID, 20) //B66T67: 20
        if (totalCost > growthRate) {
          signalBranchCoverage(fID, 21) //B67E4: 21
          return;
        }
        signalBranchCoverage(fID, 22) //B67T68: 22
        if (!cost[e] || totalCost < cost[e]) {
          signalBranchCoverage(fID, 23) //B68T69: 23
          if (cells.h[e] >= 20){ 
            signalBranchCoverage(fID, 24) //B69T70: 24
            cells.state[e] = s; // assign state to cell
            signalBranchCoverage(fID, 25) //B70T71: 25
          }
          signalBranchCoverage(fID, 26) //B69T71: 26
          cost[e] = totalCost;
          queue.push({ e, p: totalCost, s, b }, totalCost);
          signalBranchCoverage(fID, 27) //B72T36: 27
        }
        signalBranchCoverage(fID, 28) //B68T36: 28
      });
      signalBranchCoverage(fID, 29) //B36T30: 29
    }
    signalBranchCoverage(fID, 30) //B30T73: 30

    burgs
      .filter((b) => b.i && !b.removed)
      .forEach((b) => {
        b.state = cells.state[b.cell]; // assign state to burgs
      });
    TIME && console.timeEnd("expandStates");
    signalBranchCoverage(fID, 31) //B79E1: 31
  }

  normalize() {
    const fID = 0;
    signalBranchCoverage(fID, 0) //B0 :0
    TIME && console.time("normalizeStates");
    const { cells, burgs } = pack;
    signalBranchCoverage(fID, 1) //B3T4 :1
    for (const i of cells.i) {
      signalBranchCoverage(fID, 2) //B4T5 :2
      if (cells.h[i] < 20 || cells.burg[i]) {
        signalBranchCoverage(fID, 4) //B5T4 :4
        continue; // do not overwrite burgs
      }
      signalBranchCoverage(fID, 3) //B5T6 :3
      if (pack.states[cells.state[i]]?.lock) {
        signalBranchCoverage(fID, 6) //B6T4: 6
        continue; // do not overwrite cells of locks states
      }
      signalBranchCoverage(fID, 5) //B6T7: 5
      if (cells.c[i].some((c) => burgs[cells.burg[c]].capital)){ 
        signalBranchCoverage(fID, 8) //B7T4: 8
        continue; // do not overwrite near capital
      }
      signalBranchCoverage(fID, 7) //B7T8: 7
      const neibs = cells.c[i].filter((c) => cells.h[c] >= 20);
      const adversaries = neibs.filter(
        (c) =>
          !pack.states[cells.state[c]]?.lock &&
          cells.state[c] !== cells.state[i],
      );
      signalBranchCoverage(fID, 9) //B13T14: 9
      if (adversaries.length < 2){
        signalBranchCoverage(fID, 10) //B14T4: 10
        continue;
      } 
      signalBranchCoverage(fID, 11) //B14T15: 11
      const buddies = neibs.filter(
        (c) =>
          !pack.states[cells.state[c]]?.lock &&
          cells.state[c] === cells.state[i],
      );
      signalBranchCoverage(fID, 12) //B19T20: 12
      if (buddies.length > 2){
        signalBranchCoverage(fID, 13) ////B20T4: 13
        continue;
      }
      signalBranchCoverage(fID, 14) //B20T21: 14 
      if (adversaries.length <= buddies.length){ 
        signalBranchCoverage(fID, 15) //B21T4: 15
        continue
      };
      signalBranchCoverage(fID, 16) //B21T22: 16
      cells.state[i] = cells.state[adversaries[0]];
      signalBranchCoverage(fID, 17) //B22T4: 17
    }
    signalBranchCoverage(fID, 18) //B4T23: 18
    TIME && console.timeEnd("normalizeStates");
    signalBranchCoverage(fID, 19) //B23E1: 19
  }

  // calculate pole of inaccessibility for each state
  getPoles() {
    const getType = (cellId: number) => pack.cells.state[cellId];
    const poles = getPolesOfInaccessibility(pack, getType);

    pack.states.forEach((s) => {
      if (!s.i || s.removed) return;
      s.pole = poles[s.i] || [0, 0];
    });
  }

  findNeighbors() {
    const { cells, states } = pack;

    const stateNeighbors: Set<number>[] = [];

    states.forEach((s) => {
      if (s.removed) return;
      stateNeighbors[s.i] = new Set();
      // s.neighbors = stateNeighbors[s.i];
    });

    for (const i of cells.i) {
      if (cells.h[i] < 20) continue;
      const s = cells.state[i];

      cells.c[i]
        .filter((c) => cells.h[c] >= 20 && cells.state[c] !== s)
        .forEach((c) => {
          stateNeighbors[s].add(cells.state[c]);
        });
    }

    // convert neighbors Set object into array
    states.forEach((s) => {
      if (!stateNeighbors[s.i] || s.removed) return;
      s.neighbors = Array.from(stateNeighbors[s.i]);
    });
  }

  assignColors() {
    TIME && console.time("assignColors");
    const colors = [
      "#66c2a5",
      "#fc8d62",
      "#8da0cb",
      "#e78ac3",
      "#a6d854",
      "#ffd92f",
    ]; // d3.schemeSet2;
    const states = pack.states;

    // assign basic color using greedy coloring algorithm
    states.forEach((state) => {
      if (!state.i || state.removed || state.lock) return;
      state.color = colors.find((color) =>
        state.neighbors!.every(
          (neibStateId) => states[neibStateId].color !== color,
        ),
      );
      if (!state.color) state.color = getRandomColor();
      colors.push(colors.shift() as string);
    });

    // randomize each already used color a bit
    colors.forEach((c) => {
      const sameColored = states.filter(
        (state) => state.color === c && state.i && !state.lock,
      );
      sameColored.forEach((state, index) => {
        if (!index) return;
        state.color = getMixedColor(state.color!);
      });
    });

    TIME && console.timeEnd("assignColors");
  }

  // calculate states data like area, population etc.
  collectStatistics() {
    TIME && console.time("collectStatistics");
    const { cells, states } = pack;

    states.forEach((s) => {
      if (s.removed) return;
      s.cells = s.area = s.burgs = s.rural = s.urban = 0;
    });

    for (const i of cells.i) {
      if (cells.h[i] < 20) continue;
      const s = cells.state[i];

      // collect stats
      states[s].cells! += 1;
      states[s].area! += cells.area[i];
      states[s].rural! += cells.pop[i];
      if (cells.burg[i]) {
        states[s].urban! += pack.burgs[cells.burg[i]].population!;
        states[s].burgs!++;
      }
    }

    TIME && console.timeEnd("collectStatistics");
  }

  generateCampaign(state: State) {
    const wars = {
      War: 6,
      Conflict: 2,
      Campaign: 4,
      Invasion: 2,
      Rebellion: 2,
      Conquest: 2,
      Intervention: 1,
      Expedition: 1,
      Crusade: 1,
    };
    const neighbors = state.neighbors?.length ? state.neighbors : [0];
    return neighbors
      .map((i: number) => {
        const name =
          i && P(0.8)
            ? pack.states[i].name
            : Names.getCultureShort(state.culture);
        const start = gauss(options.year - 100, 150, 1, options.year - 6);
        const end = start + gauss(4, 5, 1, options.year - start - 1);
        return { name: `${getAdjective(name)} ${rw(wars)}`, start, end };
      })
      .sort((a, b) => a.start - b.start);
  }

  generateCampaigns() {
    pack.states.forEach((s) => {
      if (!s.i || s.removed) return;
      s.campaigns = this.generateCampaign(s);
    });
  }

  // generate Diplomatic Relationships
  generateDiplomacy() {
    TIME && console.time("generateDiplomacy");
    const { cells, states } = pack;
    states[0].diplomacy = [];
    // FIRST STATE IS ALWAYS NEUTRAL and contains the history of diplomacy
    const chronicle = states[0].diplomacy;
    const valid = states.filter((s) => s.i && !s.removed); // will filter out neutral as i is 0 => false

    const neibs = { Ally: 1, Friendly: 2, Neutral: 1, Suspicion: 10, Rival: 9 }; // relations to neighbors
    const neibsOfNeibs = { Ally: 10, Friendly: 8, Neutral: 5, Suspicion: 1 }; // relations to neighbors of neighbors
    const far = { Friendly: 1, Neutral: 12, Suspicion: 2, Unknown: 6 }; // relations to other
    const navals = { Neutral: 1, Suspicion: 2, Rival: 1, Unknown: 1 }; // relations of naval powers

    valid.forEach((s) => {
      s.diplomacy = new Array(states.length).fill("x"); // clear all relationships
    });
    if (valid.length < 2) return; // no states to generate relations with
    const areaMean: number = mean(valid.map((s) => s.area!)) as number; // average state area

    // generic relations
    for (let f = 1; f < states.length; f++) {
      if (states[f].removed) continue;
      if (states[f].diplomacy!.includes("Vassal")) {
        // Vassals copy relations from their Suzerains
        const suzerain = states[f].diplomacy!.indexOf("Vassal");

        for (let i = 1; i < states.length; i++) {
          if (i === f || i === suzerain) continue;
          states[f].diplomacy![i] = states[suzerain].diplomacy![i];
          if (states[suzerain].diplomacy![i] === "Suzerain")
            states[f].diplomacy![i] = "Ally";
          for (let e = 1; e < states.length; e++) {
            if (e === f || e === suzerain) continue;
            if (
              states[e].diplomacy![suzerain] === "Suzerain" ||
              states[e].diplomacy![suzerain] === "Vassal"
            )
              continue;
            states[e].diplomacy![f] = states[e].diplomacy![suzerain];
          }
        }
        continue;
      }

      for (let t = f + 1; t < states.length; t++) {
        if (states[t].removed) continue;

        if (states[t].diplomacy!.includes("Vassal")) {
          const suzerain = states[t].diplomacy!.indexOf("Vassal");
          states[f].diplomacy![t] = states[f].diplomacy![suzerain];
          continue;
        }

        const naval =
          states[f].type === "Naval" &&
          states[t].type === "Naval" &&
          cells.f[states[f].center] !== cells.f[states[t].center];
        const neib = naval ? false : states[f].neighbors!.includes(t);
        const neibOfNeib =
          naval || neib
            ? false
            : states[f]
                .neighbors!.map((n) => states[n].neighbors)
                .join("")
                .includes(t.toString());

        let status = naval
          ? rw(navals)
          : neib
            ? rw(neibs)
            : neibOfNeib
              ? rw(neibsOfNeibs)
              : rw(far);

        // add Vassal
        if (
          neib &&
          P(0.8) &&
          states[f].area! > areaMean &&
          states[t].area! < areaMean &&
          states[f].area! / states[t].area! > 2
        )
          status = "Vassal";
        states[f].diplomacy![t] = status === "Vassal" ? "Suzerain" : status;
        states[t].diplomacy![f] = status;
      }
    }

    // declare wars
    for (let attacker = 1; attacker < states.length; attacker++) {
      const ad = states[attacker].diplomacy as string[]; // attacker relations;
      if (states[attacker].removed) continue;
      if (!ad.includes("Rival")) continue; // no rivals to attack
      if (ad.includes("Vassal")) continue; // not independent
      if (ad.includes("Enemy")) continue; // already at war

      // random independent rival
      const defender = ra(
        ad
          .map((r, d) =>
            r === "Rival" && !states[d].diplomacy!.includes("Vassal") ? d : 0,
          )
          .filter((d) => d),
      );
      let ap = states[attacker].area! * states[attacker].expansionism;
      let dp = states[defender].area! * states[defender].expansionism;
      if (ap < dp * gauss(1.6, 0.8, 0, 10, 2)) continue; // defender is too strong

      const an = states[attacker].name;
      const dn = states[defender].name; // names
      const attackers = [attacker];
      const defenders = [defender]; // attackers and defenders array
      const dd = states[defender].diplomacy as string[]; // defender relations;

      // start an ongoing war
      const name = `${an}-${trimVowels(dn)}ian War`;
      const start = options.year - gauss(2, 3, 0, 10);
      const war = [name, `${an} declared a war on its rival ${dn}`];
      const campaign = { name, start, attacker, defender };
      states[attacker].campaigns!.push(campaign);
      states[defender].campaigns!.push(campaign);

      // attacker vassals join the war
      ad.forEach((r, d) => {
        if (r === "Suzerain") {
          attackers.push(d);
          war.push(
            `${an}'s vassal ${states[d].name} joined the war on attackers side`,
          );
        }
      });

      // defender vassals join the war
      dd.forEach((r, d) => {
        if (r === "Suzerain") {
          defenders.push(d);
          war.push(
            `${dn}'s vassal ${states[d].name} joined the war on defenders side`,
          );
        }
      });

      ap = sum(attackers.map((a) => states[a].area! * states[a].expansionism)); // attackers joined power
      dp = sum(defenders.map((d) => states[d].area! * states[d].expansionism)); // defender joined power

      // defender allies join
      dd.forEach((r, d) => {
        if (r !== "Ally" || states[d].diplomacy!.includes("Vassal")) return;
        if (
          states[d].diplomacy![attacker] !== "Rival" &&
          ap / dp > 2 * gauss(1.6, 0.8, 0, 10, 2)
        ) {
          const reason = states[d].diplomacy!.includes("Enemy")
            ? "Being already at war,"
            : `Frightened by ${an},`;
          war.push(
            `${reason} ${states[d].name} severed the defense pact with ${dn}`,
          );
          dd[d] = states[d].diplomacy![defender] = "Suspicion";
          return;
        }
        defenders.push(d);
        dp += states[d].area! * states[d].expansionism;
        war.push(
          `${dn}'s ally ${states[d].name} joined the war on defenders side`,
        );

        // ally vassals join
        states[d]
          .diplomacy!.map((r, d) => (r === "Suzerain" ? d : 0))
          .filter((d) => d)
          .forEach((v) => {
            defenders.push(v);
            dp += states[v].area! * states[v].expansionism;
            war.push(
              `${states[d].name}'s vassal ${states[v].name} joined the war on defenders side`,
            );
          });
      });

      // attacker allies join if the defender is their rival or joined power > defenders power and defender is not an ally
      ad.forEach((r, d) => {
        if (
          r !== "Ally" ||
          states[d].diplomacy!.includes("Vassal") ||
          defenders.includes(d)
        )
          return;
        const name = states[d].name;
        if (
          states[d].diplomacy![defender] !== "Rival" &&
          (P(0.2) || ap <= dp * 1.2)
        ) {
          war.push(`${an}'s ally ${name} avoided entering the war`);
          return;
        }
        const allies = states[d]
          .diplomacy!.map((r, d) => (r === "Ally" ? d : 0))
          .filter((d) => d);
        if (allies.some((ally) => defenders.includes(ally))) {
          war.push(
            `${an}'s ally ${name} did not join the war as its allies are in war on both sides`,
          );
          return;
        }

        attackers.push(d);
        ap += states[d].area! * states[d].expansionism;
        war.push(`${an}'s ally ${name} joined the war on attackers side`);

        // ally vassals join
        states[d]
          .diplomacy!.map((r, d) => (r === "Suzerain" ? d : 0))
          .filter((d) => d)
          .forEach((v) => {
            attackers.push(v);
            // TODO: I think here is a bug, it should be ap instead of dp
            ap += states[v].area! * states[v].expansionism;
            war.push(
              `${states[d].name}'s vassal ${states[v].name} joined the war on attackers side`,
            );
          });
      });

      // change relations to Enemy for all participants
      attackers.forEach((a) => {
        defenders.forEach((d: number) => {
          states[a].diplomacy![d] = states[d].diplomacy![a] = "Enemy";
        });
      });
      // TODO: record war in chronicle to keep state interface clean
      chronicle.push(war as any); // add a record to diplomatical history
    }
    TIME && console.timeEnd("generateDiplomacy");
  }

  // select a forms for listed or all valid states
  defineStateForms(list: number[] | null = null) {
    const fID = 4;
    signalBranchCoverage(fID, 0) //B0: 0
    TIME && console.time("defineStateForms");
    const states = pack.states.filter((s) => s.i && !s.removed && !s.lock);
    signalBranchCoverage(fID, 1) //B2T3: 1
    if (states.length < 1) {
      signalBranchCoverage(fID, 2) //B3E1: 2
      return;
    }
    signalBranchCoverage(fID, 3) //B3T4: 3
    const generic = { Monarchy: 25, Republic: 2, Union: 1 };
    const naval = { Monarchy: 25, Republic: 8, Union: 3 };

    const medianState = median(pack.states.map((s) => s.area))!;
    const empireMin = states.map((s) => s.area).sort((a = 0, b = 0) => b - a)[
      Math.max(Math.ceil(states.length ** 0.4) - 2, 0)
    ]!;
    const expTiers = pack.states.map((s) => {
      let tier = Math.min(Math.floor((s.area! / medianState) * 2.6), 4);
      if (tier === 4 && s.area! < empireMin) tier = 3;
      return tier;
    });

    const monarchy = [
      "Duchy",
      "Grand Duchy",
      "Principality",
      "Kingdom",
      "Empire",
    ]; // per expansionism tier
    const republic = {
      Republic: 75,
      Federation: 4,
      "Trade Company": 4,
      "Most Serene Republic": 2,
      Oligarchy: 2,
      Tetrarchy: 1,
      Triumvirate: 1,
      Diarchy: 1,
      Junta: 1,
    }; // weighted random
    const union = {
      Union: 3,
      League: 4,
      Confederation: 1,
      "United Kingdom": 1,
      "United Republic": 1,
      "United Provinces": 2,
      Commonwealth: 1,
      Heptarchy: 1,
    }; // weighted random
    const theocracy = {
      Theocracy: 20,
      Brotherhood: 1,
      Thearchy: 2,
      See: 1,
      "Holy State": 1,
    };
    const anarchy = {
      "Free Territory": 2,
      Council: 3,
      Commune: 1,
      Community: 1,
    };
    signalBranchCoverage(fID, 4) //B59T60: 4
    for (const s of states) {
      signalBranchCoverage(fID, 5) //B60T61: 5
      if (list && !list.includes(s.i)) {
        signalBranchCoverage(fID, 6) //B61E3: 6
        continue;
      }
      signalBranchCoverage(fID, 7) //B61T62: 7
      const tier = expTiers[s.i];

      const religion = pack.cells.religion[s.center];
      const isTheocracy =
        (religion && pack.religions[religion].expansion === "state") ||
        (P(0.1) &&
          ["Organized", "Cult"].includes(pack.religions[religion].type));
      const isAnarchy = P(0.01 - tier / 500);
      signalBranchCoverage(fID, 8) //B70T71: 8
      if (isTheocracy) {
        signalBranchCoverage(fID, 9) //B71T72: 9
        s.form = "Theocracy";
        signalBranchCoverage(fID, 5) //B72T78: 14
      }
      else if (isAnarchy) {
        signalBranchCoverage(fID, 10) //B71T73: 10
        signalBranchCoverage(fID, 11) //B73T74: 11
        s.form = "Anarchy";
        signalBranchCoverage(fID, 5) //B74T78: 15
      }
      else { 
        signalBranchCoverage(fID, 12) //B73T75: 12
        s.form = s.type === "Naval" ? rw(naval) : rw(generic);
        signalBranchCoverage(fID, 13) //B75T76: 13
        signalBranchCoverage(fID, 16) //B76T78: 16
      }

      const selectForm = (s: any, tier: number) => {
        signalBranchCoverage(fID, 17) //B0: 0 
        const base = pack.cultures[s.culture].base;
        signalBranchCoverage(fID, 18) //B1T2: 1
        if (s.form === "Monarchy") {
          signalBranchCoverage(fID, 19) //B2T3: 2
          const form = monarchy[tier];
          // Default name depends on exponent tier, some culture bases have special names for tiers
          signalBranchCoverage(fID, 20) //B3T4: 3
          if (s.diplomacy) {
            signalBranchCoverage(fID, 21) //B4T5: 4
            if (
              form === "Duchy" &&
              s.neighbors.length > 1 &&
              rand(6) < s.neighbors.length &&
              s.diplomacy.includes("Vassal")
            ) {
              signalBranchCoverage(fID, 22) //B5E1: 5
              return "Marches"; // some vassal duchies on borderland
            }
            signalBranchCoverage(fID, 23) //B5T12: 6
            if (base === 1 && P(0.3) && s.diplomacy.includes("Vassal")){
              signalBranchCoverage(fID, 24) //B12E2: 7
              return "Dominion"; // English vassals
            }
            signalBranchCoverage(fID, 25) //B12T13: 8
            if (P(0.3) && s.diplomacy.includes("Vassal")) {
              signalBranchCoverage(fID, 26) //B13E3: 9
              return "Protectorate"; // some vassals
            }
            signalBranchCoverage(fID, 27) //B13T14: 10
          }
          signalBranchCoverage(fID, 28) //B4T14: 11
          if (base === 31 && (form === "Empire" || form === "Kingdom"))
            {
              signalBranchCoverage(fID, 29) //B14E4: 12
              return "Khanate"; // Mongolian
            }
          signalBranchCoverage(fID, 30) //B14T15: 13
          if (base === 16 && form === "Principality") {
            signalBranchCoverage(fID, 31) //B15TE5: 14
            return "Beylik"; // Turkic
          }
          signalBranchCoverage(fID, 32) //B15T16: 15
          if (base === 5 && (form === "Empire" || form === "Kingdom"))
            {
              signalBranchCoverage(fID, 33) //B16E6: 16
              return "Tsardom"; // Ruthenian
            }
          signalBranchCoverage(fID, 34) //B16T17: 17
          if (base === 16 && (form === "Empire" || form === "Kingdom"))
            {
              signalBranchCoverage(fID, 35) //B17E7: 18
              return "Khaganate"; // Turkic
            }
          signalBranchCoverage(fID, 36) //B17T18: 19
          if (base === 12 && (form === "Kingdom" || form === "Grand Duchy"))
            {
              signalBranchCoverage(fID, 37) //B18E8: 20
              return "Shogunate"; // Japanese
            }
          signalBranchCoverage(fID, 38) //B18T19: 21
          if ([18, 17].includes(base) && form === "Empire") {
            signalBranchCoverage(fID, 39) //B19E9: 22
            return "Caliphate"; // Arabic, Berber
          }
          signalBranchCoverage(fID, 40) //B19T20: 23
          if (base === 18 && (form === "Grand Duchy" || form === "Duchy"))
            {
              signalBranchCoverage(fID, 41) //B20E10: 24
              return "Emirate"; // Arabic
            }
          signalBranchCoverage(fID, 42) //B20T21: 25
          if (base === 7 && (form === "Grand Duchy" || form === "Duchy"))
            {
              signalBranchCoverage(fID, 43) //B21E11: 26
              return "Despotate"; // Greek
            }
          signalBranchCoverage(fID, 44) //B21T22: 27
          if (base === 31 && (form === "Grand Duchy" || form === "Duchy"))
            {
              signalBranchCoverage(fID, 45) //B22E12: 28
              return "Ulus"; // Mongolian
            }
          signalBranchCoverage(fID, 46) //B22T23: 29
          if (base === 16 && (form === "Grand Duchy" || form === "Duchy"))
            {
              signalBranchCoverage(fID, 47) //B23E13: 30
              return "Horde"; // Turkic
            }
          signalBranchCoverage(fID, 48) //B23T24: 31
          if (base === 24 && (form === "Grand Duchy" || form === "Duchy"))
            {
              signalBranchCoverage(fID, 49) //B24E14: 32
              return "Satrapy"; // Iranian
            }
          signalBranchCoverage(fID, 50) //B24E15: 33
          return form;
        }
        signalBranchCoverage(fID, 51) //B2T26: 34
        if (s.form === "Republic") {
          signalBranchCoverage(fID, 52) //B26T27: 35
          // Default name is from weighted array, special case for small states with only 1 burg
          if (tier < 2 && s.burgs === 1) {
            signalBranchCoverage(fID, 53) //B27T28: 36
            if (
              trimVowels(s.name) === trimVowels(pack.burgs[s.capital].name!)
            ) {
              signalBranchCoverage(fID, 54) //B28T29: 37
              s.name = pack.burgs[s.capital].name;
              signalBranchCoverage(fID, 55) //B29E16: 38
              return "Free City";
            }
            signalBranchCoverage(fID, 56) //B28T30: 39
            if (P(0.3)) {
              signalBranchCoverage(fID, 57) //B30E17: 40
              return "City-state";
            }
            signalBranchCoverage(fID, 58) //B30E18: 41
          }
          signalBranchCoverage(fID, 59) //B27E18: 42
          return rw(republic);
        }
        signalBranchCoverage(fID, 60) //B26T31: 43
        if (s.form === "Union") {
          signalBranchCoverage(fID, 61) //B31E19: 44
          return rw(union);
        }
        signalBranchCoverage(fID, 62) //B31T32: 45
        if (s.form === "Anarchy") {
          signalBranchCoverage(fID, 63) //B32E20: 46
          return rw(anarchy);
        }
        signalBranchCoverage(fID, 64) //B32T33: 47
        if (s.form === "Theocracy") {
          signalBranchCoverage(fID, 65) //B33T34: 48
          // European
          if ([0, 1, 2, 3, 4, 6, 8, 9, 13, 15, 20].includes(base)) {
            signalBranchCoverage(fID, 66) //B34T35: 49
            if (P(0.1)) {
              signalBranchCoverage(fID, 67) //B35E21: 50
              return `Divine ${monarchy[tier]}`;
            }
            signalBranchCoverage(fID, 68) //B35T36: 51
            if (tier < 2 && P(0.5)) {
              signalBranchCoverage(fID, 69) //B36E22: 52
              return "Diocese";
            }
            signalBranchCoverage(fID, 70) //B36T37: 53
            if (tier < 2 && P(0.5)) {
              signalBranchCoverage(fID, 71) //B37E23: 54
              return "Bishopric";
            }
          }
          signalBranchCoverage(fID, 72) //B34T38: 55
          if (P(0.9) && [7, 5].includes(base)) {
            // Greek, Ruthenian
            signalBranchCoverage(fID, 73) //B38T39: 56
            if (tier < 2) {
              signalBranchCoverage(fID, 74) //B39E24: 57
              return "Eparchy";
            }
            signalBranchCoverage(fID, 75) //B39T40: 58
            if (tier === 2) {
              signalBranchCoverage(fID, 76) //B40E25: 59
              return "Exarchate";
            }
            signalBranchCoverage(fID, 77) //B40T41: 60
            if (tier > 2) {
              signalBranchCoverage(fID, 78) //B41E26: 61
              return "Patriarchate";
            }
          }
          signalBranchCoverage(fID, 79) //B38T42: 62
          if (P(0.9) && [21, 16].includes(base)) {
            signalBranchCoverage(fID, 80) //B42E27: 63
            return "Imamah"; // Nigerian, Turkish
          }
          signalBranchCoverage(fID, 81) //B42T43: 64
          if (tier > 2 && P(0.8) && [18, 17, 28].includes(base)){
            signalBranchCoverage(fID, 82) //B43E28: 65
            return "Caliphate"; // Arabic, Berber, Swahili
          }
          signalBranchCoverage(fID, 83) //B43T29: 66
          return rw(theocracy);
        }
        signalBranchCoverage(fID, 84) //B33E30: 67
      };

      s.formName = selectForm(s, tier);
      s.fullName = this.getFullName(s);
      signalBranchCoverage(fID, 85) //B79T60: 85
    }
    signalBranchCoverage(fID, 86) //B60T82: 86
    TIME && console.timeEnd("defineStateForms");
    signalBranchCoverage(fID, 87) //B83E2: 87
  }

  getFullName(state: State) {
    // state forms requiring Adjective + Name, all other forms use scheme Form + Of + Name
    const adjForms = [
      "Empire",
      "Sultanate",
      "Khaganate",
      "Shogunate",
      "Caliphate",
      "Despotate",
      "Theocracy",
      "Oligarchy",
      "Union",
      "Confederation",
      "Trade Company",
      "League",
      "Tetrarchy",
      "Triumvirate",
      "Diarchy",
      "Horde",
      "Marches",
    ];
    if (!state.formName) return state.name;
    if (!state.name && state.formName) return `The ${state.formName}`;
    const adjName =
      adjForms.includes(state.formName) && !/-| /.test(state.name);
    return adjName
      ? `${getAdjective(state.name)} ${state.formName}`
      : `${state.formName} of ${state.name}`;
  }
}

window.States = new StatesModule();
