import { FSFetchStatus } from '../enum/FSFetchStatus'
import { FSFlagStatus } from '../enum/FSFlagStatus'
import { IFlagMetadata } from '../types'
import { VisitorDelegate } from '../visitor/index'
import { IFlag } from './IFlag'

export class Flag implements IFlag {
  private _visitor:VisitorDelegate
  private _key:string
  private _defaultValue?:unknown
  private hasGetValueBeenCalled = false

  constructor (param: {key:string, visitor:VisitorDelegate}) {
    const { key, visitor } = param
    this._key = key
    this._visitor = visitor
  }

  exists ():boolean {
    const flagDTO = this._visitor.flagsData.get(this._key)
    return !!(flagDTO?.campaignId && flagDTO?.variationId && flagDTO?.variationGroupId)
  }

  get metadata ():IFlagMetadata {
    const flagDTO = this._visitor.flagsData.get(this._key)

    return this._visitor.getFlagMetadata({
      key: this._key,
      flag: flagDTO
    })
  }

  visitorExposed () : Promise<void> {
    const flagDTO = this._visitor.flagsData.get(this._key)
    return this._visitor.visitorExposed({
      key: this._key,
      flag: flagDTO,
      defaultValue: this._defaultValue,
      hasGetValueBeenCalled: this.hasGetValueBeenCalled
    })
  }

  getValue <T> (defaultValue:T, visitorExposed = true) : T extends null ? unknown : T {
    this._defaultValue = defaultValue
    this.hasGetValueBeenCalled = true

    const flagDTO = this._visitor.flagsData.get(this._key)
    return this._visitor.getFlagValue({
      key: this._key,
      defaultValue,
      flag: flagDTO,
      visitorExposed
    })
  }

  get status (): FSFlagStatus {
    if (this._visitor?.fetchStatus?.status === FSFetchStatus.PANIC) {
      return FSFlagStatus.PANIC
    }
    if (!this.exists()) {
      return FSFlagStatus.NOT_FOUND
    }
    if (this._visitor?.fetchStatus?.status === FSFetchStatus.FETCH_REQUIRED || this._visitor?.fetchStatus?.status === FSFetchStatus.FETCHING) {
      return FSFlagStatus.FETCH_REQUIRED
    }

    return FSFlagStatus.FETCHED
  }
}
