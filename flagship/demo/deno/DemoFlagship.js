import {
  DecisionApiConfig,
  Event,
  EventCategory,
  Flagship,
  FlagshipStatus,
  Item,
  LogLevel,
  Page,
  Screen,
  Transaction,
} from "../../dist-deno/src/mod.ts";
//import { API_KEY, ENV_ID } from "./config.js";

const config = new DecisionApiConfig();
config.logLevel = LogLevel.ERROR;
config.setStatusChangedCallback((status) => {
  console.log("status", FlagshipStatus[status]);
});

Flagship.start("c0n48jn5thv01k0ijmo0", "BsIK86oh7c12c9G7ce4Wm1yBlWeaMf3t1S0xyYzI", config);

const visitor = Flagship.newVisitor(`toto`, { });

(async () => {
  if (visitor) {
    await visitor.synchronizeModifications();
    console.log(visitor)
    console.log(visitor.getModification("IsVIP", false));
    visitor.activateModification("IsVIP");

    visitor.getModificationInfoAsync("IsVIP").then((r) => {
      console.log("r", r);
    });

    const event = new Event(EventCategory.ACTION_TRACKING, "click");
    visitor.sendHit(event);

    const item = new Item("transaction_1", "product_name", "00255578");
    visitor.sendHit(item);

    const page = new Page("home");
    visitor.sendHit(page);

    const screen = new Screen("home");
    visitor.sendHit(screen);

    const transaction = new Transaction(`transaction_1`, "affiliation");
    visitor.sendHit(transaction);
  }
})();
