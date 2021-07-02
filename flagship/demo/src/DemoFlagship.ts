import { DecisionApiConfig } from "../../src/config/DecisionApiConfig.ts";
import { Flagship } from "../../src/main/Flagship.ts";
import { Event, EventCategory } from "../../src/hit/Event.ts";
import { API_KEY, ENV_ID } from "./env.ts";

Flagship.start(ENV_ID, API_KEY, new DecisionApiConfig());

(async () => {
  const context = new Map<string, string | boolean | number>();
  context.set("age", 25);

  const visitor = Flagship.newVisitor("toto", context);

  if (visitor) {
    await visitor.synchronizeModifications();
    console.log(visitor.getModification("IsVIP", true));
    visitor.activateModification("IsVIP");
    const event = new Event(EventCategory.ACTION_TRACKING, "click");
    visitor.sendHit(event);
  }
})();
