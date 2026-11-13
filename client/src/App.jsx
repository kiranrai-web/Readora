import './App.css'
import Login from './pages/login/login'
import Home from './pages/home/home'
import Register from './pages/register/register'
import MainLayout from './MainLayout'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Search from './pages/search/search';
import Shelf from './pages/shelf/shelf';
import Preview from './pages/preview/preview';
import Borrow from './components/borrow/borrow';
import About from './pages/about/about';
import Terms from './pages/T&Condition/terms';
import Admin from './pages/admin/admin';
import Profile from './pages/profile/profile';
import PasswordChangePrompt from './components/passwordChangePrompt/passwordChangePrompt';
import ReturnedBookPrompt from './components/returnedBookPrompt/returnedBookPrompt';

const ProtectedAdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = user?.role === 'admin';
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/shelf" element={<Shelf />} />
          <Route path="/book/:id" element={<Preview />} />
          <Route path="/borrow/:id" element={<Borrow />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute>
              <Admin />
            </ProtectedAdminRoute>
          } 
        />
      </Routes>
      <ReturnedBookPrompt />
      <PasswordChangePrompt />
    </BrowserRouter>
  )
}

export default App