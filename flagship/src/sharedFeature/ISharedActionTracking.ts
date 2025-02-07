import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { LocalActionTracking } from '../type.local'

export interface ISharedActionTracking {
    initialize(visitor:VisitorAbstract): void;
    dispatchEventHits(hits: LocalActionTracking[]): void;
    generateNonce(): string;
}
