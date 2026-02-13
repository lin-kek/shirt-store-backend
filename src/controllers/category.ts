import { RequestHandler } from "express";
import { getCategoryBySlug, getCategoryMetadata } from "../services/category";

type Params = {
  slug: string;
};

export const getCategoryWithMetadata: RequestHandler<Params> = async (
  req,
  res,
) => {
  const { slug } = req.params;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const metadata = await getCategoryMetadata(category.id);

  res.json({ error: null, category, metadata });
};
