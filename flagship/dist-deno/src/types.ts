import { IEvent, IItem, IPage, IScreen, ITransaction } from './hit/index.ts'

export type modificationsRequested<T>={
    key: string,
    defaultValue: T,
    activate? :boolean
  }

export type primitive=string | number | boolean

export type IHit = IPage | IScreen | IEvent | IItem | ITransaction

export type Modification= {
  key: string;
  campaignId: string;
  variationGroupId: string;
  variationId: string;
  isReference: boolean;
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}
