import { VisitorAbstract } from '../visitor/VisitorAbstract.ts';
import { LocalActionTracking } from '../type.local.ts';

export interface ISharedActionTracking {
    initialize(visitor:VisitorAbstract): void;
    dispatchEventHits(hits: LocalActionTracking[]): void;
    generateNonce(): string|undefined;
}
