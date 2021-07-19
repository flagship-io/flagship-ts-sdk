"use strict";

var _index = require("../../dist/index.node");

var _config = require("./config.js");

const config = new _index.DecisionApiConfig();
config.logLevel = _index.LogLevel.ERROR;
config.setStatusChangedCallback(status => {
    console.log("status", _index.FlagshipStatus[status]);
});

_index.Flagship.start(_config.ENV_ID, _config.API_KEY, config);

const visitor = _index.Flagship.newVisitor(`visitor_1`, { age: 20 });

(async () => {
    if (visitor) {
        await visitor.synchronizeModifications();
        console.log(visitor.getModification("object", {}));
        visitor.activateModification("object");

        visitor.getModificationInfoAsync("array").then(r => {
            console.log("r", r);
        });

        const event = new _index.Event(_index.EventCategory.ACTION_TRACKING, "click");
        visitor.sendHit(event);

        const item = new _index.Item("transaction_1", "product_name", "00255578");
        visitor.sendHit(item);

        const page = new _index.Page("home");
        visitor.sendHit(page);

        const screen = new _index.Screen("home");
        visitor.sendHit(screen);

        const transaction = new _index.Transaction(`transaction_1`, "affiliation");
        visitor.sendHit(transaction);
    }
})();