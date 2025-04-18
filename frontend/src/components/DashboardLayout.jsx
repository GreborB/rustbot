import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: '📊' },
    { path: '/dashboard/players', label: 'Players', icon: '👥' },
    { path: '/dashboard/commands', label: 'Commands', icon: '⚙️' },
    { path: '/dashboard/settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="dashboard-layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>RustBot</h1>
        </div>
        <ul className="nav-items">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
} 