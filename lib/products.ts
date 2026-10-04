export interface ProductImageInfo {
  src: string;
  alt: string;
}

/**
 * Returns product image mapping based on product name:
 * - Pure water / sachet / bag batches: Sachet pure water bag picture
 * - Table water / bottled water pack: Shrink-wrapped bottled water pack picture
 * - Dispenser refill: 20L water dispenser refill bottle picture
 */
export function getProductImage(name: string): ProductImageInfo {
  const lower = name.toLowerCase();

  if (lower.includes("dispenser") || lower.includes("refill")) {
    return {
      src: "/images/products/dispenser-refill.jpg",
      alt: "20L water dispenser refill bottle",
    };
  }

  if (
    lower.includes("table water") ||
    lower.includes("bottled") ||
    (lower.includes("pack") && !lower.includes("bag"))
  ) {
    return {
      src: "/images/products/bottled-water-pack.jpg",
      alt: "Pack of bottled table water",
    };
  }

  return {
    src: "/images/products/sachet-water-bag.jpg",
    alt: "Sachet pure water batch bag",
  };
}
