import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Factory, ShieldCheck, Handshake, Phone, Mail, MapPin } from 'lucide-react';
import { Typography } from '../components/ui/Typography';
import aboutPage01Image01 from '../assets/about-us/about_page_01_img_01.png';
import aboutPage01Image02 from '../assets/about-us/about_page_01_img_02.png';
import aboutPage01Image03 from '../assets/about-us/about_page_01_img_03.png';
import aboutPage02Image01 from '../assets/about-us/about_page_02_img_01.png';
import aboutPage02Image02 from '../assets/about-us/about_page_02_img_02.png';
import aboutPage02Image03 from '../assets/about-us/about_page_02_img_03.png';

const About = () => {
  const groupCompanies = [
    {
      name: 'Leora Wellness (Pvt) Ltd',
      role: 'Brand Owner and Personal Care Manufacturer',
      description:
        'Established in December 2025, Leora Wellness was founded as a dedicated personal care manufacturing company, built on a long-standing passion for wellness and self-care products.',
      visualImage: aboutPage02Image03,
      visualLabel: 'Leora Wellness Signature',
      points: [
        'Develops high-quality, innovative personal care products for evolving market needs',
        'Builds and manages the Miracle Natural brand for the everyday consumer',
        'Supported by experienced manufacturing leadership and systems',
      ],
    },
    {
      name: 'Lanka Minerals and Chemicals (Pvt) Ltd (LANMIC)',
      role: 'Parent Company and Manufacturing Backbone',
      description:
        'LANMIC is the parent company behind Leora Wellness, bringing over 25 years of manufacturing experience that supports quality, process consistency, and dependable production scale.',
      visualImage: aboutPage02Image02,
      visualLabel: 'LANMIC and LFO Group Identity',
      points: [
        'Provides the strong manufacturing foundation behind Miracle Natural',
        'Supports production discipline aligned with ISO and GMP-focused operations',
        'Enables long-term product development and market-ready execution',
      ],
    },
  ];

  const highlights = [
    {
      icon: Factory,
      title: 'Built On Manufacturing Strength',
      description:
        'Leora Wellness (Pvt) Ltd was established in December 2025 as a dedicated personal care manufacturing company, backed by over 25 years of experience through Lanka Minerals and Chemicals (Pvt) Ltd.',
    },
    {
      icon: Leaf,
      title: 'Nature-Inspired Formulation',
      description:
        'Miracle Natural combines carefully selected herbal ingredients with modern formulation expertise to create safe, affordable, and results-driven products for everyday users.',
    },
    {
      icon: ShieldCheck,
      title: 'Quality You Can Trust',
      description:
        'Our catalog is built around certified production standards, including ISO and GMP certifications, with a focus on consistent quality and practical effectiveness.',
    },
  ];

  const services = [
    'B2B and contract manufacturing services',
    'Salon and spa bulk products',
    'OEM and private-label product development',
    'Hotel and hospitality care packs',
    'Raw material bulk supply with formulation support',
  ];

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1320px] mx-auto space-y-10 sm:space-y-12 md:space-y-14">
        <section className="rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.96),rgba(247,241,227,0.9))] px-5 py-6 sm:px-7 sm:py-8 md:px-10 md:py-10 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">
            About Us
          </Typography>
          <Typography variant="h2" className="mb-4 text-foreground text-balance">
            Created with purpose. Made for everyday wellness.
          </Typography>
          <Typography variant="p" className="max-w-4xl break-words">
            Miracle Natural is a herbal-based personal care brand developed under Leora Wellness (Pvt) Ltd. Our mission is to make effective,
            nature-inspired products accessible to everyone while maintaining quality, safety, and affordability. The brand is built on the
            manufacturing strength of its parent company, Lanka Minerals and Chemicals (Pvt) Ltd (LANMIC).
          </Typography>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <span className="inline-flex rounded-full border border-[var(--color-border-light)] bg-white/70 px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">
              ISO Certified
            </span>
            <span className="inline-flex rounded-full border border-[var(--color-border-light)] bg-white/70 px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">
              GMP Certified
            </span>
            <span className="inline-flex rounded-full border border-[var(--color-border-light)] bg-white/70 px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">
              25+ Years Manufacturing Foundation
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <figure className="rounded-xl border border-[var(--color-card-border)] bg-white/80 p-3">
              <img src={aboutPage01Image01} alt="Leora Wellness identity logo" className="h-16 w-full object-contain" loading="lazy" />
              <figcaption className="mt-2 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">Leora Wellness Identity</figcaption>
            </figure>
            <figure className="rounded-xl border border-[var(--color-card-border)] bg-white/80 p-3">
              <img src={aboutPage01Image02} alt="Miracle Natural emblem" className="h-16 w-full object-contain" loading="lazy" />
              <figcaption className="mt-2 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">Miracle Natural Emblem</figcaption>
            </figure>
            <figure className="rounded-xl border border-[var(--color-card-border)] bg-white/80 p-3">
              <img src={aboutPage01Image03} alt="Leora Wellness wordmark" className="h-16 w-full object-contain" loading="lazy" />
              <figcaption className="mt-2 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">Leora Wordmark</figcaption>
            </figure>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {groupCompanies.map((company) => (
            <article
              key={company.name}
              className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 md:p-7 shadow-[0_12px_28px_rgba(31,44,35,0.08)]"
            >
              <Typography variant="label" className="mb-2 block text-primary">
                Company Background
              </Typography>
              <Typography variant="h4" className="text-foreground mb-1.5">
                {company.name}
              </Typography>
              <Typography variant="small" className="block mb-3 font-semibold text-text-secondary">
                {company.role}
              </Typography>
              <Typography variant="small" className="block mb-4">
                {company.description}
              </Typography>
              <ul className="space-y-2 text-[0.88rem] sm:text-[0.92rem] text-muted-foreground">
                {company.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <figure className="mt-5 overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-white/80">
                <div className="h-28 sm:h-32 p-2.5">
                  <img
                    src={company.visualImage}
                    alt={`${company.visualLabel} image`}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>
                <figcaption className="border-t border-[var(--color-card-border)] px-3 py-2 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">
                  {company.visualLabel}
                </figcaption>
              </figure>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 shadow-[0_12px_28px_rgba(31,44,35,0.08)]"
            >
              <item.icon className="w-6 h-6 text-primary mb-3" />
              <Typography variant="h4" className="text-foreground mb-2">
                {item.title}
              </Typography>
              <Typography variant="small" className="block">
                {item.description}
              </Typography>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-3 sm:p-4 shadow-[0_12px_28px_rgba(31,44,35,0.08)]">
          <img
            src={aboutPage02Image01}
            alt="Leora Wellness factory and operations site"
            loading="lazy"
            className="w-full h-auto rounded-xl"
          />
          <p className="px-1 pt-3 text-[0.75rem] sm:text-[0.78rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">
            Factory and Operations Site
          </p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8">
          <article className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 md:p-7 shadow-[0_12px_28px_rgba(31,44,35,0.08)]">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 mb-4">
              <Handshake size={14} className="text-primary" />
              <span className="text-[0.76rem] font-semibold tracking-[0.08em] uppercase text-primary">What We Offer</span>
            </div>
            <Typography variant="p" className="mb-4">
              We support both consumers and business partners through flexible product and manufacturing solutions.
            </Typography>
            <ul className="space-y-2.5 text-[0.92rem] sm:text-[0.95rem] text-muted-foreground">
              {services.map((service) => (
                <li key={service} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(170deg,rgba(255,251,242,0.95),rgba(249,243,232,0.9))] p-5 sm:p-6 md:p-7 shadow-[0_14px_30px_rgba(31,44,35,0.1)]">
            <Typography variant="h4" className="text-foreground mb-4">
              Contact and Business Inquiries
            </Typography>
            <div className="space-y-3 text-[0.9rem] sm:text-[0.92rem] text-muted-foreground break-words">
              <p className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 text-primary" />
                <span>Head Office: No. 15A, Kandawala Mawatha, Ratmalana</span>
              </p>
              <p className="flex items-start gap-2.5">
                <Factory size={16} className="mt-0.5 text-primary" />
                <span>Factory: Lot E7, Seethawaka Export Processing Zone, Avissawella</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone size={16} className="text-primary" />
                <a href="tel:+94112636832" className="hover:text-primary transition-colors">+94 11 2636 832</a>
              </p>
              <p className="flex items-start gap-2.5">
                <Phone size={16} className="text-primary" />
                <span className="break-words">WhatsApp: +94 768 501 111 / +94 772 061 111</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail size={16} className="text-primary" />
                <a href="mailto:dinisha@lanmic.com" className="hover:text-primary transition-colors">dinisha@lanmic.com</a>
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href="https://instagram.com/miraclenaturalherbalcare.lk"
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-[var(--color-border-light)] bg-white/75 px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary hover:text-primary transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://web.facebook.com/NHOHHS"
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-[var(--color-border-light)] bg-white/75 px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary hover:text-primary transition-colors"
              >
                Facebook
              </a>
            </div>

            <figure className="mt-5 rounded-xl border border-[var(--color-card-border)] bg-white/75 p-3">
              <img src={aboutPage02Image03} alt="Leora Wellness corporate logo" loading="lazy" className="h-12 w-full object-contain" />
              <figcaption className="mt-2 text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">
                Corporate Identity
              </figcaption>
            </figure>
          </article>
        </section>

        <section className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 md:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Typography variant="h4" className="text-foreground mb-1">
              Explore the full Miracle Natural range
            </Typography>
            <Typography variant="small" className="block">
              Discover our face, hair, body, and treatment collection designed for daily results.
            </Typography>
          </div>
          <Link
            to="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-primary bg-primary text-white text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-forest-800 transition-colors"
          >
            Shop Now
          </Link>
        </section>
      </div>
    </div>
  );
};

export default About;
