import {
  DecisionApiConfig,
  Flagship,
  EventCategory,
  Item,
  Event,
  Page,
  Screen,
  Transaction,
  FlagshipStatus,
  LogLevel,
} from "../../mod.ts";
import { API_KEY, ENV_ID } from "./env.ts";

const config = new DecisionApiConfig();
config.logLevel = LogLevel.ERROR;
config.statusChangedCallback = (status) => {
  console.log("status", FlagshipStatus[status]);
};

Flagship.start(ENV_ID, API_KEY, config);

const visitor = Flagship.newVisitor(`visitor_1`);

if (visitor) {
  await visitor.synchronizeModifications();
  console.log(visitor.getModification("objec", {}));
  visitor.activateModification("object");

  console.log(visitor.getModificationInfo("object"));

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
