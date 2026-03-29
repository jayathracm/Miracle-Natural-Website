// src/hooks/useSEO.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SEO_CONFIG, SITE_URL } from '../seoConfig.js';

export const useSEO = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const route =
      Object.keys(SEO_CONFIG).find(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      ) || '/';

    const { title, description, canonical, keywords } = SEO_CONFIG[route];

    // Title
    document.title = title;

    // Meta: description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Meta: keywords (optional)
    if (keywords && (Array.isArray(keywords) ? keywords.length : true)) {
      const content = Array.isArray(keywords) ? keywords.join(', ') : keywords;
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', content);
    }

    // Canonical
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', `${SITE_URL}${canonical || pathname}`);
  }, [pathname]);
};