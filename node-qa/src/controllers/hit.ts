import { Request, Response, HitType, EventCategory } from '../deps'
import { sessionVisitors } from './visitor'

export const sendHit = (req: Request, res: Response):void => {
  const visitor = sessionVisitors[req.session.id]
  const hit = req.body

  const commonParams = {
    local: hit.ul,
    userIp: hit.uip,
    sessionNumber: hit.sn,
    screenResolution: `${hit.re_he}X${hit.re_wi}`
  }

  switch (hit.t) {
    case 'EVENT': {
      visitor.sendHit({
        type: HitType.EVENT,
        category:
          hit.ec === 'ACTION_TRACKING'
            ? EventCategory.ACTION_TRACKING
            : EventCategory.USER_ENGAGEMENT,
        action: hit.ea,
        label: hit.el,
        value: hit.ev,
        ...commonParams
      })
      break
    }
    case 'ITEM': {
      visitor.sendHit({
        type: HitType.ITEM,
        transactionId: hit.tid,
        productName: hit.in,
        productSku: hit.ic,
        itemPrice: hit.ip,
        itemQuantity: hit.iq,
        itemCategory: hit.iv,
        ...commonParams
      })
      break
    }
    case 'SCREEN': {
      visitor.sendHit({
        type: HitType.SCREEN,
        documentLocation: hit.dl,
        ...commonParams
      })
      break
    }
    case 'PAGE': {
      visitor.sendHit({
        type: HitType.PAGE,
        documentLocation: hit.dl,
        ...commonParams
      })
      break
    }
    case 'TRANSACTION':
      {
        visitor.sendHit({
          type: HitType.TRANSACTION,
          affiliation: hit.ta,
          transactionId: hit.tid,
          taxes: hit.tt,
          currency: hit.tc,
          couponCode: hit.tcc,
          itemCount: hit.icn,
          shippingMethod: hit.sm,
          paymentMethod: hit.pm,
          totalRevenue: hit.tr,
          shippingCosts: hit.ts,
          ...commonParams
        })
      }
      break
    default:
      break
  }

  const config = {
    // deno-lint-ignore camelcase
    environment_id: '',
    // deno-lint-ignore camelcase
    api_key: '',
    timeout: 2000,
    bucketing: false,
    // deno-lint-ignore camelcase
    polling_interval: 2000
  }

  if (req.session.config) {
    const configSession = req.session.config
    config.environment_id = configSession.environmentId
    config.api_key = configSession.apiKey
    config.timeout = configSession.timeout
    config.bucketing = configSession.bucketing
    config.polling_interval = configSession.pollingInterval
  }
  res.json(config)
}
