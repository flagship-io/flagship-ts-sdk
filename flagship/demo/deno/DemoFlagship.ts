import {
  DecisionMode,
  EventCategory,
  Flagship,
  FlagshipStatus,
  HitType,
  Item,
  LogLevel,
  Transaction,
  Modification,
  DEVICE_LOCALE,
} from "../../dist-deno/src/mod.ts";
import { API_KEY, ENV_ID } from "./config.js";

const statusChangedCallback = (status: FlagshipStatus) => {
  console.log("status", FlagshipStatus[status]);
};

function sleep(ms: number): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Flagship.start(ENV_ID, API_KEY, {
  decisionMode: DecisionMode.BUCKETING,
  statusChangedCallback,
  logLevel: LogLevel.ALL,
  fetchNow: false,
});

const visitor = Flagship.newVisitor({
  visitorId: "visitor_id",
  isAuthenticated: true,
  context: {
    key: "value",
    [DEVICE_LOCALE]: "fr",
  },
});

(async () => {
  if (visitor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // deno-lint-ignore no-explicit-any
    visitor.on("ready", (err: any) => {
      if (err) {
        console.log("Flagship error:", err);
        return;
      }
      console.log("Flagship Ready");
    });
    console.log(visitor);
    // clear context
    visitor.clearContext();

    // Update context
    visitor.updateContext({ isOP: true });

    visitor.setConsent(true);

    await sleep(1000);

    await visitor.synchronizeModifications();

    const modification = await visitor.getModification({
      key: "object",
      defaultValue: {},
    });
    console.log("modification:", modification);

    Flagship.start(ENV_ID, API_KEY, {
      decisionMode: DecisionMode.DECISION_API,
      statusChangedCallback,
      logLevel: LogLevel.ALL,
      fetchNow: false,
    });

    for (let index = 0; index < 5; index++) {
      // optional when fetchNow = true, this method is call on each newVisitor
      await visitor.synchronizeModifications();

      // getModification
      visitor
        .getModification({ key: "object", defaultValue: {} })
        .then((modification) => {
          console.log("modification:", modification);
        });

      visitor
        .getModifications([
          { key: "array", defaultValue: [] },
          {
            key: "object",
            defaultValue: {},
            activate: true,
          },
        ])
        .then((modifications) => {
          console.log("modifications:", modifications);
        });

      // activateModification
      visitor.activateModification("object");

      visitor.activateModifications(["array", "object"]);

      // getModificationInfo
      visitor.getModificationInfo("array").then((data: Modification | null) => {
        console.log("info", data);
      });

      // send hit

      // hit type Event
      visitor.sendHit({
        type: HitType.EVENT,
        category: EventCategory.ACTION_TRACKING,
        action: "click",
      });

      // hit type Item
      const item = new Item({
        transactionId: "transaction_1",
        productName: "product_name",
        productSku: "00255578",
      });

      visitor.sendHit(item);

      // hit type Page
      visitor.sendHit({
        type: HitType.PAGE,
        documentLocation: "https://localhost",
      });

      // hit type Screen
      visitor.sendHit({
        type: HitType.SCREEN,
        documentLocation: "https://localhost",
      });

      // hit type Transaction
      const transaction = new Transaction({
        transactionId: "transaction_1",
        affiliation: "affiliation",
      });
      visitor.sendHit(transaction);
    }
  }
})();
