import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-600">
        LocalServices
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-gray-600 text-sm">Hi, {user.name}</span>

            {user.role === 'provider' && (
              <Link to="/dashboard"
                className="text-sm text-blue-600 hover:underline">
                My Dashboard
              </Link>
            )}

            <button onClick={handleLogout}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login"
              className="text-sm text-gray-600 hover:text-blue-600">
              Login
            </Link>
            <Link to="/signup"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;