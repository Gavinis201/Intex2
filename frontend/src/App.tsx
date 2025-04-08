
import "./App.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import AdminMoviePage from "./pages/AdminMoviePage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PrivacyPage from "./pages/PrivacyPage";
import CreateAccountPage from "./components/CreateAccount";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ContactPage from "./pages/ContactPage";
import FrequentyAsk from "./components/FrequentlyAsk";

// Component to handle layout based on route
const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = ['/Login', '/CreateAccount'].includes(location.pathname);

  return (
    <>
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className={!isAuthPage ? 'main-content' : ''}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Login" element={<LoginPage />} />
          <Route path="/CreateAccount" element={<CreateAccountPage />} />
          <Route path="/Privacy" element={<PrivacyPage />} />
          <Route path="/Contact" element={<ContactPage />} />
          <Route path="/FAQ" element={<FrequentyAsk />} />
          <Route path="/AdminMovies" element={<AdminMoviePage />} />
          <Route path="/ProductDetail" element={<AdminMoviePage />} />
        </Routes>
      </main>
     <Footer />
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
