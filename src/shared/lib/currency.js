// Shared LKR currency formatter — was previously copy-pasted as a local
// `formatCurrency` in ~16 different files. One place now, easier to keep
// consistent and to unit test. `options` passes straight through to
// toLocaleString, e.g. { maximumFractionDigits: 0 } for a rounded dashboard figure.
export function formatCurrency(amount, options) {
  return `LKR ${Number(amount).toLocaleString('en-LK', options)}`;
}
