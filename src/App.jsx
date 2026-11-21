import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { CartProvider } from '@/lib/cart';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import AdminGuard from '@/components/layout/AdminGuard';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Onboarding from '@/pages/Onboarding';
import ClientShell from '@/components/client/ClientShell';
import Marche from '@/pages/Marche';
import Panier from '@/pages/Panier';
import ProductReviewsPage from '@/pages/ProductReviewsPage';
import MesCommandes from '@/pages/MesCommandes';
import HistoriqueCommandes from '@/pages/HistoriqueCommandes';
import ClientDashboard from '@/pages/ClientDashboard';
import Support from '@/pages/Support';
import Faq from '@/pages/Faq';
import MentionsLegales from '@/pages/MentionsLegales';
import SellerDashboard from '@/pages/SellerDashboard';
import SellerProducts from '@/pages/SellerProducts';
import SellerOrders from '@/pages/SellerOrders';
import SellerSettings from '@/pages/SellerSettings';
import AdminUsers from '@/pages/AdminUsers';
import AdminCategories from '@/pages/AdminCategories';
import Boutique from '@/pages/Boutique';
import Vendre from '@/pages/Vendre';
import OAuthConsent from '@/pages/OAuthConsent';
import Documentation from '@/pages/Documentation';
import PaiementRetour from '@/pages/PaiementRetour';
import Mfa from '@/pages/Mfa';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/vendre" element={<Vendre />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route path="/mfa" element={<Mfa />} />

      <Route
        element={
          <ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />
        }
      >
        <Route path="/bienvenue" element={<Onboarding />} />

        <Route element={<ClientShell />}>
          <Route path="/espace-client" element={<Marche />} />
          <Route path="/panier" element={<Panier />} />
          <Route path="/paiement/retour" element={<PaiementRetour />} />
          <Route path="/produits/:productId/avis" element={<ProductReviewsPage />} />
          <Route path="/boutique/:vendorId" element={<Boutique />} />
          <Route path="/mes-commandes" element={<MesCommandes />} />
          <Route path="/historique-commandes" element={<HistoriqueCommandes />} />
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/support" element={<Support />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
        </Route>

        <Route element={<AppShell />}>
          <Route path="/vendeur" element={<SellerDashboard />} />
          <Route path="/vendeur/produits" element={<SellerProducts />} />
          <Route path="/vendeur/commandes" element={<SellerOrders />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/parametres" element={<SellerSettings />} />

          <Route element={<AdminGuard />}>
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/utilisateurs" element={<AdminUsers />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <CartProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App