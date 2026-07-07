import HeroSection from '../components/HeroSection';
import FeatureGridSection from '../components/FeatureGridSection';
import ProductSection from '../components/ProductSection';
import MadeForSection from '../components/MadeForSection';
import TestimonialSection from '../components/TestimonialSection';
import PricingSection from '../components/PricingSection';
import QnASection from '../components/QnASection';
import CTASection from '../components/CTASection';
import SectionBand from '../components/SectionBand';

// A small centered hairline used to give two thematically-grouped sections
// (inside the same SectionBand) a light beat of separation without
// introducing a whole new section between them.
const ChapterDivider = () => (
  <div className="flex justify-center py-1" aria-hidden="true">
    <div className="h-px w-24 sm:w-32 bg-[linear-gradient(90deg,transparent,rgba(79,113,84,0.4),transparent)]" />
  </div>
);

// The page is deliberately grouped into four "chapters" — intro, products &
// credibility, process & proof, decide & act — alternating a plain
// background with a softly tinted SectionBand so each chapter reads as its
// own moment while scrolling, rather than one long undifferentiated stack.
const Landing = () => {
  return (
    <>
      <HeroSection />
      <FeatureGridSection />

      <SectionBand>
        <ProductSection />
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

export default Landing;
