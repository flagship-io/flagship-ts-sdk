import { HitAbstract } from '../hit/HitAbstract';
import { Modification } from '../model/Modification';
import { VisitorAbstract } from '../visitor/VisitorAbstract';
import { TrackingManagerAbstract } from './TrackingManagerAbstract';
export declare class TrackingManager extends TrackingManagerAbstract {
    sendConsentHit(visitor: VisitorAbstract): Promise<void>;
    sendActive(visitor: VisitorAbstract, modification: Modification): Promise<void>;
    sendHit(hit: HitAbstract): Promise<void>;
}
