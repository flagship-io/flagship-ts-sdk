import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { Event as EventHit } from '../hit'

export interface ISharedActionTracking {
    initialize(visitor:VisitorAbstract): void;
    dispatchEventHit(hit: EventHit): void;
    generateNonce(): string;
}
