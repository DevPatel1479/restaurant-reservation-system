// pages/AuthPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import Field from '../components/Field';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, user } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // Helper to parse validation errors from the backend
  const parseValidationError = (errorMessage) => {
    try {
      // Extract JSON inside parentheses
      const match = errorMessage.match(/\((.*)\)/);
      if (match) {
        const errorData = JSON.parse(match[1]);
        if (errorData.fieldErrors) {
          const fieldErrors = errorData.fieldErrors;
          const messages = [];
          for (const [field, msgs] of Object.entries(fieldErrors)) {
            messages.push(`${field}: ${msgs.join(', ')}`);
          }
          return messages.join('; ');
        }
        // If there are formErrors (non-field errors), include them as well
        if (errorData.formErrors && errorData.formErrors.length > 0) {
          return errorData.formErrors.join(', ');
        }
      }
      // Fallback to the original message if we couldn't parse
      return errorMessage;
    } catch (e) {
      // If parsing fails, return the original message
      return errorMessage;
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        showToast('Login successful!', 'success');
      } else {
        await register(form.name, form.email, form.password);
        showToast('Account created! Please login.', 'success');
        setMode('login');
        setForm({ name: '', email: '', password: '' });
      }
      setTimeout(() => navigate('/'), 500);
    } catch (err) {
      const userFriendlyMessage = parseValidationError(err.message);
      showToast(userFriendlyMessage, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      {toast.visible && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="auth-grid">
        <div className="card hero-card">
          <p className="eyebrow">Restaurant Reservation System</p>
          <h1>Secure booking management for customers and admins</h1>
          <p className="muted">
            Create reservations, avoid table conflicts, and manage bookings from a role-aware dashboard.
          </p>
        </div>

        <form className="card form-card" onSubmit={submit}>
          <div className="segmented">
            <button
              type="button"
              className={mode === 'login' ? 'seg active' : 'seg'}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'seg active' : 'seg'}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          {mode === 'register' && (
            <Field
              label="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
          </button>

          <div className="hint">Admin login is created from seed script.</div>
        </form>
      </div>
    </div>
  );
}