import { DL_API_ITEM } from "../enum/FlagshipConstant.ts";
import { HitType } from "../enum/HitType.ts";
import { HitAbstract } from "./HitAbstract.ts";

export const ERROR_MESSAGE = "Page url is required";

export class Page extends HitAbstract {
  private _pageUrl!: string;
  public get pageUrl(): string {
    return this._pageUrl;
  }
  public set pageUrl(v: string) {
    if (!this.isNotEmptyString(v, "pageUrl")) {
      return;
    }
    this._pageUrl = v;
  }

  public constructor(pageUrl: string) {
    super(HitType.PAGE_VIEW);
    this.pageUrl = pageUrl;
  }

  public isReady() {
    return !!(super.isReady() && this.pageUrl);
  }

  public toApiKeys() {
    const apiKeys = super.toApiKeys();
    apiKeys[DL_API_ITEM] = this.pageUrl;
    return apiKeys;
  }

  public getErrorMessage(): string {
    return ERROR_MESSAGE;
  }
}
