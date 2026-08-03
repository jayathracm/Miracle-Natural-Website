// Shared between Shop.jsx (filter dropdown + counts) and ProductDetail.jsx
// (category label above the product name) so the two surfaces never drift
// out of sync on which raw `products.category` values map to which
// customer-facing shop category.
export const SHOP_CATEGORY_ORDER = ['Face Care', 'Body Care', 'Hair Care', 'Lip Care'];

export const SHOP_CATEGORY_MAP = {
  'Face Care': 'Face Care',
  Treatment: 'Face Care',
  'Weekly Care': 'Face Care',
  'Body Care': 'Body Care',
  'Hair Care': 'Hair Care',
  'Lip Care': 'Lip Care',
};

export const getShopCategory = (product) => SHOP_CATEGORY_MAP[product.category] || product.category;
