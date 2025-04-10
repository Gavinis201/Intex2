import "./App.css";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import AdminMoviePage from "./pages/AdminMoviePage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PrivacyPage from "./pages/PrivacyPage";
import CreateAccountPage from "./pages/CreateAccountPage";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ContactPage from "./pages/ContactPage";
import FrequentyAsk from "./components/FrequentlyAsk";
import MoviePage from "./pages/MoviePage";
import ThankYouPage from "./components/ThankYouPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RecommendationsPage from "./pages/Recommendations";
import { isAuthenticated } from "./services/authService";
import CookieConsent from "./components/CookieConsent";
import { useState, useEffect } from "react";
import SettingsPage from "./pages/SettingsPage";
import { initializeTheme } from "./services/themeService";

// Component for routes that should only be accessible to non-logged-in users
interface NonAuthRouteProps {
  children: React.ReactNode;
}

const NonAuthRoute = ({ children }: NonAuthRouteProps) => {
  // If user is authenticated, redirect to MoviePage
  if (isAuthenticated()) {
    return <Navigate to="/MoviePage" replace />;
  }
  
  // If not authenticated, show the requested page
  return <>{children}</>;
};

// Component to handle layout based on route
const AppLayout = () => {
  const location = useLocation();
  const [cookieConsent, setCookieConsent] = useState<string | null>(localStorage.getItem('cookieConsent'));
  const [currentTheme, setCurrentTheme] = useState<string>(localStorage.getItem('app_theme') || 'dark');
  const isAuthPage = ['/Login', '/CreateAccount'].includes(location.pathname);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setCurrentTheme(localStorage.getItem('app_theme') || 'dark');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  // Listen for changes to cookie consent in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cookieConsent') {
        setCookieConsent(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check localStorage directly as well
    const checkConsent = () => {
      const currentConsent = localStorage.getItem('cookieConsent');
      if (currentConsent !== cookieConsent) {
        setCookieConsent(currentConsent);
      }
    };
    
    // Poll localStorage every second
    const intervalId = setInterval(checkConsent, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [cookieConsent]);

  return (
    <>
    <div className="d-flex flex-column min-vh-100">
      <main className={!isAuthPage ? 'main-content' : ''}>
      <Header key={`header-${cookieConsent}-${currentTheme}`} />
        <Routes>
          <Route path="/" element={
            <NonAuthRoute>
              <HomePage />
            </NonAuthRoute>
          } />
          <Route path="/Login" element={
            <NonAuthRoute>
              <LoginPage />
            </NonAuthRoute>
          } />
          <Route path="/CreateAccount" element={
            <NonAuthRoute>
              <CreateAccountPage />
            </NonAuthRoute>
          } />
          <Route path="/Privacy" element={<PrivacyPage />} />
          <Route path="/MoviePage" element={<MoviePage />}/>
          <Route path="/Contact" element={<ContactPage />} />
          <Route path="/Recommendation" element={<RecommendationsPage />} />
          <Route path="/Recommendation/:query" element={<RecommendationsPage />} />
          <Route path="/FAQ" element={<FrequentyAsk />} />
          <Route path="/Settings" element={<SettingsPage />} />
          <Route path="/AdminMovies" element={
            <ProtectedRoute adminOnly={true}>
              <AdminMoviePage />
            </ProtectedRoute>
          } />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/ProductDetail" />
        </Routes>
     <Footer />
     <CookieConsent />
      </main>
    </div>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
