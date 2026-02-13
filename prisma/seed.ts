import { prisma } from "../src/libs/prisma";

async function main() {
  console.log("🌱 Starting database seeding...");

  // Check if seeding has already been done
  console.log("Checking if database has already been seeded...");
  const existingCategory = await prisma.category.findFirst({
    where: {
      slug: "shirts",
    },
  });

  if (existingCategory) {
    console.log(
      "✅ Database has already been seeded. Skipping to avoid duplicate records.",
    );
    console.log("Found existing category:", existingCategory.name);
    return;
  }

  console.log("📝 No existing data found. Proceeding with seeding...");

  // Create Category
  console.log("Creating category...");
  const category = await prisma.category.create({
    data: {
      slug: "shirts",
      name: "Shirts",
    },
  });
  console.log("✅ Category created:", category.name);

  // Create CategoryMetadata
  console.log("Creating category metadata...");
  const categoryMetadata = await prisma.categoryMetadata.create({
    data: {
      id: "minimalist",
      name: "Minimalist",
      categoryId: category.id,
    },
  });
  console.log("✅ Category metadata created:", categoryMetadata.name);

  // Create Banners
  console.log("Creating banners...");
  const banners = await Promise.all([
    prisma.banner.create({
      data: {
        img: "banner_promo_1.jpg",
        link: "/categories/shirts",
      },
    }),
    prisma.banner.create({
      data: {
        img: "banner_promo_2.jpg",
        link: "/categories/test",
      },
    }),
  ]);
  console.log("✅ Banners created:", banners.length);

  // Create MetadataValues
  console.log("Creating metadata values...");
  const metadataValues = await Promise.all([
    prisma.metadataValue.create({
      data: {
        id: "night",
        label: "Night",
        categoryMetadataId: "minimalist",
      },
    }),
    prisma.metadataValue.create({
      data: {
        id: "beach",
        label: "Beach",
        categoryMetadataId: "minimalist",
      },
    }),
    prisma.metadataValue.create({
      data: {
        id: "mountain",
        label: "Mountain",
        categoryMetadataId: "minimalist",
      },
    }),
    prisma.metadataValue.create({
      data: {
        id: "tree",
        label: "Tree",
        categoryMetadataId: "minimalist",
      },
    }),
  ]);
  console.log("✅ Metadata values created:", metadataValues.length);

  // Create Products
  console.log("Creating products...");
  const products = await Promise.all([
    prisma.product.create({
      data: {
        label: "Shirt 1",
        price: 89.9,
        description: "Test shirt 1",
        categoryId: category.id,
      },
    }),
    prisma.product.create({
      data: {
        label: "Shirt 2",
        price: 94.5,
        description: "Test shirt 2",
        categoryId: category.id,
      },
    }),
    prisma.product.create({
      data: {
        label: "Shirt 3",
        price: 79.99,
        description: "Test shirt 3",
        categoryId: category.id,
      },
    }),
    prisma.product.create({
      data: {
        label: "Shirt 4",
        price: 69.9,
        description: "Test shirt 4",
        categoryId: category.id,
      },
    }),
  ]);
  console.log("✅ Products created:", products.length);

  // Create ProductImages for each product
  console.log("Creating product images...");
  const productImages = [];
  for (const product of products) {
    const images = await Promise.all([
      prisma.productImage.create({
        data: {
          productId: product.id,
          url: `product_${product.id}_1.jpg`,
        },
      }),
      prisma.productImage.create({
        data: {
          productId: product.id,
          url: `product_${product.id}_2.jpg`,
        },
      }),
    ]);
    productImages.push(...images);
  }
  console.log("✅ Product images created:", productImages.length);

  // Create ProductMetadata for each product
  console.log("Creating product metadata...");
  const productMetadata = await Promise.all([
    prisma.productMetadata.create({
      data: {
        productId: products[0].id,
        categoryMetadataId: "minimalist",
        metadataValueId: "night",
      },
    }),
    prisma.productMetadata.create({
      data: {
        productId: products[1].id,
        categoryMetadataId: "minimalist",
        metadataValueId: "beach",
      },
    }),
    prisma.productMetadata.create({
      data: {
        productId: products[2].id,
        categoryMetadataId: "minimalist",
        metadataValueId: "mountain",
      },
    }),
    prisma.productMetadata.create({
      data: {
        productId: products[3].id,
        categoryMetadataId: "minimalist",
        metadataValueId: "tree",
      },
    }),
  ]);
  console.log("✅ Product metadata created:", productMetadata.length);

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
