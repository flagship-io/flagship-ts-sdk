import { ImportHitType } from '../type.local'

type HitModuleMap = {
    [ImportHitType.Event]: typeof import('./Event'),
    [ImportHitType.Item]: typeof import('./Item'),
    [ImportHitType.Page]: typeof import('./Page'),
    [ImportHitType.Screen]: typeof import('./Screen'),
    [ImportHitType.Transaction]: typeof import('./Transaction'),
    [ImportHitType.Segment]: typeof import('./Segment'),
    [ImportHitType.Activate]: typeof import('./Activate'),
    [ImportHitType.Troubleshooting]: typeof import('./Troubleshooting'),
    [ImportHitType.UsageHit]: typeof import('./UsageHit'),
    [ImportHitType.ActivateBatch]: typeof import('./ActivateBatch'),
    [ImportHitType.Batch]: typeof import('./Batch'),
    [ImportHitType.HitAbstract]: typeof import('./HitAbstract'),
    [ImportHitType.Diagnostic]: typeof import('./Diagnostic'),
  }

/**
 * Dynamically imports a module based on the provided hit type.
 *
 * @template T - The type of the hit.
 * @param {T} hitType - The type of the hit to import.
 * @returns {Promise<HitModuleMap[T]>} A promise that resolves to the imported module.
 */
export function importHit<T extends ImportHitType> (hitType: T): Promise<HitModuleMap[T]> {
  return import(/* webpackMode: "lazy" */`./${hitType}`) as Promise<HitModuleMap[T]>
}
