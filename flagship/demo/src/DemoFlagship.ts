import { DecisionApiConfig } from "../../src/config/DecisionApiConfig.ts";
import { Flagship } from "../../src/main/Flagship.ts";
import { API_KEY, ENV_ID } from "./env.ts";
import {
  EventCategory,
  Item,
  Event,
  Page,
  Screen,
  Transaction,
} from "../../src/hit/index.ts";

Flagship.start(ENV_ID, API_KEY, new DecisionApiConfig());

(async () => {
  let count = 0;
  while (true) {
    const visitor = Flagship.newVisitor(`visitor_${count}`);

    if (visitor) {
      await visitor.synchronizeModifications();
      console.log(visitor.getModification("object", {}));
      visitor.activateModification("object");

      const event = new Event(EventCategory.ACTION_TRACKING, "click");
      visitor.sendHit(event);
      const item = new Item("transaction_1", "product_name", "00255578");
      visitor.sendHit(item);
      const page = new Page("home");
      visitor.sendHit(page);
      const screen = new Screen("home");
      visitor.sendHit(screen);
      const transaction = new Transaction(
        `transaction${count.toString().substr(0, 1)}`,
        "affiliation"
      );
      visitor.sendHit(transaction);
      console.log(count++);
    }
  }
})();
