import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminMoviePage from './pages/AdminMoviePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PrivacyPage from './pages/PrivacyPage';
import CreateAccountPage from './components/CreateAccountPage';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <Header />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Login" element={<LoginPage />} />
          <Route path="/CreateAccount" element={<CreateAccountPage />} />
          <Route path="/Privacy" element={<PrivacyPage />} />
          <Route path="/AdminMovies" element={<AdminMoviePage />} />
          <Route path="/ProductDetail" element={<AdminMoviePage />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
