import { IFSFlagMetadata, SerializedFlagMetadata } from '../types.ts';
import { logWarningSprintf, valueToHex } from '../utils/utils.ts';
import { VisitorDelegate } from '../visitor/VisitorDelegate.ts';
import { FSFlag } from './FsFlags.ts';
import { IFSFlagCollection } from './IFSFlagCollection.ts';
import { IFSFlag } from './IFSFlag.ts';
import { GET_FLAG, GET_FLAG_NOT_FOUND } from '../enum/FlagshipConstant.ts';

/**
 * Represents a collection of flags.
 */
export class FSFlagCollection implements IFSFlagCollection {
  private _visitor?: VisitorDelegate;
  private _keys: Set<string> = new Set();
  private _flags: Map<string, IFSFlag>;

  /**
     * Creates a new instance of FSFlagCollection.
     * @param param - The parameter object.
     * @param param.visitor - The visitor delegate.
     * @param param.flags - The initial flags.
     */
  public constructor(param: { visitor?: VisitorDelegate, flags?: Map<string, IFSFlag> }) {
    const { visitor, flags } = param;
    this._visitor = visitor;
    this._flags = flags || new Map();

    if (this._flags.size === 0) {
      this._keys = new Set(visitor?.flagsData.keys());
      this._keys.forEach((key) => {
        this._flags.set(key, new FSFlag({
          key,
          visitor
        }));
      });
    } else {
      this._keys = new Set(this._flags.keys());
    }
  }

  /**
   * @inheritdoc
   */
  public get size(): number {
    return this._keys.size;
  }

  /**
   * @inheritdoc
   */
  public get(key: string): IFSFlag {
    const flag = this._flags.get(key);
    if (!flag) {
      if (this._visitor?.config) {
        logWarningSprintf(this._visitor.config, GET_FLAG, GET_FLAG_NOT_FOUND, this._visitor.visitorId, key);
      }
      return new FSFlag({ key });
    }
    return flag;
  }

  /**
   * @inheritdoc
   */
  public has(key: string): boolean {
    return this._keys.has(key);
  }

  /**
   * @inheritdoc
   */
  public keys(): Set<string> {
    return this._keys;
  }

  /**
   * @inheritdoc
   */
  [Symbol.iterator](): Iterator<[string, IFSFlag]> {
    let index = 0;
    const keysArray = Array.from(this._keys);
    return {
      next: () => {
        if (index < keysArray.length) {
          const key = keysArray[index++];
          return {
            value: [key, this._flags.get(key) as IFSFlag],
            done: false
          };
        } else {
          return {
            value: null,
            done: true
          };
        }
      }
    };
  }

  /**
   * @inheritdoc
   */
  public filter(predicate: (value: IFSFlag, key: string, collection: IFSFlagCollection) => boolean): IFSFlagCollection {
    const flags = new Map<string, IFSFlag>();
    this._flags.forEach((flag, key) => {
      if (predicate(flag, key, this)) {
        flags.set(key, flag);
      }
    });
    return new FSFlagCollection({
      visitor: this._visitor,
      flags
    });
  }

  /**
   * @inheritdoc
   */
  public async exposeAll(): Promise<void> {
    await Promise.all(Array.from(this._flags.values(), (flag) => flag.visitorExposed()));
  }

  /**
   * @inheritdoc
   */
  public getMetadata(): Map<string, IFSFlagMetadata> {
    const metadata = new Map<string, IFSFlagMetadata>();
    this._flags.forEach((flag, key) => {
      metadata.set(key, flag.metadata);
    });
    return metadata;
  }

  /**
   * @inheritdoc
   */
  public toJSON(): SerializedFlagMetadata[] {
    const serializedData: SerializedFlagMetadata[] = [];
    this._flags.forEach((flag, key) => {
      const metadata = flag.metadata;
      serializedData.push({
        key,
        campaignId: metadata.campaignId,
        campaignName: metadata.campaignName,
        variationGroupId: metadata.variationGroupId,
        variationGroupName: metadata.variationGroupName,
        variationId: metadata.variationId,
        variationName: metadata.variationName,
        isReference: metadata.isReference,
        campaignType: metadata.campaignType,
        slug: metadata.slug,
        hex: valueToHex({ v: flag.getValue(null, false) })
      });
    });
    return serializedData;
  }

  public forEach(callbackfn: (value: IFSFlag, key: string, collection: IFSFlagCollection) => void): void {
    this._flags.forEach((flag, key) => {
      callbackfn(flag, key, this);
    });
  }
}
