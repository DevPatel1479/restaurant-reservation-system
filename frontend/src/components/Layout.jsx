import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">Restaurant Reservations</Link>
        <nav className="nav">
          {user && <span className="muted">{user.name} · {user.role}</span>}
          {user ? <button className="btn btn-ghost" onClick={onLogout}>Logout</button> : <Link className="btn btn-ghost" to="/auth">Login</Link>}
        </nav>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
