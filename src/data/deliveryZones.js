// Shared across Shop.jsx (checkout) and the Addresses profile section, so
// both use the same zone list/labels/shipping rates instead of drifting.
const DELIVERY_ZONES = {
  colombo_1_15: { label: 'Colombo 1-15', rate: 300 },
  island_wide: { label: 'Other Areas in Sri Lanka', rate: 350 },
};

export default DELIVERY_ZONES;
