// MainLayout owns the Lenis smooth-scroll instance (desktop only). Lets
// other code (like ScrollToTop) call lenis.scrollTo() instead of
// window.scrollTo(), which Lenis would just override next frame.
let current = null;

export function setLenisInstance(instance) {
  current = instance;
}

export function getLenisInstance() {
  return current;
}
