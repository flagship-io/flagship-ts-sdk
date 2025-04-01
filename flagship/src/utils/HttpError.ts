export class HttpError extends Error {
  private _statusCode : number;
  private _headers? : Record<string, unknown>;

  public get headers() : Record<string, unknown>|undefined {
    return this._headers;
  }

  public get statusCode() : number {
    return this._statusCode;
  }

  public constructor(statusCode: number, message: string, headers?: Record<string, unknown>) {
    super(message);
    this._statusCode = statusCode;
    this._headers = headers;
  }
}
