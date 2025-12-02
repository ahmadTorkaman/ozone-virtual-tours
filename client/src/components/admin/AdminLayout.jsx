// ===========================================
// Admin Layout Component
// ===========================================

import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import {
  LayoutDashboard,
  Map,
  Palette,
  Users,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import './AdminLayout.css';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/tours', icon: Map, label: 'Tours' },
  { path: '/admin/branding', icon: Palette, label: 'Branding' },
  { path: '/admin/team', icon: Users, label: 'Team' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Mobile header */}
      <header className="admin-header">
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="header-brand">
          {branding.companyLogo ? (
            <img src={branding.companyLogo} alt={branding.companyName} className="header-logo" />
          ) : (
            <span className="header-title">{branding.companyName}</span>
          )}
        </div>

        <div className="header-user">
          <span className="user-name">{user?.name?.split(' ')[0]}</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          {branding.companyLogo ? (
            <img src={branding.companyLogo} alt={branding.companyName} className="sidebar-logo" />
          ) : (
            <span className="sidebar-title">{branding.companyName}</span>
          )}
          <span className="sidebar-subtitle">Admin Panel</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ path, icon: Icon, label, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={20} />
              <span>{label}</span>
              <ChevronRight size={16} className="nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
