import acneTreatmentGelImg from '../assets/catalog/acne-treatment-gel.png';
import bodyLotionImg from '../assets/catalog/golden-glow-body-lotion.png';
import dayGelImg from '../assets/catalog/golden-glow-day-gel.png';
import faceWashImg from '../assets/catalog/golden-glow-face-wash.png';
import nightCreamImg from '../assets/catalog/golden-glow-night-cream.png';
import serumImg from '../assets/catalog/golden-glow-serum-24k.png';
import hairOil200Img from '../assets/catalog/hair-oil-set-200ml.png';
import hairOil50Img from '../assets/catalog/hair-oil-set-50ml.png';
import conditionerImg from '../assets/catalog/herbal-conditioner.png';
import facePackImg from '../assets/catalog/herbal-face-treatment-pack.png';
import faceScrubImg from '../assets/catalog/herbal-face-treatment-scrub.png';
import shampooImg from '../assets/catalog/herbal-shampoo.png';
import lipBalmImg from '../assets/catalog/pink-rose-lip-balm.png';
import underEyeGelImg from '../assets/catalog/under-eye-gel.png';

const productCatalog = [
  {
    id: 'golden-glow-face-wash',
    name: 'Golden Glow Face Wash',
    category: 'Face Care',
    size: '100ml',
    price: 790,
    image: faceWashImg,
  },
  {
    id: 'golden-glow-day-gel',
    name: 'Golden Glow Day Gel',
    category: 'Face Care',
    size: '30g',
    price: 850,
    image: dayGelImg,
  },
  {
    id: 'golden-glow-serum-24k',
    name: '24K Golden Glow Serum',
    category: 'Treatment',
    size: '20ml',
    price: 1190,
    image: serumImg,
  },
  {
    id: 'golden-glow-night-cream',
    name: 'Golden Glow Night Cream',
    category: 'Face Care',
    size: '30g',
    price: 930,
    image: nightCreamImg,
  },
  {
    id: 'acne-treatment-gel',
    name: 'Tea Tree Acne Treatment Gel',
    category: 'Treatment',
    size: '30g',
    price: 890,
    image: acneTreatmentGelImg,
  },
  {
    id: 'herbal-face-treatment-pack',
    name: 'Herbal Face Treatment Pack',
    category: 'Weekly Care',
    size: '100g',
    price: 840,
    image: facePackImg,
  },
  {
    id: 'herbal-face-treatment-scrub',
    name: 'Herbal Face Treatment Scrub',
    category: 'Weekly Care',
    size: '100g',
    price: 820,
    image: faceScrubImg,
  },
  {
    id: 'golden-glow-body-lotion',
    name: 'Golden Glow Body Lotion',
    category: 'Body Care',
    size: '250ml',
    price: 980,
    image: bodyLotionImg,
  },
  {
    id: 'herbal-shampoo',
    name: 'Herbal Shampoo',
    category: 'Hair Care',
    size: '250ml',
    price: 1050,
    image: shampooImg,
  },
  {
    id: 'herbal-conditioner',
    name: 'Herbal Conditioner',
    category: 'Hair Care',
    size: '250ml',
    price: 1020,
    image: conditionerImg,
  },
  {
    id: 'hair-oil-set-50ml',
    name: 'Hair Oil Set',
    category: 'Hair Care',
    size: '50ml x 3',
    price: 1290,
    image: hairOil50Img,
  },
  {
    id: 'hair-oil-set-200ml',
    name: 'Hair Oil Set',
    category: 'Hair Care',
    size: '200ml x 3',
    price: 2390,
    image: hairOil200Img,
  },
  {
    id: 'under-eye-gel',
    name: 'Under Eye Gel',
    category: 'Treatment',
    size: '20ml',
    price: 760,
    image: underEyeGelImg,
  },
  {
    id: 'pink-rose-lip-balm',
    name: 'Pink Rose Lip Balm',
    category: 'Lip Care',
    size: '15g',
    price: 520,
    image: lipBalmImg,
  },
];

export default productCatalog;
