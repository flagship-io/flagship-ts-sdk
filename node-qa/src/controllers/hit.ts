import { Request, Response, HitType, EventCategory } from '../deps'
import { sessionVisitors } from './visitor'

export const sendHit = async (req: Request, res: Response):Promise<void> => {
  const visitor = sessionVisitors[req.session.id]
  let hit = req.body

  const commonParams:Record<string, unknown> = {}
  if (hit.ul) {
    commonParams.local = hit.ul
  }
  if (hit.uip) {
    commonParams.userIp = hit.uip
  }
  if (hit.sn) {
    commonParams.sessionNumber = hit.sn
  }
  if (hit.re_he && hit.re_wi) {
    commonParams.screenResolution = `${hit.re_he}X${hit.re_wi}`
  }

  switch (hit.t) {
    case 'EVENT':
      hit = {
        type: HitType.EVENT,
        category:
          hit.ec === 'ACTION_TRACKING'
            ? EventCategory.ACTION_TRACKING
            : EventCategory.USER_ENGAGEMENT,
        action: hit.ea,
        label: hit.el,
        value: hit.ev,
        ...commonParams
      }
      break

    case 'ITEM':
      hit = {
        type: HitType.ITEM,
        transactionId: hit.tid,
        productName: hit.in,
        productSku: hit.ic,
        itemPrice: hit.ip,
        itemQuantity: hit.iq,
        itemCategory: hit.iv,
        ...commonParams
      }
      break

    case 'SCREEN':
      hit = {
        type: HitType.SCREEN,
        documentLocation: hit.dl,
        ...commonParams
      }
      break

    case 'PAGE':
      hit = {
        type: HitType.PAGE,
        documentLocation: hit.dl,
        ...commonParams
      }
      break

    case 'TRANSACTION':
      // eslint-disable-next-line no-lone-blocks
      hit = {
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
      }

      break
    default:
      console.log('Unknown hit type:', hit.t)
      hit = null
      break
  }

  if (!hit) {
    res.status(500).json({ error: 'Unknown hit type' })
  }

  await visitor.sendHit(hit)

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
