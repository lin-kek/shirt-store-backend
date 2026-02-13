import { compare, hash } from "bcryptjs";
import { prisma } from "../libs/prisma";
import { v4 } from "uuid";
import { Address } from "../types/address";

export async function createUser(
  name: string,
  email: string,
  password: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return null;

  const hashedPassword = await hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export async function logUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const validPassword = await compare(password, user.password);
  if (!validPassword) return null;

  const token = v4();
  await prisma.user.update({
    where: { id: user.id },
    data: { token },
  });
  return token;
}

export async function getUserIdByToken(token: string) {
  const user = await prisma.user.findFirst({
    where: { token },
  });
  if (!user) return null;

  return user.id;
}

export async function createAddress(userId: number, address: Address) {
  return await prisma.userAddress.create({
    data: {
      ...address,
      userId,
    },
  });
}

export async function getAddressesByUserId(userId: number) {
  return await prisma.userAddress.findMany({
    where: { userId },
    select: {
      id: true,
      zipcode: true,
      street: true,
      number: true,
      city: true,
      state: true,
      country: true,
      complement: true,
    },
  });
}

export async function getAddressById(userId: number, addressId: number) {
  return prisma.userAddress.findFirst({
    where: { id: addressId, userId },
    select: {
      id: true,
      zipcode: true,
      street: true,
      number: true,
      city: true,
      state: true,
      country: true,
      complement: true,
    },
  });
}
