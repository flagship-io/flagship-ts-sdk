import { IFlagshipLogManager, LogLevel, OakSession } from "../deps.ts";

export class CustomLogAdapter implements IFlagshipLogManager {
  private _session: OakSession;
  private _log: string;
  public constructor(session: OakSession) {
    this._session = session;
    this._log = "";
  }
  emergency(_message: string, _tag: string): void {
    throw new Error("Method not implemented.");
  }

  alert(_message: string, _tag: string): void {
    throw new Error("Method not implemented.");
  }

  critical(_message: string, _tag: string): void {
    throw new Error("Method not implemented.");
  }

  error(message: string, tag: string): void {
    this.log(LogLevel.ERROR, message, tag);
  }

  warning(_message: string, _tag: string): void {
    throw new Error("Method not implemented.");
  }

  notice(_message: string, _tag: string): void {
    throw new Error("Method not implemented.");
  }

  info(message: string, tag: string): void {
    this.log(LogLevel.INFO, message, tag);
  }

  debug(message: string, tag: string): void {
    this.log(LogLevel.DEBUG, message, tag);
  }

  log(level: LogLevel, message: string, tag: string): void {
    this._log += `[${LogLevel[level]}] [${tag}] : ${message} \n`;
    this._session.set("logs", this._log);
  }
}
