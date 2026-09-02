import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileSearch,
  FileText,
  Mail,
  History,
  LogOut,
  Menu,
  X,
  Stethoscope,
  PenLine,
  FlameKindling,
} from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard',     icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
    { to: '/resumes',       icon: <FileText size={17} />,        label: 'My Resumes' },
    { to: '/analyze',       icon: <FileSearch size={17} />,      label: 'Recruiter Match' },
    { to: '/diagnose',      icon: <Stethoscope size={17} />,     label: 'Diagnose' },
    { to: '/polish',        icon: <PenLine size={17} />,         label: 'Polish Bullets' },
    { to: '/interview-prep',icon: <FlameKindling size={17} />,   label: 'Interview Prep' },
    { to: '/outreach',      icon: <Mail size={17} />,            label: 'Outreach' },
    { to: '/history',       icon: <History size={17} />,         label: 'History' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/dashboard" className="navbar-brand">
          <span className="brand-text">HireIQ</span>
        </NavLink>

        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}

          <div className="mobile-user-section">
            <div className="user-info">
              <div className="user-avatar">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="user-name">{user?.fullName || 'User'}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm" id="mobile-logout-btn">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="navbar-user desktop-user">
          <div className="user-info">
            <div className="user-avatar">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="user-name">{user?.fullName || 'User'}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" id="logout-btn">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
