import { DecisionMode, FlagshipConfig, IFlagshipConfig } from './FlagshipConfig'

export class SelfHostedConfig extends FlagshipConfig {
  public constructor (param?: Omit<IFlagshipConfig, 'decisionMode'>) {
    super({ ...param, decisionMode: DecisionMode.SELF_HOSTED })
    this.selfHostedUrl = param?.selfHostedUrl
    this._campaignsUrl = `${this.selfHostedUrl}campaigns`
    this._activateUrl = `${this.selfHostedUrl}activate`
    this._collectUrl = `${this.selfHostedUrl}events`
  }
}
