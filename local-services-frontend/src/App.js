import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar       from './components/Navbar';
import LoginPage    from './pages/LoginPage';
import SignupPage   from './pages/SignupPage';
import SearchPage   from './pages/SearchPage';
import ProviderPage from './pages/ProviderPage';
import Dashboard    from './pages/Dashboard';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center mt-20">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/"             element={<SearchPage />} />
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/signup"       element={<SignupPage />} />
            <Route path="/provider/:id" element={<ProviderPage />} />
            <Route path="/dashboard"    element={
              <PrivateRoute><Dashboard /></PrivateRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;