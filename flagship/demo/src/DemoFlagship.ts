import { Flagship } from "../../src/Main/Flagship.ts";
import { Visitor } from "../../src/Main/Visitor.ts";
import { Mode } from "../../src/Enum/FlagshipMode.ts";
import { FlagshipConfig } from "../../src/Main/FlagshipConfig.ts";

Flagship.start(
  "c0n48jn5thv01k0ijmo0",
  "BsIK86oh7c12c9G7ce4Wm1yBlWeaMf3t1S0xyYzI",
  new FlagshipConfig().withFlagshipMode(Mode.DECISION_API)
);

(async () => {
  const visitor: Visitor = Flagship.newVisitor(
    "toto",
    new Map<string, unknown>()
  );

  await visitor.synchronizeModifications();

  console.log(visitor);
})();
