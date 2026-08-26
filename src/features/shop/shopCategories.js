// Shared between Shop.jsx and ProductDetail.jsx so both agree on which raw
// `products.category` values map to which customer-facing category.
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
