const ENV_ID = "";
const API_KEY = "";

const printMessage = (scenario, action) => {
  console.log(
    `########### SCENARIO ${scenario} ACTION ${action} ##############`
  );
};

const btnAction1 = document.getElementById("scenario-1action-1");
// scenario 1 action 1
btnAction1.addEventListener("click", async () => {
  printMessage(1, 1);

  Flagship.start(ENV_ID, API_KEY, {
    fetchNow: false,
    timeout: 10,
    activateDeduplicationTime: 2.5,
    hitDeduplicationTime: 2.5,
  });

  const visitor = Flagship.newVisitor({
    visitorId: "visitor-A",
    context: {},
  });

  await visitor.fetchFlags();

  const flag = visitor.getFlag("js-qa-app", "default");

  console.log("flag:", flag.getValue()); // will be sent
  console.log("flag:", flag.getValue()); // will be deduplicated

  flag.userExposed(); // will be deduplicated

  // 1 activate must be sent

  await visitor.sendHit({
    type: "SCREENVIEW",
    documentLocation: "screen 1",
  });

  await visitor.sendHit({
    type: "SCREENVIEW",
    documentLocation: "screen 1",
  });
  await visitor.sendHit({
    type: "SCREENVIEW",
    documentLocation: "screen 2",
  });

  // 2 hits ariane must be sent
});

const btnAction2 = document.getElementById("scenario-1action-2");
// scenario 1 action 1
btnAction2.addEventListener("click", async () => {
  printMessage(1, 1);

  Flagship.start(ENV_ID, API_KEY, {
    fetchNow: false,
    timeout: 10,
    activateDeduplicationTime: 2.5,
    hitDeduplicationTime: 2.5,
  });

  const visitor = Flagship.newVisitor({
    visitorId: "visitor-A",
    context: {},
  });

  await visitor.fetchFlags();

  const flag = visitor.getFlag("js", "default");

  console.log("flag:", flag.getValue()); // will be sent
  console.log("flag:", flag.getValue()); // will be deduplicated

  console.log("flag:", flag.getValue()); // will be sent

  await flag.userExposed(); // will be deduplicated
  await flag.userExposed(); // will be sent

  // 3 activate must be sent

  await visitor.sendHit({
    type: "SCREENVIEW",
    documentLocation: "screen 1",
  });
  await visitor.sendHit({
    type: "SCREENVIEW",
    documentLocation: "screen 1",
  });

  await visitor.sendHit(
    {
      type: "SCREENVIEW",
      documentLocation: "screen 1",
    },
    false
  );

  await visitor.sendHit({
    type: "SCREENVIEW",
    documentLocation: "screen 2",
  });

  // 3 hits ariane must be sent
});

const btnAction3 = document.getElementById("scenario-1action-3");
// scenario 1 action 1
btnAction3.addEventListener("click", async () => {
  printMessage(1, 2);

  Flagship.start(ENV_ID, API_KEY, {
    fetchNow: false,
    timeout: 10,
    activateDeduplicationTime: 0, //will disable deduplication of activate
    hitDeduplicationTime: 0, //will disable deduplication of hit ariane
  });

  const visitor = Flagship.newVisitor({
    visitorId: "visitor-A",
    context: {},
  });

  await visitor.fetchFlags();

  const flag = visitor.getFlag("js-qa-app", "default");

  console.log("flag:", flag.getValue());
  console.log("flag:", flag.getValue());

  flag.userExposed();

  // 3 activate must be sent

  await visitor.sendHit({
    type: "SCREENVIEW",
    documentLocation: "screen 1",
  });
  await visitor.sendHit({
    type: "SCREENVIEW",
    documentLocation: "screen 1",
  });
  await visitor.sendHit({
    type: "SCREENVIEW",
    documentLocation: "screen 2",
  });

  // 3 hits ariane must be sent
});
