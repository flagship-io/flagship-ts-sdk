import { HitType } from '../src/enum'
import { DecisionMode, EventCategory, Flagship } from '../src/index'

Flagship.start('YOUR_ENV_ID', 'YOUR_API_KEY', { decisionMode: DecisionMode.DECISION_API })

Flagship.newVisitor('').sendHitSync({ type: HitType.EVENT, affiliation: '', transactionId: '' })
