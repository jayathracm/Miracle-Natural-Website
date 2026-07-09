import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Briefcase, LayoutDashboard, Mail, Menu, Package, ShieldCheck, User, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import logoIcon from '../assets/branding-from-pdf/miracle-natural-logo-icon-transparent.png';
import logoWordmark from '../assets/branding-from-pdf/miracle-natural-wordmark-transparent.png';
import { cn } from '../lib/utils';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.nav>, <motion.div>)
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const NAV_SECTIONS = [
  { href: '#hero', label: 'Home', id: 'hero' },
  { to: '/ritual-builder', label: 'Ritual Builder', type: 'route' },
  { to: '/about', label: 'About Us', type: 'route' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isSuperAdmin, isCorporatePartner } = useAuth();
  const accountMenuRef = useRef(null);

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
    setIsAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Close the desktop account/admin dropdown on outside click — it's not a
  // full-screen overlay like the mobile menu, so it needs its own listener.
  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAccountMenuOpen]);

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
          "flex justify-between items-center px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl border transition-all duration-300",
          scrolled ? "bg-[rgba(255,251,242,0.94)] border-[var(--color-border-medium)] shadow-[0_12px_25px_rgba(31,44,35,0.1)]" : "bg-[rgba(255,251,242,0.76)] border-[var(--color-border-light)]"
        )}>
        {/* Logo */}
        <Link
          to={location.pathname === '/' ? '#hero' : '/'}
          aria-label="Miracle Natural Home"
          className="relative z-50 flex items-center flex-shrink-0"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src={logoIcon}
              alt=""
              aria-hidden="true"
              className={cn(
                "w-auto object-contain transition-all duration-300",
                scrolled ? "h-8 sm:h-9" : "h-9 sm:h-10"
              )}
            />
            <img
              src={logoWordmark}
              alt="Miracle Natural"
              className={cn(
                "w-auto max-w-[220px] sm:max-w-[280px] object-contain transition-all duration-300",
                scrolled ? "h-8 sm:h-9" : "h-9 sm:h-10"
              )}
            />
          </div>
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

          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isAccountMenuOpen}
              aria-label={user ? 'Account menu' : 'Account menu — sign in'}
              className={cn(
                "h-9 w-9 xl:h-10 xl:w-10 rounded-lg border inline-flex items-center justify-center transition-colors",
                isAccountMenuOpen
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-[var(--color-border-medium)] text-foreground hover:bg-[var(--color-hover-overlay)]"
              )}
            >
              <Menu size={18} />
            </button>

            <AnimatePresence>
              {isAccountMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--color-border-medium)] bg-[rgba(255,251,242,0.98)] shadow-[0_18px_40px_rgba(31,44,35,0.16)] backdrop-blur-sm py-1.5 z-50"
                >
                  <Link
                    to="/account"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-[0.76rem] font-semibold tracking-[0.04em] uppercase text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                  >
                    <User size={14} />
                    {user ? 'My Account' : 'Sign In'}
                  </Link>

                  {!isAdmin && !isCorporatePartner && (
                    <Link
                      to="/corporate-partner"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-[0.76rem] font-semibold tracking-[0.04em] uppercase text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                    >
                      <Briefcase size={14} />
                      Business Account
                    </Link>
                  )}

                  {isAdmin && (
                    <>
                      <div className="my-1.5 border-t border-[var(--color-border-light)]" />
                      <Link
                        to="/admin/orders"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[0.76rem] font-semibold tracking-[0.04em] uppercase text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                      >
                        <LayoutDashboard size={14} />
                        Admin: Orders
                      </Link>
                      <Link
                        to="/admin/products"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[0.76rem] font-semibold tracking-[0.04em] uppercase text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                      >
                        <Package size={14} />
                        Admin: Products
                      </Link>
                      <Link
                        to="/admin/messages"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[0.76rem] font-semibold tracking-[0.04em] uppercase text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                      >
                        <Mail size={14} />
                        Admin: Messages
                      </Link>
                      <Link
                        to="/admin/corporate-partners"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[0.76rem] font-semibold tracking-[0.04em] uppercase text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                      >
                        <Briefcase size={14} />
                        Admin: Partners
                      </Link>
                      {isSuperAdmin && (
                        <Link
                          to="/admin/accounts"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-[0.76rem] font-semibold tracking-[0.04em] uppercase text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                        >
                          <ShieldCheck size={14} />
                          Admin: Accounts
                        </Link>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                  to="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full rounded-lg border border-[var(--color-border-light)] bg-white/70 px-4 py-3 text-[0.95rem] font-sans font-semibold tracking-[0.08em] uppercase text-foreground text-left inline-flex items-center gap-2"
                >
                  <User size={18} />
                  {user ? 'My Account' : 'Sign In'}
                </Link>
                {!isAdmin && !isCorporatePartner && (
                  <Link
                    to="/corporate-partner"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full rounded-lg border border-[var(--color-border-light)] bg-white/70 px-4 py-3 text-[0.95rem] font-sans font-semibold tracking-[0.08em] uppercase text-foreground text-left inline-flex items-center gap-2"
                  >
                    <Briefcase size={18} />
                    Business Account
                  </Link>
                )}
                {isAdmin && (
                  <>
                    <Link
                      to="/admin/orders"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full rounded-lg border border-[var(--color-border-light)] bg-white/70 px-4 py-3 text-[0.95rem] font-sans font-semibold tracking-[0.08em] uppercase text-foreground text-left inline-flex items-center gap-2"
                    >
                      <LayoutDashboard size={18} />
                      Admin: Orders
                    </Link>
                    <Link
                      to="/admin/products"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full rounded-lg border border-[var(--color-border-light)] bg-white/70 px-4 py-3 text-[0.95rem] font-sans font-semibold tracking-[0.08em] uppercase text-foreground text-left inline-flex items-center gap-2"
                    >
                      <Package size={18} />
                      Admin: Products
                    </Link>
                    <Link
                      to="/admin/messages"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full rounded-lg border border-[var(--color-border-light)] bg-white/70 px-4 py-3 text-[0.95rem] font-sans font-semibold tracking-[0.08em] uppercase text-foreground text-left inline-flex items-center gap-2"
                    >
                      <Mail size={18} />
                      Admin: Messages
                    </Link>
                    <Link
                      to="/admin/corporate-partners"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full rounded-lg border border-[var(--color-border-light)] bg-white/70 px-4 py-3 text-[0.95rem] font-sans font-semibold tracking-[0.08em] uppercase text-foreground text-left inline-flex items-center gap-2"
                    >
                      <Briefcase size={18} />
                      Admin: Partners
                    </Link>
                    {isSuperAdmin && (
                      <Link
                        to="/admin/accounts"
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full rounded-lg border border-[var(--color-border-light)] bg-white/70 px-4 py-3 text-[0.95rem] font-sans font-semibold tracking-[0.08em] uppercase text-foreground text-left inline-flex items-center gap-2"
                      >
                        <ShieldCheck size={18} />
                        Admin: Accounts
                      </Link>
                    )}
                  </>
                )}
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
