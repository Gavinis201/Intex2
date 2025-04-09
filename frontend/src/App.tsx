import "./App.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
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
<<<<<<< HEAD
import CookieConsent from "./components/CookieConsent";
=======
import ThankYouPage from "./components/ThankYouPage";
>>>>>>> dccfc8bc6070ee2c1d743e04b155cbb2b15b3765

// Component to handle layout based on route
const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = ['/Login', '/CreateAccount'].includes(location.pathname);

  return (
    <>
    <div className="d-flex flex-column min-vh-100">
      <main className={!isAuthPage ? 'main-content' : ''}>
      <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Login" element={<LoginPage />} />
          <Route path="/CreateAccount" element={<CreateAccountPage />} />
          <Route path="/Privacy" element={<PrivacyPage />} />
          <Route path="/MoviePage" element={<MoviePage />} />
          <Route path="/Contact" element={<ContactPage />} />
          <Route path="/FAQ" element={<FrequentyAsk />} />
          <Route path="/AdminMovies" element={<AdminMoviePage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/ProductDetail" />
        </Routes>
     <Footer />
      </main>
    </div>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
      <CookieConsent />
    </Router>

  );
}

export default App;
