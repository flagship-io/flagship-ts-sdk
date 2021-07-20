import { HitType } from '../src/enum'
import { EventCategory, Flagship } from '../src/index'

Flagship.start('YOUR_ENV_ID', 'YOUR_API_KEY')

Flagship.newVisitor('').sendHitSync({ type: HitType.EVENT, affiliation: '', transactionId: '' })
