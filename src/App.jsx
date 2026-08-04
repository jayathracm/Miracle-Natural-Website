import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router';
import Navbar from '@/shared/layout/Navbar';
import Footer from '@/shared/layout/Footer';
import ErrorBoundary from '@/shared/ErrorBoundary';
import NotFound from '@/shared/NotFound';
import MainLayout from '@/shared/layout/MainLayout';
import ScrollProgressBar from '@/shared/layout/ScrollProgressBar';
import ChatWidget from '@/features/chat/ChatWidget';
import { Landing, MiracleNatural, Laira, About, Pricing, Shop, ProductDetail, RitualBuilder, CorporatePartnerApply, Login, Signup, Account, ReturnPolicy, PrivacyPolicy, TermsAndConditions } from '@/routes';
import AdminOrders from '@/features/orders/admin/AdminOrders';
import AdminMessages from '@/features/messages/admin/AdminMessages';
import AdminProducts from '@/features/shop/admin/AdminProducts';
import AdminCorporatePartners from '@/features/b2b/admin/AdminCorporatePartners';
import AdminDiscountTiers from '@/features/b2b/admin/AdminDiscountTiers';
import AdminQuotations from '@/features/quotations/admin/AdminQuotations';
import AdminInventory from '@/features/inventory/admin/AdminInventory';
import AdminAnalytics from '@/features/analytics/admin/AdminAnalytics';
import AdminAccounts from '@/features/superadmin/admin/AdminAccounts';
import RequireAdmin from '@/shared/guards/RequireAdmin';
import RequireSuperAdmin from '@/shared/guards/RequireSuperAdmin';
import { useSEO } from '@/shared/hooks/useSEO';
import { AuthProvider } from '@/features/auth/AuthContext';
import { CartProvider } from '@/features/shop/CartContext';

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

// The shop used to live at the site root (/shop, /shop/:productId) back when
// there was only one storefront. Now that Miracle Natural, Laira, and Leora
// Wellness each have their own shop under /:brandSlug/shop, old bookmarks/
// links to the bare /shop paths redirect to Miracle Natural's — the only
// brand with real products today — rather than 404ing outright.
const RedirectLegacyShopProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    navigate(`/miracle-natural/shop/${productId}`, { replace: true });
  }, [navigate, productId]);
  return null;
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <Router>
            <SEOEffect />
            <ScrollToTop />
            <ScrollProgressBar />
            <ChatWidget />
            <MainLayout>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                  <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/miracle-natural" element={<MiracleNatural />} />
                  <Route path="/laira" element={<Laira />} />
                  <Route path="/about" element={<About />} />

                  <Route path="/:brandSlug/shop" element={<Shop />} />
                  <Route path="/:brandSlug/shop/:productId" element={<ProductDetail />} />
                  <Route path="/shop" element={<Redirect to="/miracle-natural/shop" />} />
                  <Route path="/shop/:productId" element={<RedirectLegacyShopProduct />} />
                  <Route path="/ritual-builder" element={<RitualBuilder />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/corporate-partner" element={<CorporatePartnerApply />} />

                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/account" element={<Account />} />

                  <Route
                    path="/admin/orders"
                    element={(
                      <RequireAdmin>
                        <AdminOrders />
                      </RequireAdmin>
                    )}
                  />

                  <Route
                    path="/admin/messages"
                    element={(
                      <RequireAdmin>
                        <AdminMessages />
                      </RequireAdmin>
                    )}
                  />

                  <Route
                    path="/admin/products"
                    element={(
                      <RequireAdmin>
                        <AdminProducts />
                      </RequireAdmin>
                    )}
                  />

                  <Route
                    path="/admin/corporate-partners"
                    element={(
                      <RequireAdmin>
                        <AdminCorporatePartners />
                      </RequireAdmin>
                    )}
                  />

                  <Route
                    path="/admin/discount-tiers"
                    element={(
                      <RequireAdmin>
                        <AdminDiscountTiers />
                      </RequireAdmin>
                    )}
                  />

                  <Route
                    path="/admin/quotations"
                    element={(
                      <RequireAdmin>
                        <AdminQuotations />
                      </RequireAdmin>
                    )}
                  />

                  <Route
                    path="/admin/inventory"
                    element={(
                      <RequireAdmin>
                        <AdminInventory />
                      </RequireAdmin>
                    )}
                  />

                  <Route
                    path="/admin/analytics"
                    element={(
                      <RequireAdmin>
                        <AdminAnalytics />
                      </RequireAdmin>
                    )}
                  />

                  <Route
                    path="/admin/accounts"
                    element={(
                      <RequireSuperAdmin>
                        <AdminAccounts />
                      </RequireSuperAdmin>
                    )}
                  />

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
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
