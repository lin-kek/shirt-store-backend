import { RequestHandler } from "express";
import { cartMountSchema } from "../schemas/cart-mount-schema";
import { getProduct } from "../services/product";
import { getAbsoluteImageUrl } from "../utils/get-absolute-image-url";
import { calculateShippingSchema } from "../schemas/calculate-shipping-schema";
import { finishSchema } from "../schemas/finish-schema";
import { getAddressById } from "../services/user";
import { createOrder } from "../services/order";
import { createPaymentLink } from "../services/payment";

export const cartMount: RequestHandler = async (req, res) => {
  const parseResult = cartMountSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid array of ids" });
    return;
  }
  const { ids } = parseResult.data;

  let products = [];
  for (let id of ids) {
    const product = await getProduct(id);
    if (product) {
      products.push({
        id: product.id,
        label: product.label,
        price: product.price,
        image: product.images[0]
          ? getAbsoluteImageUrl(product.images[0])
          : null,
      });
    }
  }

  res.json({ error: null, products });
};

export const calculateShipping: RequestHandler = async (req, res) => {
  const parseResult = calculateShippingSchema.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid ZIP Code" });
    return;
  }
  const { zipcode } = parseResult.data;

  res.json({ error: null, zipcode, cost: 10, days: 3 });
};

export const finish: RequestHandler = async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Access denied" });
    return;
  }

  const result = finishSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid cart" });
    return;
  }
  const { cart, addressId } = result.data;

  const address = await getAddressById(userId, addressId);
  if (!address) {
    res.status(400).json({ error: "Invalid address" });
    return;
  }

  const shippingCost = 10; // Temporarily hardcoded
  const shippingDays = 3; // Temporarily hardcoded

  const orderId = await createOrder({
    userId,
    address,
    shippingCost,
    shippingDays,
    cart,
  });
  if (!orderId) {
    res.status(400).json({ error: "Something went wrong" });
    return;
  }

  const url = await createPaymentLink({
    cart,
    shippingCost,
    orderId,
  });
  if (!url) {
    res.status(400).json({ error: "Payment URL could not be created" });
    return;
  }

  res.status(201).json({ error: null, url });
};
