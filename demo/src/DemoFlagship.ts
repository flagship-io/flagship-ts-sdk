import { Flagship } from "../../flagship/src/Main/Flagship.ts";
import { Visitor } from "../../flagship/src/Main/Visitor.ts";
import { Mode } from "../../flagship/src/Enum/FlagshipMode.ts";
import { FlagshipConfig } from "../../flagship/src/Main/FlagshipConfig.ts";

Flagship.start(
  "c0n48jn5thv01k0ijmo0",
  "BsIK86oh7c12c9G7ce4Wm1yBlWeaMf3t1S0xyYzI",
  new FlagshipConfig().withFlagshipMode(Mode.DECISION_API)
);

let visitor: Visitor = Flagship.newVisitor("toto", new Map<string, Object>());

console.log(visitor);

visitor.synchronizeModifications();
console.log(visitor);
