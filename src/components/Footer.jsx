import React from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="pt-12 sm:pt-14 md:pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t" style={{ 
      backgroundColor: 'var(--color-footer-bg)', 
      color: 'var(--color-footer-text)',
      borderColor: 'var(--color-footer-border)'
    }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-8 sm:mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <p className="text-3xl font-display mb-4 text-[var(--color-footer-text)]">Miracle Natural</p>
            <p className="text-[0.98rem] sm:text-[1rem] md:text-[1.02rem] mb-4 sm:mb-5 leading-relaxed max-w-md" style={{ color: 'var(--color-footer-text-muted)' }}>
              Miracle Natural by Leora Wellness (Pvt) Ltd. For retail, bulk inquiries, and OEM partnerships, contact our team directly.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#" aria-label="Facebook" className="transition-colors duration-200" style={{ color: 'var(--color-footer-text-muted)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}>
                <Facebook size={18} />
              </a>
              <a href="#" aria-label="Instagram" className="transition-colors duration-200" style={{ color: 'var(--color-footer-text-muted)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}>
                <Instagram size={18} />
              </a>
              <a href="#" aria-label="Twitter" className="transition-colors duration-200" style={{ color: 'var(--color-footer-text-muted)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}>
                <Twitter size={18} />
              </a>
              <a href="#" aria-label="YouTube" className="transition-colors duration-200" style={{ color: 'var(--color-footer-text-muted)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}>
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="font-sans font-bold tracking-[0.12em] uppercase mb-4 text-[0.75rem]" style={{ color: 'var(--color-footer-text)' }}>Explore</p>
            <ul className="space-y-2" style={{ color: 'var(--color-footer-text-muted)' }}>
              <li>
                <a
                  href="#hero"
                  className="transition-colors duration-200 hover:opacity-100"
                  style={{ color: 'inherit' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="transition-colors duration-200"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}
                >
                  Benefits
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="transition-colors duration-200"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}
                >
                  Ritual Steps
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="transition-colors duration-200"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}
                >
                  Reviews
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  className="transition-colors duration-200"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}
                >
                  Shop Bundles
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="font-sans font-bold tracking-[0.12em] uppercase mb-4 text-[0.75rem]" style={{ color: 'var(--color-footer-text)' }}>Contact</p>
            <ul className="space-y-3" style={{ color: 'var(--color-footer-text-muted)' }}>
              <li className="flex items-start gap-3">
                <Phone size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-footer-text)' }} />
                <a
                  href="tel:+94112636832"
                  className="transition-colors duration-200 break-words"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}
                >
                  +94 112 636 832
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-footer-text)' }} />
                <span className="break-words">WhatsApp: +94 768 502 222 / +94 76 838 6699</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-footer-text)' }} />
                <a
                  href="mailto:dinisha@lanmic.com"
                  className="transition-colors duration-200 break-words"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}
                >
                  dinisha@lanmic.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-footer-text)' }} />
                <span className="break-words">No. 15A, Kandawala Mawatha, Ratmalana</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-footer-text)' }} />
                <span className="break-words">Factory: Lot E7, Seethawaka Export Processing Zone, Avissawella</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t pt-6 mb-6" style={{ borderColor: 'var(--color-footer-border)' }}>
          <div className="flex flex-wrap justify-center gap-6 text-[0.82rem] sm:text-[0.86rem] tracking-[0.08em] uppercase" style={{ color: 'var(--color-footer-text-muted)' }}>
            <a
              href="/privacy-policy"
              className="transition-colors duration-200"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}
            >
              Privacy Policy
            </a>
            <a
              href="/return-policy"
              className="transition-colors duration-200"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}
            >
              Return Policy
            </a>
            <a
              href="/terms-and-conditions"
              className="transition-colors duration-200"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-footer-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-footer-text-muted)'}
            >
              Terms & Conditions
            </a>
          </div>
        </div>

        <div className="text-center text-[0.8rem] sm:text-[0.82rem] tracking-[0.06em] uppercase" style={{ color: 'var(--color-footer-text-muted)' }}>
          <p>&copy; 2026 Miracle Natural. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
