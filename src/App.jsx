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
  const { pathname } = useLocation();
  useEffect(() => {
    // Use instant scroll on mobile, smooth on desktop
    const isMobile = window.innerWidth < 1024;
    
    if (isMobile) {
      // Instant scroll on mobile for better performance
      window.scrollTo(0, 0);
    } else {
      // Smooth scroll on desktop
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);
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
