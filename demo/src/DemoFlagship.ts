import { Flagship } from "../../flagship/src/Main/Flagship";
import { Mode } from "../../flagship/src/Enum/FlagshipMode";
import { FlagshipConfig } from "../../flagship/src/Main/FlagshipConfig";

const flagship = Flagship.start(
  "c0n48jn5thv01k0ijmo0",
  "BsIK86oh7c12c9G7ce4Wm1yBlWeaMf3t1S0xyYzI",
  new FlagshipConfig().withFlagshipMode(Mode.DECISION_API)
);

console.log(flagship);
