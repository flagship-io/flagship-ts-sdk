import { FSFetchStatus } from '../enum/FSFetchStatus'
import { FSFlagStatus } from '../enum/FSFlagStatus'
import { IFSFlagMetadata } from '../types'
import { VisitorDelegate } from '../visitor/index'
import { FSFlagMetadata } from './FSFlagMetadata'
import { IFSFlag } from './IFSFlag'
import { forceVariation } from './forceVariation'

export class FSFlag implements IFSFlag {
  private _visitor?:VisitorDelegate
  private _key:string
  private _defaultValue?:unknown
  private hasGetValueBeenCalled = false

  constructor (param: {key:string, visitor?:VisitorDelegate}) {
    const { key, visitor } = param
    this._key = key
    this._visitor = visitor
  }

  exists ():boolean {
    if (!this._visitor) {
      return false
    }
    const flagDTO = this._visitor?.flagsData.get(this._key)
    const forcedFlagDTO = forceVariation({ flagDTO, config: this._visitor.config })

    const flag = forcedFlagDTO || flagDTO

    const flagExists = !!(flag?.campaignId && flag?.variationId && flag?.variationGroupId)

    this._visitor.sendDiagnosticHitFlagExists(this._defaultValue, flagExists, flag)

    return flagExists
  }

  get metadata ():IFSFlagMetadata {
    if (!this._visitor) {
      return FSFlagMetadata.Empty()
    }

    const flagDTO = this._visitor.flagsData.get(this._key)
    const forcedFlagDTO = forceVariation({ flagDTO, config: this._visitor.config })

    return this._visitor.getFlagMetadata({
      key: this._key,
      flag: forcedFlagDTO || flagDTO
    })
  }

  async visitorExposed () : Promise<void> {
    if (!this._visitor) {
      return
    }

    const flagDTO = this._visitor.flagsData.get(this._key)
    const forcedFlagDTO = forceVariation({ flagDTO, config: this._visitor.config })

    return this._visitor.visitorExposed({
      key: this._key,
      flag: forcedFlagDTO || flagDTO,
      defaultValue: this._defaultValue,
      hasGetValueBeenCalled: this.hasGetValueBeenCalled
    })
  }

  getValue <T> (defaultValue:T, visitorExposed = true) : T extends null ? unknown : T {
    this._defaultValue = defaultValue
    this.hasGetValueBeenCalled = true

    if (!this._visitor) {
      return defaultValue as T extends null ? unknown : T
    }

    const flagDTO = this._visitor.flagsData.get(this._key)
    const forcedFlagDTO = forceVariation({ flagDTO, config: this._visitor.config })

    const flag = forcedFlagDTO || flagDTO

    this._visitor.sendExposedVariation(flag)

    return this._visitor.getFlagValue({
      key: this._key,
      defaultValue,
      flag,
      visitorExposed
    })
  }

  get status (): FSFlagStatus {
    const flagDTO = this._visitor?.flagsData?.get(this._key)
    if (this._visitor?.fetchStatus?.status === FSFetchStatus.PANIC) {
      this._visitor?.sendDiagnosticHitFlagStatus(this._defaultValue, FSFlagStatus.PANIC, flagDTO)
      return FSFlagStatus.PANIC
    }
    if (!this.exists()) {
      this._visitor?.sendDiagnosticHitFlagStatus(this._defaultValue, FSFlagStatus.NOT_FOUND, flagDTO)
      return FSFlagStatus.NOT_FOUND
    }
    if (this._visitor?.fetchStatus?.status === FSFetchStatus.FETCH_REQUIRED || this._visitor?.fetchStatus?.status === FSFetchStatus.FETCHING) {
      this._visitor?.sendDiagnosticHitFlagStatus(this._defaultValue, FSFlagStatus.FETCH_REQUIRED, flagDTO)
      return FSFlagStatus.FETCH_REQUIRED
    }

    this._visitor?.sendDiagnosticHitFlagStatus(this._defaultValue, FSFlagStatus.FETCHED, flagDTO)
    return FSFlagStatus.FETCHED
  }
}
