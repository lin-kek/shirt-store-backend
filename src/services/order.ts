import { prisma } from "../libs/prisma";
import { Address } from "../types/address";
import { CartItem } from "../types/cartItem";
import { getProduct } from "./product";

type CreateOrderParams = {
  userId: number;
  address: Address;
  shippingCost: number;
  shippingDays: number;
  cart: CartItem[];
};

export async function createOrder({
  userId,
  address,
  shippingCost,
  shippingDays,
  cart,
}: CreateOrderParams) {
  let subtotal = 0;
  let orderItems = [];

  for (let cartItem of cart) {
    const product = await getProduct(cartItem.productId);
    if (product) {
      subtotal += product.price * cartItem.quantity;

      orderItems.push({
        productId: product.id,
        quantity: cartItem.quantity,
        price: product.price,
      });
    }
  }

  let total = subtotal + shippingCost;

  const order = await prisma.order.create({
    data: {
      userId,
      total,
      shippingCost,
      shippingDays,
      shippingZipcode: address.zipcode,
      shippingStreet: address.street,
      shippingNumber: address.number,
      shippingCity: address.city,
      shippingState: address.state,
      shippingCountry: address.country,
      shippingComplement: address.complement,
      orderItems: {
        create: orderItems,
      },
    },
  });

  if (!order) return null;
  return order.id;
}

export async function updateOrderStatus(
  orderId: number,
  status: "paid" | "cancelled",
) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}

export async function getUserOrders(userId: number) {
  return await prisma.order.findMany({
    where: { userId },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(id: number, userId: number) {
  const order = await prisma.order.findFirst({
    where: { id, userId },
    select: {
      id: true,
      status: true,
      total: true,
      shippingCost: true,
      shippingDays: true,
      shippingZipcode: true,
      shippingStreet: true,
      shippingNumber: true,
      shippingCity: true,
      shippingState: true,
      shippingCountry: true,
      shippingComplement: true,
      createdAt: true,
      orderItems: {
        select: {
          id: true,
          quantity: true,
          price: true,
          product: {
            select: {
              id: true,
              label: true,
              price: true,
              images: {
                take: 1,
                orderBy: { id: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!order) return null;

  return {
    ...order,
    orderItems: order.orderItems.map((item) => ({
      ...item,
      product: {
        ...item.product,
        image: item.product.images[0]
          ? `media/products/${item.product.images[0].url}`
          : null,
        images: undefined,
      },
    })),
  };
}
