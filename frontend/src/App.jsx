import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ViewModeProvider } from './context/ViewModeContext';
import { LanguageProvider } from './context/LanguageContext';

// Components
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import TelegramSupportButton from './components/TelegramSupportButton';
import MobileBottomNav from './components/MobileBottomNav';

// Pages
import HomePage from './pages/HomePage';
import StorePage from './pages/StorePage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AboutPage from './pages/AboutPage';
import HowToBuyPage from './pages/HowToBuyPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import AccountPage from './pages/AccountPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import UserSellerChatPage from './pages/UserSellerChatPage';
import UserAdminChatPage from './pages/UserAdminChatPage';
import SellerAdminChatPage from './pages/SellerAdminChatPage';
import SellerCustomerInboxPage from './pages/SellerCustomerInboxPage';
import UnifiedChatPage from './pages/UnifiedChatPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import ProductsManage from './pages/admin/ProductsManage';
import StockManage from './pages/admin/StockManage';
import CategoriesManage from './pages/admin/CategoriesManage';
import OrdersManage from './pages/admin/OrdersManage';
import AdminChatPage from './pages/admin/AdminChatPage';
import DeviceMonitoringPage from './pages/admin/DeviceMonitoringPage';
import SellersManage from './pages/admin/SellersManage';
import UsersManage from './pages/admin/UsersManage';
import PaymentsManage from './pages/admin/PaymentsManage';
import WithdrawalsManage from './pages/admin/WithdrawalsManage';
import DisputesManage from './pages/admin/DisputesManage';
import PromotionsManage from './pages/admin/PromotionsManage';
import ReportsManage from './pages/admin/ReportsManage';
import NotificationsManage from './pages/admin/NotificationsManage';
import SettingsManage from './pages/admin/SettingsManage';

// Seller Pages
import SellerOnboardingPage from './pages/SellerOnboardingPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import PublicSellerStorePage from './pages/PublicSellerStorePage';
import SellerProfilePage from './pages/SellerProfilePage';
import MinkuSupportWidget from './components/MinkuSupportWidget';

/** Wrapper that hides public chrome for admin routes */
const AppShell = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isSellerPortal = location.pathname.startsWith('/seller');
  const isStandalonePortal = isAdmin || isSellerPortal;

  return (
    <div style={isStandalonePortal ? {} : { display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: isStandalonePortal ? '#1a1f3a' : 'var(--card-bg)',
            color: isStandalonePortal ? '#E2E8F0' : 'var(--text)',
            border: '1px solid var(--border)',
            fontWeight: 700,
            fontSize: '0.85rem'
          },
        }}
      />

      {!isStandalonePortal && <AnnouncementBar />}
      {!isStandalonePortal && <Navbar />}

      <main style={isStandalonePortal ? {} : { flex: 1 }}>
        {children}
      </main>

      {!isStandalonePortal && (
        <>
          <Footer />
          <MobileBottomNav />
        </>
      )}

      {/* Minku Floating AI Support (available for all Users & Sellers matching video) */}
      {!isAdmin && <MinkuSupportWidget />}
    </div>
  );
};

/** Global font style: Chakra Petch (Exact Square/Angular English from screenshot) for Latin, Simple Battambang for Khmer */
const GlobalFontStyle = () => (
  <style>{`
    html, body, .font-body {
      font-family: 'Chakra Petch', 'Plus Jakarta Sans', 'Inter', 'Battambang', 'Khmer OS Battambang', sans-serif;
    }
    html[lang="km"] body,
    html[lang="km"] .font-body {
      font-family: 'Chakra Petch', 'Plus Jakarta Sans', 'Inter', 'Battambang', 'Khmer OS Battambang', sans-serif;
    }
    html[lang="en"] body,
    html[lang="en"] .font-body {
      font-family: 'Chakra Petch', 'Plus Jakarta Sans', 'Inter', sans-serif;
    }
    /* English text displays in square Chakra Petch font; Khmer text falls back to standard simple Battambang */
    html[lang="km"] p,
    html[lang="km"] span,
    html[lang="km"] div,
    html[lang="km"] td,
    html[lang="km"] th,
    html[lang="km"] label,
    html[lang="km"] li,
    html[lang="km"] h1,
    html[lang="km"] h2,
    html[lang="km"] h3,
    html[lang="km"] h4,
    html[lang="km"] h5,
    html[lang="km"] h6,
    html[lang="km"] button,
    html[lang="km"] input,
    html[lang="km"] textarea,
    html[lang="km"] select,
    html[lang="km"] a {
      font-family: 'Chakra Petch', 'Plus Jakarta Sans', 'Inter', 'Battambang', 'Khmer OS Battambang', sans-serif;
      line-height: 1.65;
    }
    html[lang="en"] p,
    html[lang="en"] span,
    html[lang="en"] div,
    html[lang="en"] td,
    html[lang="en"] th,
    html[lang="en"] label,
    html[lang="en"] li,
    html[lang="en"] h1,
    html[lang="en"] h2,
    html[lang="en"] h3,
    html[lang="en"] h4,
    html[lang="en"] h5,
    html[lang="en"] h6,
    html[lang="en"] button,
    html[lang="en"] input,
    html[lang="en"] textarea,
    html[lang="en"] select,
    html[lang="en"] a {
      font-family: 'Chakra Petch', 'Plus Jakarta Sans', 'Inter', sans-serif;
      line-height: 1.5;
    }
  `}</style>
);

