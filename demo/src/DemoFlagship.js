"use strict";
exports.__esModule = true;
var Flagship_1 = require("../../flagship/src/Main/Flagship");
var FlagshipMode_1 = require("../../flagship/src/Enum/FlagshipMode");
var FlagshipConfig_1 = require("../../flagship/src/Main/FlagshipConfig");
var flagship = Flagship_1.Flagship.start(
  "c0n48jn5thv01k0ijmo0",
  "BsIK86oh7c12c9G7ce4Wm1yBlWeaMf3t1S0xyYzI",
  new FlagshipConfig_1.FlagshipConfig().withFlagshipMode(
    FlagshipMode_1.Mode.DECISION_API
  )
);
console.log(flagship + "2");
