// Product name/price/description/ingredients/benefits now live in Supabase
// (see supabase/schema.sql + supabase/seed.sql, fetched via src/lib/products.js).
//
// Images stay bundled locally rather than in Supabase Storage for now — Vite
// needs statically analyzable imports to bundle/optimize them, and this
// avoids extra Storage egress on the free tier. This file just maps each
// product's database id to its local image, so Shop.jsx can merge the two.
import faceWashImg from '../assets/catalog/golden-glow-face-wash.png';
import dayGelImg from '../assets/catalog/golden-glow-day-gel.png';
import serumImg from '../assets/catalog/golden-glow-serum-24k.png';
import nightCreamImg from '../assets/catalog/golden-glow-night-cream.png';
import acneTreatmentGelImg from '../assets/catalog/under-eye-gel.png';
import facePackImg from '../assets/catalog/herbal-face-treatment-pack.png';
import faceScrubImg from '../assets/catalog/herbal-face-treatment-scrub.png';
import bodyLotionImg from '../assets/catalog/golden-glow-body-lotion.png';
import sandalwoodSoapImg from '../assets/catalog/Soaps/sandalwood-herbal-bar-70g.jpeg';
import moringaSoapImg from '../assets/catalog/Soaps/moringa-herbal-bar-70g.jpeg';
import cinnamonSoapImg from '../assets/catalog/Soaps/cinnamon-herbal-bar-70g.jpeg';
import venivelSoapImg from '../assets/catalog/Soaps/venivel-herbal-bar-70g.jpeg';
import turmericSoapImg from '../assets/catalog/Soaps/golden-turmeric-herbal-bar-70g.jpeg';
import shampooImg from '../assets/catalog/herbal-shampoo.png';
import conditionerImg from '../assets/catalog/herbal-conditioner.png';
import hairOil50Img from '../assets/catalog/hair-oil-set-50ml.png';
import hairOil200Img from '../assets/catalog/hair-oil-set-200ml.png';
import underEyeGelImg from '../assets/catalog/acne-treatment-gel.png';
import lipBalmImg from '../assets/catalog/pink-rose-lip-balm.png';

const PRODUCT_IMAGES = {
  'golden-glow-face-wash': faceWashImg,
  'golden-glow-day-gel': dayGelImg,
  'golden-glow-serum-24k': serumImg,
  'golden-glow-night-cream': nightCreamImg,
  'acne-treatment-gel': acneTreatmentGelImg,
  'herbal-face-treatment-pack': facePackImg,
  'herbal-face-treatment-scrub': faceScrubImg,
  'golden-glow-body-lotion': bodyLotionImg,
  'calm-sandalwood-herbal-bar': sandalwoodSoapImg,
  'purifying-moringa-herbal-bar': moringaSoapImg,
  'comfort-cinnamon-herbal-bar': cinnamonSoapImg,
  'detox-venivel-herbal-bar': venivelSoapImg,
  'golden-turmeric-herbal-bar': turmericSoapImg,
  'herbal-shampoo': shampooImg,
  'herbal-conditioner': conditionerImg,
  'hair-oil-set-50ml': hairOil50Img,
  'hair-oil-set-200ml': hairOil200Img,
  'under-eye-gel': underEyeGelImg,
  'pink-rose-lip-balm': lipBalmImg,
};

export default PRODUCT_IMAGES;
