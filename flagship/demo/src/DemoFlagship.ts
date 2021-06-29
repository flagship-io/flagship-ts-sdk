import { DecisionApiConfig } from "../../src/config/DecisionApiConfig.ts";
import { Flagship } from "../../src/main/Flagship.ts";

Flagship.start(
    "c0n48jn5thv01k0ijmo0",
    "BsIK86oh7c12c9G7ce4Wm1yBlWeaMf3t1S0xyYzI",
    new DecisionApiConfig()
);

(async () => {
const context = new Map<string, string | boolean | number>();
context.set("age",25);

const visitor = Flagship.newVisitor(
    "toto",
    context
);

if (visitor) {
    await visitor.synchronizeModifications();
    console.log(visitor);
}
})()

