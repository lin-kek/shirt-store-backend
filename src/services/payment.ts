import {
  createStripeCheckoutSession,
  getStripeCheckoutSession,
} from "../libs/stripe";
import { CartItem } from "../types/cartItem";

type CreatePaymentLinkParams = {
  cart: CartItem[];
  shippingCost: number;
  orderId: number;
};

export async function createPaymentLink({
  cart,
  shippingCost,
  orderId,
}: CreatePaymentLinkParams) {
  try {
    const session = await createStripeCheckoutSession({
      cart,
      shippingCost,
      orderId,
    });
    if (!session.url) return null;
    return session.url;
  } catch (error) {
    return null;
  }
}

export async function getOrderIdFromSession(sessionId: string) {
  try {
    const session = await getStripeCheckoutSession(sessionId);
    const orderId = session.metadata?.orderId;
    if (!orderId) return null;

    return parseInt(orderId);
  } catch (error) {
    return null;
  }
}
