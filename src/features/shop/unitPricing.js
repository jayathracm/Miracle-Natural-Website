// Parses a size string like "100ml" or "70g" into a per-100-unit price
// (e.g. "LKR 250 / 100ml") so shoppers can compare value across products —
// especially useful next to a "Low Stock"/"Sale" grid rather than only on
// the detail page. Returns null when size isn't in a recognized unit
// (e.g. free-text sizes), rather than showing a misleading number.
const UNIT_PATTERN = /^\s*([\d.]+)\s*(ml|l|g|kg)\s*$/i;

// Normalizes to the unit shoppers actually compare by — liquids to ml,
// solids to g — so "1L" and "500ml" read on the same scale.
const NORMALIZE = {
  ml: { factor: 1, label: 'ml' },
  l: { factor: 1000, label: 'ml' },
  g: { factor: 1, label: 'g' },
  kg: { factor: 1000, label: 'g' },
};

export function computeUnitPrice(size, price) {
  if (!size || !Number.isFinite(price) || price <= 0) return null;

  const match = UNIT_PATTERN.exec(size);
  if (!match) return null;

  const [, rawValue, rawUnit] = match;
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) return null;

  const { factor, label } = NORMALIZE[rawUnit.toLowerCase()];
  const normalizedValue = value * factor;
  const pricePer100 = (price / normalizedValue) * 100;

  return { pricePer100, unitLabel: `100${label}` };
}
