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
} from "../../dist-deno/src/mod.ts";
import { IFlagshipLogManager } from "../../dist-deno/src/utils/FlagshipLogManager.ts";
import { API_KEY, ENV_ID } from "./config.js";

const statusChangedCallback = (status: FlagshipStatus) => {
  console.log("status", FlagshipStatus[status]);
};

let Infos = "";
let Errors = "";

class CustomLogAdapter implements IFlagshipLogManager {
  emergency(message: string, tag: string): void {
    throw new Error("Method not implemented.");
  }

  alert(message: string, tag: string): void {
    throw new Error("Method not implemented.");
  }

  critical(message: string, tag: string): void {
    throw new Error("Method not implemented.");
  }

  error(message: string, tag: string): void {
    Errors += message;
  }

  warning(message: string, tag: string): void {
    throw new Error("Method not implemented.");
  }

  notice(message: string, tag: string): void {
    throw new Error("Method not implemented.");
  }

  info(message: string, tag: string): void {
    Infos += message;
  }

  debug(message: string, tag: string): void {
    this.log(LogLevel.DEBUG, message, tag);
  }

  log(level: any, message: string, tag: string): void {
    throw new Error("Method not implemented.");
  }
}

Flagship.start(ENV_ID, API_KEY, {
  decisionMode: DecisionMode.BUCKETING,
  statusChangedCallback,
  logLevel: LogLevel.ALL,
  fetchNow: false,
  logManager: new CustomLogAdapter(),
});

console.log("info:", Infos);
console.log("errors:", Errors);

const visitor = Flagship.newVisitor("visitor_id", { key: "value" });

(async () => {
  if (visitor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // optional when fetchNow = true, this method is call on each newVisitor
    await visitor.synchronizeModifications();

    // getModification
    visitor
      .getModification({ key: "IsVIP", defaultValue: false })
      .then((modification) => {
        console.log("modification:", modification);
      });

    visitor
      .getModification([
        { key: "IsVIP", defaultValue: [] },
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
    visitor.activateModification("IsVIP");

    visitor.activateModification(["array", ""]);

    // getModificationInfo
    visitor.getModificationInfo("IsVIP").then((data: Modification | null) => {
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
})();
