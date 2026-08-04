// Route-level page barrel — the single import surface App.jsx uses to wire up
// <Route> elements. Kept as a barrel (unlike the old components/index.js and
// data/index.js, which were removed) because it's genuinely exercised as one
// clean import line in App.jsx and maps 1:1 onto the route table.
export { default as Landing } from '@/features/landing/Landing';
export { default as MiracleNatural } from '@/features/landing/MiracleNatural';
export { default as Laira } from '@/features/landing/Laira';
export { default as About } from '@/features/landing/About';
export { default as Pricing } from '@/features/landing/Pricing';
export { default as Shop } from '@/features/shop/Shop';
export { default as ProductDetail } from '@/features/shop/ProductDetail';
export { default as RitualBuilder } from '@/features/ritual-builder/RitualBuilder';
export { default as CorporatePartnerApply } from '@/features/b2b/CorporatePartnerApply';
export { default as Login } from '@/features/auth/Login';
export { default as Signup } from '@/features/auth/Signup';
export { default as Account } from '@/features/account/Account';
export { default as ReturnPolicy } from '@/features/legal/ReturnPolicy';
export { default as PrivacyPolicy } from '@/features/legal/PrivacyPolicy';
export { default as TermsAndConditions } from '@/features/legal/TermsAndConditions';
