import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AdminMoviePage from './pages/AdminMoviePage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PrivacyPage from './pages/PrivacyPage'
import CreateAccountPage from './pages/CreateAccountPage'

function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path='/' element={<HomePage />}></Route>
        <Route path='/Login' element={<LoginPage />}></Route>
        <Route path='/CreateAccount' element={<CreateAccountPage />}></Route>
        <Route path='/Privacy' element={<PrivacyPage />}></Route>
        <Route path='/AdminMovies' element={<AdminMoviePage/>}></Route>
        <Route path='/ProductDetail' element={<AdminMoviePage/>}></Route>
      </Routes>
    </Router>
    </>
  )
}

export default App
