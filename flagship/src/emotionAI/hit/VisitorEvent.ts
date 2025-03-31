import { IVisitorEvent } from './IVisitorEvent';

export class VisitorEvent implements IVisitorEvent {
  _customerAccountId: string;
  _visitorId: string;
  _currentUrl: string;
  _clickPath?: string;
  _clickPosition?: string;
  _screenSize: string;
  _scrollPosition?: string;

  public get customerAccountId(): string {
    return this._customerAccountId;
  }

  public get visitorId(): string {
    return this._visitorId;
  }

  public get currentUrl(): string {
    return this._currentUrl;
  }

  public get clickPath(): string|undefined {
    return this._clickPath;
  }

  public get clickPosition(): string|undefined {
    return this._clickPosition;
  }

  public get screenSize(): string {
    return this._screenSize;
  }

  public get scrollPosition(): string|undefined {
    return this._scrollPosition;
  }

  public constructor({
    customerAccountId,
    visitorId,
    currentUrl,
    clickPath,
    clickPosition,
    screenSize,
    scrollPosition
  }: Omit<IVisitorEvent, 'toApiKeys'>) {
    this._customerAccountId = customerAccountId;
    this._visitorId = visitorId;
    this._currentUrl = currentUrl;
    this._clickPath = clickPath;
    this._clickPosition = clickPosition;
    this._screenSize = screenSize;
    this._scrollPosition = scrollPosition;
  }

  public toApiKeys(): Record<string, string> {
    const apiKeys:Record<string, string> = {
      cid: this._customerAccountId,
      vid: this._visitorId,
      dl: this._currentUrl,
      sr: this._screenSize,
      t: 'VISITOREVENT'
    };
    if (this._clickPath) {
      apiKeys.cp = this._clickPath;
    }
    if (this._clickPosition) {
      apiKeys.cpo = this._clickPosition;
    }
    if (this._scrollPosition) {
      apiKeys.sp = this._scrollPosition;
    }
    return apiKeys;
  }
}
