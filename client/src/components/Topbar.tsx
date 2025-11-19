import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ThemeToggle from "./ThemeToggle";
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => (location.pathname === path ? 'primary' : 'secondary');

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const authLinks = user ? (
    <>
      <li><Link to="/" className={isActive('/')}>Dashboard</Link></li>
      <li><Link to="/entries" className={isActive('/entries')}>Entries</Link></li>
      <li><Link to="/trends" className={isActive('/trends')}>Trends</Link></li>
      <li><Link to="/calendar" className={isActive('/calendar')}>Calendar</Link></li>
      <li><Link to="/preferences" className={isActive('/preferences')}>Preferences</Link></li>
      <li className="muted topbar-user">{user.email}</li>
      <li>
        <button type="button" className="secondary" onClick={handleLogout}>
          Logout
        </button>
      </li>
    </>
  ) : (
    <>
      <li><Link to="/" className={isActive('/')}>Home</Link></li>
      <li><Link to="/login" className={isActive('/login')}>Login</Link></li>
      <li><Link to="/register" className={isActive('/register')}>Sign up</Link></li>
    </>
  );

  return (
    <nav className={`topbar container-fluid ${menuOpen ? 'menu-open' : ''}`}>
      <div className="topbar-bar">
        <Link to="/" className="contrast topbar-logo"><strong>MoodPeek</strong></Link>
        <div className="topbar-controls">
          <ThemeToggle />
          <button
            type="button"
            className="topbar-burger"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`topbar-links ${menuOpen ? 'open' : ''}`}>
        <ul>
          {authLinks}
        </ul>
      </div>
    </nav>
  );
}