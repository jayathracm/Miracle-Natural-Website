import faceWashImg from '../assets/catalog/golden-glow-face-wash.png';
import dayGelImg from '../assets/catalog/golden-glow-day-gel.png';
import serumImg from '../assets/catalog/golden-glow-serum-24k.png';
import nightCreamImg from '../assets/catalog/golden-glow-night-cream.png';
import acneGelImg from '../assets/catalog/under-eye-gel.png';
import packImg from '../assets/catalog/herbal-face-treatment-pack.png';

const steps = [
  {
    number: 1,
    title: 'Cleanse with Golden Glow Face Wash',
    description:
      'Start with Golden Glow Face Wash (100ml) enriched with Harankaha, Aloe Vera, Manjishta, and Thulsi to deep cleanse and refresh skin.',
    highlight: 'Benefit: Removes dead cells, balances skin pH, and supports natural glow.',
    highlightColor: 'bg-forest-500/20 text-forest-700 border-forest-500/30',
    image: faceWashImg,
    imagePosition: 'center 48%',
  },
  {
    number: 2,
    title: 'Hydrate with Golden Glow Day Gel',
    description:
      'Apply Golden Glow Day Gel (30g) with Saffron, Licorice, Niacinamide, and Aloe Vera for lightweight day hydration.',
    highlight: 'Benefit: Non-greasy hydration that works well under makeup and for sensitive skin.',
    highlightColor: 'bg-accent/20 text-accent border-accent/30',
    image: dayGelImg,
    imagePosition: 'center 60%',
  },
  {
    number: 3,
    title: 'Target Marks with 24K Golden Glow Serum',
    description:
      'Use the 24K Golden Glow Serum (20ml) featuring Hyaluronic Acid, Kojic Acid, Turmeric Extract, and Gold Extract for focused correction.',
    highlight: 'Benefit: Helps reduce dark spots, acne marks, and visible pigmentation.',
    highlightColor: 'bg-forest-500/20 text-forest-700 border-forest-500/30',
    image: serumImg,
    imagePosition: 'center 46%',
  },
  {
    number: 4,
    title: 'Repair Overnight with Night Cream',
    description:
      'Seal your routine with Golden Glow Night Cream (30g) containing Alpha Arbutin, Vitamin C, Licorice, and Manjishta.',
    highlight: 'Benefit: Supports overnight skin repair, softness, and hydration.',
    highlightColor: 'bg-accent/20 text-accent border-accent/30',
    image: nightCreamImg,
    imagePosition: 'center 80%',
  },
  {
    number: 5,
    title: 'Use Acne Treatment Gel as Needed',
    description:
      'For breakout-prone areas, apply Tea Tree Acne Treatment Gel (30g) with Neem, Aloe Vera, Harankaha, and Coriander.',
    highlight: 'Benefit: Controls excess oil and helps smooth oily or combination skin.',
    highlightColor: 'bg-forest-500/20 text-forest-700 border-forest-500/30',
    image: acneGelImg,
    imagePosition: 'center 60%',
  },
  {
    number: 6,
    title: 'Weekly Herbal Face Treatment Pack',
    description:
      'Finish with the Herbal Face Treatment Pack for a weekly reset using Rice Flour, Sandalwood, Gram Flour, and Vitamin C.',
    highlight: 'Benefit: Supports instant glow, texture refinement, and tone brightening.',
    highlightColor: 'bg-accent/20 text-accent border-accent/30',
    image: packImg,
    imagePosition: 'center 75%',
  },
];

export default steps;