/** ScrollToTop component: Ensures page view starts at top (0,0) on route change */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

/**
 * TabInactivityReloader Component
 * • Supports both Mobile (iOS/Android/Telegram WebView) and Computer (Desktop Browsers).
 * • Listens for visibilitychange, pagehide/pageshow, and blur/focus events.
 * • If inactive/hidden for >= 4 minutes (240,000 ms), reloads softly upon returning (without resetting session/cart).
 */
const TabInactivityReloader = () => {
  const hiddenTimeRef = React.useRef(null);
  const RELOAD_THRESHOLD_MS = 4 * 60 * 1000; // 4 minutes (240,000 ms)

  React.useEffect(() => {
    const handleLeave = () => {
      if (!hiddenTimeRef.current) {
        hiddenTimeRef.current = Date.now();
      }
    };

    const handleReturn = () => {
      if (hiddenTimeRef.current) {
        const timeAway = Date.now() - hiddenTimeRef.current;
        hiddenTimeRef.current = null;
        if (timeAway >= RELOAD_THRESHOLD_MS) {
          const path = window.location.pathname;
          // Never reload if user is actively on checkout to prevent interrupting payment
          if (!path.startsWith('/checkout')) {
            window.location.reload();
          }
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleLeave();
      } else if (document.visibilityState === 'visible') {
        handleReturn();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleLeave);
    window.addEventListener('pageshow', handleReturn);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleLeave);
      window.removeEventListener('pageshow', handleReturn);
    };
  }, []);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <TabInactivityReloader />
      <LanguageProvider>
        <GlobalFontStyle />
        <AuthProvider>
          <CartProvider>
            <ViewModeProvider>
              <AppShell>
              <Routes>
                {/* Public Routes */}
                <Route path="/"         element={<HomePage />} />
                <Route path="/store"    element={<StorePage />} />
                <Route path="/product"  element={<Navigate to="/store" replace />} />
                <Route path="/products" element={<Navigate to="/store" replace />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/about"       element={<AboutPage />} />
                <Route path="/how-to-buy"  element={<HowToBuyPage />} />
                <Route path="/contact"     element={<ContactPage />} />
                <Route path="/privacy"  element={<PrivacyPage />} />
                <Route path="/terms"    element={<TermsPage />} />
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Protected Routes (User) */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/checkout"     element={<CheckoutPage />} />
                  <Route path="/orders"       element={<OrdersPage />} />
                  <Route path="/orders/:id"   element={<OrderDetailPage />} />
                  <Route path="/account"      element={<AccountPage />} />
                  <Route path="/profile"      element={<Navigate to="/account" replace />} />
                  {/* Master ONE ACCOUNT Unified Chat Routes */}
                  <Route path="/chat"                  element={<UnifiedChatPage />} />
                  <Route path="/chat/user-seller"      element={<UnifiedChatPage initialMode="USER" initialTab="STORE" />} />
                  <Route path="/chat/user-admin"       element={<UnifiedChatPage initialMode="USER" initialTab="SUPPORT" />} />
                  <Route path="/chat/seller-admin"     element={<UnifiedChatPage initialMode="SELLER" initialTab="SUPPORT" />} />
                  <Route path="/chat/seller-customers" element={<UnifiedChatPage initialMode="SELLER" initialTab="CUSTOMERS" />} />
                  {/* Legacy chat routes — redirect to master UnifiedChatPage */}
                  <Route path="/chats"        element={<UnifiedChatPage />} />
                  <Route path="/seller"           element={<SellerDashboardPage />} />
                  <Route path="/seller-dashboard" element={<SellerDashboardPage />} />
                </Route>

                {/* Seller Onboarding — protected but open to all roles */}
                <Route path="/seller/onboard" element={<SellerOnboardingPage />} />

                {/* Public Seller Store — no auth required */}
                <Route path="/store/:sellerId" element={<PublicSellerStorePage />} />
                <Route path="/seller/profile/:sellerId" element={<SellerProfilePage />} />

                {/* Wildcard Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />

                {/* Protected Routes (Admin) — full-screen, no public Navbar/Footer */}
                <Route element={<ProtectedRoute requireAdmin={true} />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index                        element={<DashboardPage />} />
                    <Route path="products"              element={<ProductsManage />} />
                    <Route path="products/:id/stock"    element={<StockManage />} />
                    <Route path="categories"            element={<CategoriesManage />} />
                    <Route path="orders"                element={<OrdersManage />} />
                    <Route path="chats"                 element={<AdminChatPage />} />
                    <Route path="chat"                  element={<AdminChatPage />} />
                    <Route path="devices"               element={<DeviceMonitoringPage />} />
                    <Route path="sellers"               element={<SellersManage />} />
                    <Route path="users"                 element={<UsersManage />} />
                    <Route path="payments"              element={<PaymentsManage />} />
                    <Route path="withdrawals"           element={<WithdrawalsManage />} />
                    <Route path="disputes"              element={<DisputesManage />} />
                    <Route path="promotions"            element={<PromotionsManage />} />
                    <Route path="reports"               element={<ReportsManage />} />
                    <Route path="notifications"         element={<NotificationsManage />} />
                    <Route path="settings"              element={<SettingsManage />} />
                  </Route>
                </Route>
              </Routes>
              </AppShell>
            </ViewModeProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
