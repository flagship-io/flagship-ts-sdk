import { DL_API_ITEM } from "../enum/FlagshipConstant";
import { HitType } from "../enum/HitType";
import { HitAbstract } from "./HitAbstract";

export const ERROR_MESSAGE = "Screen name is required";

export class Screen extends HitAbstract {
  private _screenName!: string;
  public get screenName(): string {
    return this._screenName;
  }
  public set screenName(v: string) {
    if (!this.isNotEmptyString(v, "screenName")) {
      return;
    }
    this._screenName = v;
  }

  public constructor(screenName: string) {
    super(HitType.SCREEN_VIEW);
    this.screenName = screenName;
  }

  public isReady() {
    return !!(super.isReady() && this.screenName);
  }

  public toApiKeys() {
    const apiKeys = super.toApiKeys();
    apiKeys[DL_API_ITEM] = this.screenName;
    return apiKeys;
  }

  public getErrorMessage(): string {
    return ERROR_MESSAGE;
  }
}
