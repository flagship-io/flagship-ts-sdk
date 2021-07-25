export type modificationsRequested<T>={
    key: string,
    defaultValue: T,
    activate? :boolean
  }

export type primitive=string | number | boolean
