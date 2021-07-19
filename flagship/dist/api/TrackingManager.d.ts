import { HitAbstract } from '../hit/HitAbstract';
import { Modification } from '../model/Modification';
import { Visitor } from '../visitor/Visitor';
import { TrackingManagerAbstract } from './TrackingManagerAbstract';
export declare class TrackingManager extends TrackingManagerAbstract {
    sendActive(visitor: Visitor, modification: Modification): Promise<void>;
    sendHit(hit: HitAbstract): Promise<void>;
}
