import { FSFetchStatus } from '../enum/FSFetchStatus'
import { FSFlagStatus } from '../enum/FSFlagStatus'
import { FLAG_METADATA, NO_FLAG_METADATA } from '../enum/index'
import { IFlagMetadata } from '../types'
import { hasSameType, logDebugSprintf } from '../utils/utils'
import { VisitorDelegate } from '../visitor/index'
import { FlagMetadata } from './FlagMetadata'
import { IFlag } from './IFlag'

export class Flag implements IFlag {
  private _visitor:VisitorDelegate
  private _key:string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _defaultValue?:unknown

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
    const metadata = new FlagMetadata({
      campaignId: flagDTO?.campaignId || '',
      campaignName: flagDTO?.campaignName || '',
      variationGroupId: flagDTO?.variationGroupId || '',
      variationGroupName: flagDTO?.variationGroupName || '',
      variationId: flagDTO?.variationId || '',
      variationName: flagDTO?.variationName || '',
      isReference: !!flagDTO?.isReference,
      campaignType: flagDTO?.campaignType || '',
      slug: flagDTO?.slug
    })

    if (!flagDTO) {
      logDebugSprintf(this._visitor.config, FLAG_METADATA, NO_FLAG_METADATA, this._visitor.visitorId, this._key, metadata)
      return metadata
    }

    return this._visitor.getFlagMetadata({
      metadata,
      hasSameType: flagDTO.value === null || this._defaultValue === null || this._defaultValue === undefined || hasSameType(flagDTO.value, this._defaultValue),
      key: flagDTO.key
    })
  }

  visitorExposed () : Promise<void> {
    const flagDTO = this._visitor.flagsData.get(this._key)
    return this._visitor.visitorExposed({ key: this._key, flag: flagDTO, defaultValue: this._defaultValue })
  }

  getValue <T> (defaultValue:T, visitorExposed = true) : T {
    this._defaultValue = defaultValue

    const flagDTO = this._visitor.flagsData.get(this._key)
    return this._visitor.getFlagValue({
      key: this._key,
      defaultValue,
      flag: flagDTO,
      userExposed: visitorExposed
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
