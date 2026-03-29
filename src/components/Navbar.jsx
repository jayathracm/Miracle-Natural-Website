import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import logoImage from '/miracle-natural-logo.svg';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_SECTIONS = [
  { href: '#hero', label: 'Home', id: 'hero' },
  { href: '#product', label: 'Collections', id: 'product' },
  { href: '#testimonials', label: 'Reviews', id: 'testimonials' },
  { to: '/about', label: 'About Us', type: 'route' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Optimized scroll handler - only updates when crossing threshold
  const handleScroll = useCallback(() => {
    const shouldBeScrolled = window.scrollY > 50;
    if (shouldBeScrolled !== scrolled) {
      setScrolled(shouldBeScrolled);
    }
  }, [scrolled]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "fixed w-full top-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-3 sm:py-4"
      )}
      style={scrolled ? { 
        backgroundColor: 'rgba(247, 241, 227, 0.78)'
      } : {
        backgroundColor: 'transparent'
      }}
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <div className={cn(
          "flex justify-between items-center px-4 sm:px-5 py-2.5 rounded-xl border transition-all duration-300",
          scrolled ? "bg-[rgba(255,251,242,0.94)] border-[var(--color-border-medium)] shadow-[0_12px_25px_rgba(31,44,35,0.1)]" : "bg-[rgba(255,251,242,0.76)] border-[var(--color-border-light)]"
        )}>
        {/* Logo */}
        <Link to={location.pathname === '/' ? '#hero' : '/'} className="relative z-50 flex-shrink-0">
          <img 
            src={logoImage} 
            alt="Miracle Natural" 
            width="220" 
            height="76"
            className={cn("w-auto transition-all duration-300", scrolled ? "h-9 sm:h-10 md:h-11 lg:h-12" : "h-10 sm:h-11 md:h-12 lg:h-14 xl:h-16")} 
          />
        </Link>

        {/* Desktop Menu - Only show on lg+ (1024px) */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {NAV_SECTIONS.map((link) => {
            const isOnHomePage = location.pathname === '/';

            if (link.type === 'route') {
              return (
                <Link key={link.to} to={link.to} className="text-[0.78rem] xl:text-[0.8rem] font-semibold tracking-[0.1em] uppercase text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              );
            } else {
              if (isOnHomePage) {
                return (
                  <a key={link.href} href={link.href} className="text-[0.78rem] xl:text-[0.8rem] font-semibold tracking-[0.1em] uppercase text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </a>
                );
              } else {
                return (
                  <Link key={link.href} to={`/${link.href}`} className="text-[0.78rem] xl:text-[0.8rem] font-semibold tracking-[0.1em] uppercase text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                );
              }
            }
          })}

          <Link to="/shop" className="px-4 py-2 rounded-lg border border-primary bg-primary text-white text-[0.76rem] xl:text-[0.8rem] font-semibold tracking-[0.1em] uppercase hover:bg-forest-800 transition-colors">
            Shop Now
          </Link>
        </div>

        {/* Hamburger Menu - Show on all sizes below 1024px */}
        <button 
          className="lg:hidden z-50 text-foreground p-1.5 -mr-1" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Overlay - Show on lg and below */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-40 bg-[rgba(247,241,227,0.98)] backdrop-blur-sm pt-24 px-6 pb-8 overflow-y-auto lg:hidden"
            >
              <div className="mx-auto w-full max-w-sm flex flex-col items-stretch gap-3">
                {NAV_SECTIONS.map((link) => {
                  const isOnHomePage = location.pathname === '/';

                  if (link.type === 'route') {
                    return (
                      <Link key={link.to} to={link.to} onClick={() => setIsMenuOpen(false)} className="w-full rounded-lg border border-[var(--color-border-light)] bg-white/70 px-4 py-3 text-[0.95rem] font-sans font-semibold tracking-[0.08em] uppercase text-foreground text-left">
                        {link.label}
                      </Link>
                    );
                  } else {
                    if (isOnHomePage) {
                      return (
                        <a key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="w-full rounded-lg border border-[var(--color-border-light)] bg-white/70 px-4 py-3 text-[0.95rem] font-sans font-semibold tracking-[0.08em] uppercase text-foreground text-left">
                          {link.label}
                        </a>
                      );
                    } else {
                      return (
                        <Link key={link.href} to={`/${link.href}`} onClick={() => setIsMenuOpen(false)} className="w-full rounded-lg border border-[var(--color-border-light)] bg-white/70 px-4 py-3 text-[0.95rem] font-sans font-semibold tracking-[0.08em] uppercase text-foreground text-left">
                          {link.label}
                        </Link>
                      );
                    }
                  }
                })}
                <Link
                  to="/shop"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full px-6 py-3 rounded-lg bg-primary text-white text-[0.9rem] font-sans font-semibold tracking-[0.1em] uppercase text-center"
                >
                  Shop Now
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
