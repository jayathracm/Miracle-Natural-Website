import HeroSection from '@/features/landing/sections/HeroSection';
import FeatureGridSection from '@/features/landing/sections/FeatureGridSection';
import ProductSection from '@/features/landing/sections/ProductSection';
import IngredientsSection from '@/features/landing/sections/IngredientsSection';
import MadeForSection from '@/features/landing/sections/MadeForSection';
import QnASection from '@/features/landing/sections/QnASection';
import CTASection from '@/features/landing/sections/CTASection';
import SectionBand from '@/features/landing/sections/SectionBand';

// A small hairline separating two sections inside the same SectionBand.
const ChapterDivider = () => (
  <div className="flex justify-center py-1" aria-hidden="true">
    <div className="h-px w-24 sm:w-32 bg-[linear-gradient(90deg,transparent,rgba(79,113,84,0.4),transparent)]" />
  </div>
);

// Miracle Natural's brand landing page at /miracle-natural. Grouped into
// four "chapters", alternating plain background with a tinted SectionBand
// so each reads as its own moment while scrolling.
const MiracleNatural = () => {
  return (
    <>
      <HeroSection />
      <FeatureGridSection />

      <SectionBand>
        <ProductSection />
        <ChapterDivider />
        <IngredientsSection />
        <ChapterDivider />
        <MadeForSection />
      </SectionBand>

      <SectionBand>
        <QnASection />
      </SectionBand>

      <CTASection />
    </>
  );
};

export default MiracleNatural;
