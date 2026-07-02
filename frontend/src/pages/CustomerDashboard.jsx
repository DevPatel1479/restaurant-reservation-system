// pages/CustomerDashboard.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../state/AuthContext';
import Field from '../components/Field';

const initialForm = {
  date: '',
  startTime: '18:00',
  endTime: '19:30',
  guests: 2,
  tableId: '',
  notes: '',
};

export default function CustomerDashboard() {
  const { token, user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  // Toast state
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [myRes, tablesRes] = await Promise.all([
        apiRequest('/reservations/my', { token }),
        apiRequest('/tables', { token }),
      ]);
      setReservations(myRes.data?.reservations || []);
      setTables(tablesRes.data?.tables || []);
    } catch (err) {
      showToast(err.message || 'Failed to load data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createReservation = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiRequest('/reservations', {
        method: 'POST',
        token,
        body: {
          ...form,
          guests: Number(form.guests),
          tableId: form.tableId || null,
        },
      });
      showToast('Reservation created successfully.', 'success');
      setForm(initialForm);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const cancelReservation = async (id) => {
    setCancellingId(id);
    try {
      await apiRequest(`/reservations/${id}/cancel`, {
        method: 'PATCH',
        token,
      });
      showToast('Reservation cancelled.', 'success');
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="customer-dashboard stack">
      {/* Toast Popup */}
      {toast.visible && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <section className="page-head">
        <div>
          <p className="eyebrow">Customer Area</p>
          <h1>Welcome, {user?.name}</h1>
          <p className="muted">Book a table, see your reservations, and cancel your bookings.</p>
        </div>
      </section>

      <section className="grid-2 customer-grid">
        <form className="card" onSubmit={createReservation}>
          <h2>Create reservation</h2>
          <div className="grid-2 compact">
            <Field
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <Field
              label="Guests"
              type="number"
              min="1"
              max="50"
              value={form.guests}
              onChange={(e) => setForm({ ...form, guests: e.target.value })}
              required
            />
            <Field
              label="Start time"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
            />
            <Field
              label="End time"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              required
            />
          </div>

          <label className="field">
            <span>Preferred table (optional)</span>
            <select
              className="input"
              value={form.tableId}
              onChange={(e) => setForm({ ...form, tableId: e.target.value })}
            >
              <option value="">Auto assign best available table</option>
              {tables.map((table) => (
                <option key={table._id} value={table._id}>
                  {table.name} · Seats {table.capacity} {table.isActive ? '' : '(inactive)'}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              className="input"
              rows="3"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Reserve table'}
          </button>
        </form>

        <div className="card">
          <h2>My reservations</h2>
          <div className="list">
            {loading ? (
              <div className="loading-spinner">Loading reservations…</div>
            ) : reservations.length === 0 ? (
              <p className="muted">No reservations yet.</p>
            ) : (
              reservations.map((r) => (
                <article className="list-item" key={r._id}>
                  <div>
                    <strong>{r.date}</strong> · {r.startTime} to {r.endTime}
                    <div className="muted">
                      Table: {r.table?.name || '—'} · Seats {r.table?.capacity || '—'} · Guests {r.guests}
                    </div>
                    <div className="muted">
                      Status:{' '}
                      <span className={`status-badge ${r.status}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                  {r.status !== 'cancelled' && (
                    <button
                      className="btn btn-ghost"
                      onClick={() => cancelReservation(r._id)}
                      disabled={cancellingId === r._id}
                    >
                      {cancellingId === r._id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}