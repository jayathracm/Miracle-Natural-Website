import React, { useEffect } from 'react';
import {
  Navbar,
  Footer,
  ErrorBoundary,
  NotFound,
} from './components';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { Landing, About, Pricing, Shop, ReturnPolicy, PrivacyPolicy, TermsAndConditions } from './pages';
import { useSEO } from './hooks/useSEO';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const elementId = hash.replace('#', '');
      const targetElement = document.getElementById(elementId);

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      // If the section is not mounted yet, try once after paint.
      window.requestAnimationFrame(() => {
        const delayedTarget = document.getElementById(elementId);
        if (delayedTarget) {
          delayedTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

function SEOEffect() {
  useSEO();
  return null;
}

const Redirect = ({ to }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);
  return null;
};

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <SEOEffect />
        <ScrollToTop />
        <MainLayout>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/about" element={<About />} />

                <Route path="/shop" element={<Shop />} />
                <Route path="/pricing" element={<Pricing />} />

                <Route path="/return-policy" element={<ReturnPolicy />} />
                <Route path="/return" element={<Redirect to="/return-policy" />} />
                <Route path="/returns" element={<Redirect to="/return-policy" />} />
                <Route path="/returnpolicy" element={<Redirect to="/return-policy" />} />

                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/privacy" element={<Redirect to="/privacy-policy" />} />
                <Route path="/privacypolicy" element={<Redirect to="/privacy-policy" />} />

                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/terms" element={<Redirect to="/terms-and-conditions" />} />
                <Route path="/conditions" element={<Redirect to="/terms-and-conditions" />} />
                <Route path="/termsandconditions" element={<Redirect to="/terms-and-conditions" />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </MainLayout>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
