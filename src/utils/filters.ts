import { Product, FilterState } from "../types/product";

export function filterProducts(
  products: Product[],
  filters: FilterState
): Product[] {
  return products.filter((product) => {
    // Sub category
    if (
      filters.subCategory &&
      filters.subCategory !== "ALL" &&
      product.subCategory !== filters.subCategory
    ) {
      return false;
    }

    // Diamond carat
    if (
      filters.diamondCarat.length > 0 &&
      !filters.diamondCarat.some((c) => product.diamondCaratOptions.includes(c))
    ) {
      return false;
    }

    // Sizes
    if (filters.sizes.length > 0 && !filters.sizes.includes(product.size)) {
      return false;
    }

    // Price range
    if (filters.priceMin !== null && product.price < filters.priceMin) {
      return false;
    }
    if (filters.priceMax !== null && product.price > filters.priceMax) {
      return false;
    }

    // Category
    if (
      filters.category.length > 0 &&
      !filters.category.includes(product.category as any)
    ) {
      return false;
    }

    // Silver 925 range
    if (
      filters.silver925Min !== null &&
      product.silver925 < filters.silver925Min
    ) {
      return false;
    }
    if (
      filters.silver925Max !== null &&
      product.silver925 > filters.silver925Max
    ) {
      return false;
    }

    // Diamond weight range
    if (
      filters.diamondWtMin !== null &&
      product.diamondWt < filters.diamondWtMin
    ) {
      return false;
    }
    if (
      filters.diamondWtMax !== null &&
      product.diamondWt > filters.diamondWtMax
    ) {
      return false;
    }

    // Gold 14k range
    if (
      filters.goldWt14kMin !== null &&
      product.goldWt14k < filters.goldWt14kMin
    ) {
      return false;
    }
    if (
      filters.goldWt14kMax !== null &&
      product.goldWt14k > filters.goldWt14kMax
    ) {
      return false;
    }

    // Gold 18k range
    if (
      filters.goldWt18kMin !== null &&
      product.goldWt18k < filters.goldWt18kMin
    ) {
      return false;
    }
    if (
      filters.goldWt18kMax !== null &&
      product.goldWt18k > filters.goldWt18kMax
    ) {
      return false;
    }

    return true;
  });
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCategory(cat: string): string {
  return cat
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatSubCategory(sub: string): string {
  if (sub === "ALL") return "All";
  return sub
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}