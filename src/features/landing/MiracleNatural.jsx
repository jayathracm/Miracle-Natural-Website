import HeroSection from '@/features/landing/sections/HeroSection';
import FeatureGridSection from '@/features/landing/sections/FeatureGridSection';
import ProductSection from '@/features/landing/sections/ProductSection';
import IngredientsSection from '@/features/landing/sections/IngredientsSection';
import MadeForSection from '@/features/landing/sections/MadeForSection';
import TestimonialSection from '@/features/landing/sections/TestimonialSection';
import PricingSection from '@/features/bundles/PricingSection';
import QnASection from '@/features/landing/sections/QnASection';
import CTASection from '@/features/landing/sections/CTASection';
import SectionBand from '@/features/landing/sections/SectionBand';

// A small centered hairline used to give two thematically-grouped sections
// (inside the same SectionBand) a light beat of separation without
// introducing a whole new section between them.
const ChapterDivider = () => (
  <div className="flex justify-center py-1" aria-hidden="true">
    <div className="h-px w-24 sm:w-32 bg-[linear-gradient(90deg,transparent,rgba(79,113,84,0.4),transparent)]" />
  </div>
);

// This is the Miracle Natural brand landing page, reachable at /miracle-natural
// (one of the two sub-brand tabs under the Leora Wellness parent site — see
// pages/Landing.jsx for the neutral parent landing at "/"). The page is
// deliberately grouped into four "chapters" — intro, products & credibility,
// process & proof, decide & act — alternating a plain background with a
// softly tinted SectionBand so each chapter reads as its own moment while
// scrolling, rather than one long undifferentiated stack.
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

      <TestimonialSection />

      <SectionBand>
        <PricingSection />
        <ChapterDivider />
        <QnASection />
      </SectionBand>

      <CTASection />
    </>
  );
};

export default MiracleNatural;
