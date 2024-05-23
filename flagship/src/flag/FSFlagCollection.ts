import { IFlagMetadata } from '../types'
import { VisitorDelegate } from '../visitor/VisitorDelegate'
import { Flag } from './Flags'
import { IFlag } from './IFlag'

export class FSFlagCollection implements Iterable<[string, IFlag]> {
  private _visitor: VisitorDelegate
  private _keys: string[] = []
  private _flags: Map<string, IFlag>

  public constructor (param: { visitor: VisitorDelegate, flags?: Map<string, IFlag>}) {
    const { visitor } = param
    this._visitor = visitor
    this._flags = param.flags || new Map()
    this._keys = Array.from(this._flags.keys())
    if (this._flags.size === 0) {
      this._keys = Array.from(visitor.flagsData.keys())
      this._flags = new Map()
      this._keys.forEach((key) => {
        this._flags.set(key, new Flag({ key, visitor }))
      })
    }
  }

  public get size (): number {
    return this._keys.length
  }

  public get (key: string): IFlag|undefined {
    return this._flags.get(key)
  }

  public has (key: string): boolean {
    return this._keys.includes(key)
  }

  public getKeys (): string[] {
    return this._keys
  }

  [Symbol.iterator] (): Iterator<[string, IFlag]> {
    let index = 0
    return {
      next: () => {
        if (index < this._keys.length) {
          const key = this._keys[index++]
          return { value: [key, this._flags.get(key) as IFlag], done: false }
        } else {
          return { value: null, done: true }
        }
      }
    }
  }

  public filter (predicate: (value: IFlag, key: string, collection: FSFlagCollection) => boolean): FSFlagCollection {
    const flags = new Map<string, IFlag>()
    this._flags.forEach((flag, key) => {
      if (predicate(flag, key, this)) {
        flags.set(key, flag)
      }
    })
    return new FSFlagCollection({ visitor: this._visitor, flags })
  }

  public async exposeAll (): Promise<void> {
    const promises: Promise<void>[] = []
    this._flags.forEach((flag) => {
      promises.push(flag.visitorExposed())
    })
    await Promise.all(promises)
  }

  /**
   * Returns all metadata
   */
  public getMetadata (): Map<string, IFlagMetadata> {
    const metadata = new Map<string, IFlagMetadata>()
    this._flags.forEach((flag, key) => {
      metadata.set(key, flag.metadata)
    })
    return metadata
  }
}
