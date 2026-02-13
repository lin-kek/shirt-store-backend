import { prisma } from "../libs/prisma";

export async function getCategory(id: number) {
  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return category;
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findFirst({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return category;
}

export async function getCategoryMetadata(id: number) {
  const metadata = await prisma.categoryMetadata.findMany({
    where: { categoryId: id },
    select: {
      id: true,
      name: true,
      values: {
        select: {
          id: true,
          label: true,
        },
      },
    },
  });
  return metadata;
}
