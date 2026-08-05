// MainLayout owns the Lenis smooth-scroll instance (desktop only — mobile/
// touch devices skip Lenis entirely and use native scrolling). Lenis persists
// across route changes since MainLayout wraps <Routes> and never remounts,
// which means it keeps its own internal "target scroll" state independent of
// the browser's native scroll position.
//
// Anything that needs to move the page (e.g. ScrollToTop in App.jsx) has to
// go through Lenis when it's active, not window.scrollTo(). If you call
// window.scrollTo() directly, the native scroll position jumps immediately,
// but on Lenis's next animation-frame tick it reasserts ITS OWN stale target
// (wherever the user last scrolled to on the previous page), snapping the
// page back to what looks like a random position. This tiny singleton lets
// MainLayout publish its Lenis instance so other components can call
// lenis.scrollTo(...) instead of fighting it.
let current = null;

export function setLenisInstance(instance) {
  current = instance;
}

export function getLenisInstance() {
  return current;
}
