import { HitType } from '../src/enum'
import { Flagship, DecisionApiConfig } from '../src/index'

Flagship.start('YOUR_ENV_ID', 'YOUR_API_KEY')

Flagship.newVisitor('').sendHit({ ds: '', visitorId: '', config: {} as DecisionApiConfig, hitType: HitType.EVENT })
