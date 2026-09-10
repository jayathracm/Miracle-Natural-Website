import { useEffect } from 'react';
import { SITE_URL } from '@/seoConfig.js';

// Sitewide Organization + WebSite structured data. Same inject/cleanup
// pattern as QnASection's FAQPage schema. This does NOT make Google show
// sitelinks (that's a fully algorithmic call Google makes once a domain has
// enough authority/traffic on its own brand searches — there's no markup or
// setting that requests specific sitelinks). What this DOES do is give
// Google an unambiguous, machine-readable statement that "Miracle Natural"
// is this site's consumer-facing brand under the Leora Wellness company —
// one of the real inputs into how Google's Knowledge Graph and search
// snippets represent the site over time.
const StructuredData = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'Leora Wellness',
          alternateName: ['Miracle Natural', 'Leora Wellness (Pvt) Ltd'],
          url: SITE_URL,
          logo: `${SITE_URL}/miracle-natural-logo.svg`,
          brand: {
            '@type': 'Brand',
            name: 'Miracle Natural',
          },
        },
        {
          '@type': 'WebSite',
          name: 'Miracle Natural',
          alternateName: 'Leora Wellness',
          url: SITE_URL,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/miracle-natural/shop?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
};

export default StructuredData;
