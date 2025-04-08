import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminMoviePage from "./pages/AdminMoviePage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PrivacyPage from "./pages/PrivacyPage";
import CreateAccountPage from "./components/CreateAccountPage";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ContactPage from "./pages/ContactPage";
import FrequentyAsk from "./components/FrequentlyAsk";

function App() {
  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <Router>
        <Header />
        <div className="">
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
        </div>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
