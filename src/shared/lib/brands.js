// Registry for the two storefronts. Miracle Natural and Laira each have
// their own shop/cart/routes but share one products table (tagged by
// brand). Leora Wellness is the parent company and has no shop of its own.
//
// `slug` is the URL segment (/:brandSlug/shop), `brand` is the DB value.
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
];

export const BRAND_BY_SLUG = Object.fromEntries(BRANDS.map((entry) => [entry.slug, entry]));
export const BRAND_BY_VALUE = Object.fromEntries(BRANDS.map((entry) => [entry.brand, entry]));

export const isValidBrandSlug = (slug) => Boolean(BRAND_BY_SLUG[slug]);

export const shopPathForSlug = (slug) => `/${slug}/shop`;
export const shopPathForBrand = (brand) => shopPathForSlug(BRAND_BY_VALUE[brand]?.slug || BRANDS[0].slug);
