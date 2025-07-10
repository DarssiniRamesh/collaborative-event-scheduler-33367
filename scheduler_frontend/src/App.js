import React, { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import jwt_decode from 'jwt-decode';
import Cookies from 'js-cookie';
import './App.css';

const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"; // TODO: Set this value

///////////////////////// AUTH CONTEXT //////////////////////////

/**
 * AuthContext provides authentication state and actions for the app,
 * such as login, logout, current user, and token.
 */
const AuthContext = createContext();

/**
 * Returns the useAuth() hook to provide authentication context.
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider handles user state and token storage.
 */
function AuthProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null); // { name, email, picture }
  const [token, setToken] = useState(null);

  // On mount: check for token in cookies
  useEffect(() => {
    const savedToken = Cookies.get('auth_token');
    if (savedToken) {
      try {
        const decoded = jwt_decode(savedToken);
        setUser({
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture,
        });
        setToken(savedToken);
      } catch (e) {
        setUser(null);
        setToken(null);
      }
    }
  }, []);

  // Effect to apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  const login = (credentialResponse) => {
    if (!credentialResponse || !credentialResponse.credential) return;
    const jwt = credentialResponse.credential;
    try {
      const decoded = jwt_decode(jwt);
      setUser({
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
      });
      setToken(jwt);
      Cookies.set('auth_token', jwt, { secure: true, sameSite: 'strict' });
    } catch (e) {
      setUser(null);
      setToken(null);
    }
  };

  // PUBLIC_INTERFACE
  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove('auth_token');
  };

  const contextValue = {
    user,
    token,
    login,
    logout,
    theme,
    toggleTheme,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

///////////////////////// ROUTE GUARD //////////////////////////

/**
 * ProtectedRoute wrapper: restricts access to authenticated users.
 */
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

//////////////////// USER EXPERIENCE COMPONENTS ////////////////////

function LoginPage() {
  const { login, theme } = useAuth();
  return (
    <div className="App">
      <header className="App-header">
        <ThemeToggle />
        <h2>Login to Collaborative Scheduler</h2>
        <GoogleLogin
          onSuccess={login}
          onError={() => alert('Google Login Failed')}
          width="240"
          size="large"
          shape="pill"
          theme={theme === 'dark' ? 'filled_black' : 'outline'}
        />
      </header>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="App">
      <header className="App-header">
        <ThemeToggle />
        <div style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
          <button onClick={logout} className="theme-toggle" style={{ right: 120, top: 20 }}>
            Logout
          </button>
        </div>
        <img src={user?.picture} alt="profile" style={{ borderRadius: '50%', width: 64, height: 64 }} />
        <h2>Welcome, {user?.name || 'User'}!</h2>
        <p>{user?.email}</p>
        <p>Your dashboard goes here.</p>
        <Link className="App-link" to="/protected">Go to Protected Example</Link>
      </header>
    </div>
  );
}

function ProtectedDemo() {
  const { user } = useAuth();
  return (
    <div className="App">
      <header className="App-header">
        <ThemeToggle />
        <h3>This is a protected route!</h3>
        <div>
          <img src={user?.picture} alt="user" style={{ borderRadius: '50%', width: 50 }} />
          <div>{user?.name}</div>
        </div>
        <Link className="App-link" to="/">Back to Dashboard</Link>
      </header>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useAuth();
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{ position: 'absolute', right: 20, top: 20 }}
    >
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}

///////////////////// MAIN APP /////////////////////////////////////

/**
 * App is the root application with routing and auth context.
 */
// PUBLIC_INTERFACE
function App() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedDemo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
