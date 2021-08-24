import { IFlagshipLogManager, LogLevel, OakSession } from "../deps.ts";

let Infos = "";
let Errors = "";
let allInfo = "";

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

  error(message: string, _tag: string): void {
    this._log += `[error] [${_tag}] : ${message} \n`;
  }

  warning(_message: string, _tag: string): void {
    throw new Error("Method not implemented.");
  }

  notice(_message: string, _tag: string): void {
    throw new Error("Method not implemented.");
  }

  info(message: string, _tag: string): void {
    Infos += message + "\n";
  }

  debug(message: string, tag: string): void {
    this._log += `[debug] [${tag}] : ${message} \n`;
  }

  log(level: LogLevel, message: string, tag: string): void {
    this._log += `[${LogLevel[level]}] [${tag}] : ${message} \n`;
  }
}
