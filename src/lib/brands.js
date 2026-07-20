// Central registry for the three storefronts (functional-requirements.md
// §1.0 / §1.9): Miracle Natural, Laira, and Leora Wellness each have their
// own shop, their own cart, and their own product-detail routes, but all
// share one `products` table (tagged by `brand`) and one CartContext
// (partitioned by brand) rather than fully separate schemas/contexts.
//
// `slug` is the URL segment used in routes like `/:brandSlug/shop`; `brand`
// is the value stored in `products.brand` / `orders.brand`.
export const BRANDS = [
  {
    brand: 'miracle_natural',
    slug: 'miracle-natural',
    label: 'Miracle Natural',
  },
  {
    brand: 'laira',
    slug: 'laira',
    label: 'Laira',
  },
  {
    brand: 'leora_wellness',
    slug: 'leora-wellness',
    label: 'Leora Wellness',
  },
];

export const BRAND_BY_SLUG = Object.fromEntries(BRANDS.map((entry) => [entry.slug, entry]));
export const BRAND_BY_VALUE = Object.fromEntries(BRANDS.map((entry) => [entry.brand, entry]));

export const isValidBrandSlug = (slug) => Boolean(BRAND_BY_SLUG[slug]);

export const shopPathForSlug = (slug) => `/${slug}/shop`;
export const shopPathForBrand = (brand) => shopPathForSlug(BRAND_BY_VALUE[brand]?.slug || BRANDS[0].slug);
