import { RouterContext, RouteParams, HitType, EventCategory } from "../deps.ts";

export const sendHit = async ({
  request,
  response,
  state,
// deno-lint-ignore no-explicit-any
}: RouterContext<RouteParams, Record<string, any>>) => {
  const visitor = await state.session.get("visitor");
  const hit = await request.body().value;  

  switch (hit.t) {
    case "EVENT": {
      visitor.sendHit({
        type: HitType.EVENT,
        category:
          hit.ec === "ACTION_TRACKING"
            ? EventCategory.ACTION_TRACKING
            : EventCategory.USER_ENGAGEMENT,
        action: hit.ea,
        eventLabel: hit.el,
        eventValue: hit.ev,
      });
      break;
    }
    case "ITEM": {
      visitor.sendHit({
        type: HitType.ITEM,
        transactionId: hit.tid,
        productName: hit.in,
        productSku: hit.ic,
        itemPrice: hit.ip,
        itemQuantity: hit.iq,
        itemCategory: hit.iv,
      });
      break;
    }
    case "SCREEN": {
      visitor.sendHit({
        type: HitType.SCREEN,
        documentLocation: hit.dl,
      });
      break;
    }
    case "PAGE": {
      visitor.sendHit({
        type: HitType.PAGE,
        documentLocation: hit.dl,
      });
      break;
    }
    case "TRANSACTION":
      {
        visitor.sendHit({
          type: HitType.TRANSACTION,
          transactionId: hit.tid,
          affiliation: hit.ta,
          taxes: hit.tt,
          currency: hit.tc,
          couponCode: hit.tcc,
          itemCount: hit.icn,
          shippingMethod: hit.sm,
          paymentMethod: hit.pm,
          totalRevenue: hit.tr,
          shippingCosts: hit.ts,
        });
      }
      break;
  }

  const config = {
    // deno-lint-ignore camelcase
    environment_id: null,
    // deno-lint-ignore camelcase
    api_key: null,
    timeout: 2000,
    bucketing: false,
    // deno-lint-ignore camelcase
    polling_interval: 2000,
  };

  if (await state.session.has("config")) {
    const configSession = await state.session.get("config");
    config.environment_id = configSession.environmentId;
    config.api_key = configSession.apiKey;
    config.timeout = configSession.timeout;
    config.bucketing = configSession.bucketing;
    config.polling_interval = configSession.pollingInterval;
  }
  return (response.body = config);
};
