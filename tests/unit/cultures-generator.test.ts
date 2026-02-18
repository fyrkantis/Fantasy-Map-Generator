import { describe, expect, it } from "vitest";
import "../../src/modules/cultures-generator";
import { PackedGraphFeature } from "../../src/modules/features";
import { Culture } from "../../src/modules/cultures-generator";

const lakeFeature: PackedGraphFeature = {
  i: 0,
  type: 'lake',
  land: false,
  border: false,
  cells: 0,
  firstCell: 0,
  vertices: [],
  area: 0,
  shoreline: [],
  height: 0,
  group: "",
  temp: 0,
  flux: 0,
  evaporation: 0,
  name: "testLake"
}
pack.features = [lakeFeature];
pack.cells.f[0] = lakeFeature.i;


pack.cultures = [];

