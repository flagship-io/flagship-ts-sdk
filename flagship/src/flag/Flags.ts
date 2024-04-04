import { FSFetchStatus } from '../enum/FSFetchStatus'
import { FSFlagStatus } from '../enum/FSFlagStatus'
import { FLAG_METADATA, NO_FLAG_METADATA } from '../enum/index'
import { IFlagMetadata } from '../types'
import { hasSameType, logDebugSprintf } from '../utils/utils'
import { VisitorDelegate } from '../visitor/index'
import { FlagMetadata } from './FlagMetadata'

/**
 * This class represents a flag in the `Flagship SDK`. It helps you retrieve the flag value, access flag metadata,
 * expose the flag, verify the flag's existence, and get the flag status
 * @template T The type of the flag value.
 */
export interface IFlag<T> {
  /**
   * Returns the value of the flag.
   * If the flag exists and the type of the default value matches the flag type value.
   * It can expose the flag if needed.
   * @param visitorExposed Specifies whether to report the flag exposure. Default is true.
   * @returns The value of the flag.
   */
  getValue(visitorExposed?: boolean): T;

  /**
   * Checks if the flag exists.
   * @returns True if the flag exists, false otherwise.
   */
  exists: () => boolean;

  /**
   * Notifies Flagship that the visitor has been exposed to and seen this flag.
   * @returns A promise that resolves when the notification is complete.
   */
  visitorExposed: () => Promise<void>;

  /**
   * Returns the metadata of the flag.
   */
  readonly metadata: IFlagMetadata;

  /**
   * Returns the status of the flag.
   */
  readonly status: FSFlagStatus;
}

export class Flag<T> implements IFlag<T> {
  private _visitor:VisitorDelegate
  private _key:string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _defaultValue:any
  constructor (param: {key:string, visitor:VisitorDelegate, defaultValue:T}) {
    const { key, visitor, defaultValue } = param
    this._key = key
    this._visitor = visitor
    this._defaultValue = defaultValue
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

  getValue (userExposed = true) : T {
    const flagDTO = this._visitor.flagsData.get(this._key)
    return this._visitor.getFlagValue({
      key: this._key,
      defaultValue: this._defaultValue,
      flag: flagDTO,
      userExposed
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
