import { RouterContext, RouteParams, HitType, EventCategory } from "../deps.ts";

export const sendHit = async ({
  request,
  response,
  state,
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
      response.body = "Hit sent";
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
      response.body = "Hit sent";
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
};
