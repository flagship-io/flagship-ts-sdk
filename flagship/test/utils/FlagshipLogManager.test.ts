import { assertEquals, stub } from "../../deps.ts";
import { FLAGSHIP_SDK, LogLevel } from "../../src/enum/index.ts";
import { FlagshipLogManager } from "../../src/utils/FlagshipLogManager.ts";

// deno-lint-ignore no-explicit-any
const getTwoDigit = (value: any) => {
  return value.toString().length === 1 ? `0${value}` : value;
};
const getOut = (level: LogLevel, message: string, tag: string) => {
  const now = new Date();
  return `[${getTwoDigit(now.getFullYear())}-${getTwoDigit(
    now.getMonth()
  )}-${getTwoDigit(now.getDay())} ${getTwoDigit(now.getHours())}:${getTwoDigit(
    now.getMinutes()
  )}] [${FLAGSHIP_SDK}] [${LogLevel[level]}] [${tag}] : ${message}`;
};
Deno.test("test FlagshipLogManager", () => {
  const logError = stub(console, "log");
  const logManager = new FlagshipLogManager();
  const message = "this is a log message";
  const tag = "tag";

  //test alert
  logManager.alert(message, tag);

  //test critical
  logManager.critical(message, tag);

  //test debug
  logManager.debug(message, tag);

  //test emergency
  logManager.emergency(message, tag);

  //test error
  logManager.error(message, tag);

  //test info
  logManager.info(message, tag);

  //test info
  logManager.notice(message, tag);

  //test info
  logManager.warning(message, tag);

  const alertArgs = (level: LogLevel) => ({
    args: [getOut(level, message, tag)],
    self: console,
  });

  assertEquals(logError.calls, [
    alertArgs(LogLevel.ALERT),
    alertArgs(LogLevel.CRITICAL),
    alertArgs(LogLevel.DEBUG),
    alertArgs(LogLevel.EMERGENCY),
    alertArgs(LogLevel.ERROR),
    alertArgs(LogLevel.INFO),
    alertArgs(LogLevel.NOTICE),
    alertArgs(LogLevel.WARNING),
  ]);
});
