import { DecisionApiConfig } from "../../src/config/DecisionApiConfig.ts";
import { Flagship } from "../../src/main/Flagship.ts";
import { Event, EventCategory } from "../../src/hit/Event.ts";

Flagship.start(
  "c0n48jn5thv01k0ijmo0",
  "BsIK86oh7c12c9G7ce4Wm1yBlWeaMf3t1S0xyYzI",
  new DecisionApiConfig()
);

(async () => {
  const context = new Map<string, string | boolean | number>();
  context.set("age", 25);

  const visitor = Flagship.newVisitor("toto");

  if (visitor) {
    await visitor.synchronizeModifications();
    console.log(visitor.getModification("IsVIP", false));
    visitor.activateModification("IsVIP");
    const event = new Event(EventCategory.ACTION_TRACKING, "click");
    visitor.sendHit(event);
  }
})();
