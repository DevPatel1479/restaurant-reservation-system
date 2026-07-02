// pages/AdminDashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../state/AuthContext';
import Field from '../components/Field';
import '../styles.css';

const emptyTable = { name: '', capacity: 4, isActive: true, notes: '' };
const emptyMessage = { type: '', text: '' };

export default function AdminDashboard() {
  const { token, user } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [tableForm, setTableForm] = useState(emptyTable);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingTable, setSavingTable] = useState(false);
  const [savingRowId, setSavingRowId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(emptyMessage);

  const tableMap = useMemo(
    () => Object.fromEntries(tables.map((t) => [t._id, t])),
    [tables]
  );

  const updateDraft = useCallback((id, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch },
    }));
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const statsRes = await apiRequest('/reservations/stats', { token });
      setStats(statsRes?.data || null);
    } catch (err) {
      console.warn('Failed to refresh stats:', err.message);
    }
  }, [token]);

  const load = useCallback(
    async (dateFilter = '') => {
      setLoading(true);
      setError('');
      setMessage(emptyMessage);
      try {
        const url = dateFilter
          ? `/reservations?date=${encodeURIComponent(dateFilter)}`
          : '/reservations';
        const [resRes, tablesRes, statsRes] = await Promise.all([
          apiRequest(url, { token }),
          apiRequest('/tables', { token }),
          apiRequest('/reservations/stats', { token }),
        ]);
        const nextReservations = resRes?.data?.reservations || [];
        setReservations(nextReservations);
        setTables(tablesRes?.data?.tables || []);
        setStats(statsRes?.data || null);
        const nextDrafts = Object.fromEntries(
          nextReservations.map((r) => [
            r._id,
            {
              date: r.date || '',
              startTime: r.startTime || '',
              endTime: r.endTime || '',
              guests: r.guests ?? '',
              tableId: r.table?._id || '',
              userId: r.user?._id || '',
              status: r.status || 'confirmed',
              notes: r.notes || '',
            },
          ])
        );
        setDrafts(nextDrafts);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load(appliedDate);
  }, [load, appliedDate]);

  const showSuccess = (text) => {
    setError('');
    setMessage({ type: 'success', text });
  };
  const showError = (text) => {
    setMessage(emptyMessage);
    setError(text);
  };

  const cancelReservation = async (id) => {
    const originalReservations = [...reservations];
    const originalDrafts = { ...drafts };
    setReservations((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status: 'cancelled' } : r))
    );
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: 'cancelled' },
    }));

    setSavingRowId(id);
    setError('');
    setMessage(emptyMessage);

    try {
      await apiRequest(`/reservations/${id}/cancel`, {
        method: 'PATCH',
        token,
      });
      showSuccess('Reservation cancelled.');
      await refreshStats();
    } catch (err) {
      setReservations(originalReservations);
      setDrafts(originalDrafts);
      showError(err.message);
    } finally {
      setSavingRowId('');
    }
  };

  const updateReservation = async (id) => {
    const draft = drafts[id];
    if (!draft) return;

    const originalReservations = [...reservations];
    const updatedReservation = {
      ...reservations.find((r) => r._id === id),
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      guests: Number(draft.guests),
      table: tables.find((t) => t._id === draft.tableId) || null,
      status: draft.status,
      notes: draft.notes,
    };
    setReservations((prev) =>
      prev.map((r) => (r._id === id ? updatedReservation : r))
    );

    setSavingRowId(id);
    setError('');
    setMessage(emptyMessage);

    try {
      await apiRequest(`/reservations/${id}`, {
        method: 'PUT',
        token,
        body: {
          date: draft.date,
          startTime: draft.startTime,
          endTime: draft.endTime,
          guests: Number(draft.guests),
          tableId: draft.tableId || null,
          status: draft.status,
          userId: draft.userId || null,
          notes: draft.notes,
        },
      });
      showSuccess('Reservation updated.');
      await refreshStats();
    } catch (err) {
      setReservations(originalReservations);
      showError(err.message);
    } finally {
      setSavingRowId('');
    }
  };

  const toggleTable = async (table) => {
    const originalTables = [...tables];
    setTables((prev) =>
      prev.map((t) =>
        t._id === table._id ? { ...t, isActive: !t.isActive } : t
      )
    );
    setError('');
    setMessage(emptyMessage);

    try {
      await apiRequest(`/tables/${table._id}`, {
        method: 'PUT',
        token,
        body: { isActive: !table.isActive },
      });
      showSuccess(`${table.name} is now ${!table.isActive ? 'active' : 'inactive'}.`);
    } catch (err) {
      setTables(originalTables);
      showError(err.message);
    }
  };

  const saveTable = async (e) => {
    e.preventDefault();
    setSavingTable(true);
    setError('');
    setMessage(emptyMessage);

    const tempId = `temp-${Date.now()}`;
    const newTable = {
      _id: tempId,
      ...tableForm,
      capacity: Number(tableForm.capacity),
    };
    setTables((prev) => [...prev, newTable]);
    setTableForm(emptyTable);

    try {
      const response = await apiRequest('/tables', {
        method: 'POST',
        token,
        body: {
          ...tableForm,
          capacity: Number(tableForm.capacity),
        },
      });
      const created = response?.data?.table;
      setTables((prev) => prev.map((t) => (t._id === tempId ? created : t)));
      showSuccess('Table created successfully.');
    } catch (err) {
      setTables((prev) => prev.filter((t) => t._id !== tempId));
      showError(err.message);
    } finally {
      setSavingTable(false);
    }
  };

  const applyFilter = () => setAppliedDate(filterDate);
  const clearFilter = () => {
    setFilterDate('');
    setAppliedDate('');
  };
  const refreshData = () => load(appliedDate);

  const statsCards = [
    { label: 'Total reservations', value: stats?.total ?? 0 },
    { label: 'Confirmed', value: stats?.confirmed ?? 0 },
    { label: 'Cancelled', value: stats?.cancelled ?? 0 },
  ];

  return (
    <div className="dashboard">
      <section className="dashboard-header card">
        <div>
          <p className="eyebrow">Administrator Area</p>
          <h1>Dashboard for {user?.name || 'Admin'}</h1>
          <p className="muted">
            Review reservations, filter by date, manage tables, and control bookings
            from one clean workspace.
          </p>
        </div>
        <div className="stats-row">
          {statsCards.map((item) => (
            <div className="stat-item" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {(error || message.text) && (
        <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
          {error || message.text}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Left: Reservations */}
        <div className="card reservation-section">
          <div className="section-header">
            <div>
              <h2>Reservation controls</h2>
              <p className="muted">Filter, edit, or cancel reservations.</p>
            </div>
            <button className="btn btn-ghost" onClick={refreshData} type="button">
              Refresh
            </button>
          </div>

          <div className="filter-bar">
            <Field
              label="Filter by date"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <button className="btn btn-primary" type="button" onClick={applyFilter}>
              Apply
            </button>
            <button className="btn btn-ghost" type="button" onClick={clearFilter}>
              Clear
            </button>
          </div>

          <div className="filter-hint muted">
            {appliedDate
              ? `Showing reservations for ${appliedDate}.`
              : 'Showing all reservations.'}
          </div>

          <div className="reservation-list">
            {loading ? (
              <div className="loading-spinner">Loading reservations…</div>
            ) : reservations.length === 0 ? (
              <div className="empty-state">No reservations found.</div>
            ) : (
              reservations.map((r) => {
                const draft = drafts[r._id] || {};
                const assignedTable = draft.tableId
                  ? tableMap[draft.tableId]
                  : r.table;

                return (
                  <article className="reservation-item" key={r._id}>
                    <div className="reservation-header">
                      <div>
                        <strong>{r.user?.name || 'Unknown customer'}</strong>
                        <div className="muted">{r.user?.email || 'No email'}</div>
                      </div>
                      <span className={`status-badge ${r.status}`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="reservation-details-grid">
                      <div className="card current-booking">
                        <div className="muted small-label">Current booking</div>
                        <div className="booking-info">
                          <div>Date: {r.date || '—'}</div>
                          <div>Time: {r.startTime || '—'} – {r.endTime || '—'}</div>
                          <div>Guests: {r.guests ?? '—'}</div>
                          <div>Table: {r.table?.name || assignedTable?.name || 'Auto'}</div>
                          <div>Seats: {r.table?.capacity || assignedTable?.capacity || '—'}</div>
                        </div>
                      </div>

                      <div className="card editable-fields">
                        <div className="muted small-label">Editable fields</div>
                        <div className="edit-grid">
                          <Field
                            label="Date"
                            type="date"
                            value={draft.date || ''}
                            onChange={(e) => updateDraft(r._id, { date: e.target.value })}
                          />
                          <Field
                            label="Guests"
                            type="number"
                            min="1"
                            max="50"
                            value={draft.guests ?? ''}
                            onChange={(e) => updateDraft(r._id, { guests: e.target.value })}
                          />
                          <Field
                            label="Start"
                            type="time"
                            value={draft.startTime || ''}
                            onChange={(e) => updateDraft(r._id, { startTime: e.target.value })}
                          />
                          <Field
                            label="End"
                            type="time"
                            value={draft.endTime || ''}
                            onChange={(e) => updateDraft(r._id, { endTime: e.target.value })}
                          />
                        </div>
                        <div className="edit-extras">
                          <label className="field">
                            <span>Table</span>
                            <select
                              className="field-input"
                              value={draft.tableId || ''}
                              onChange={(e) => updateDraft(r._id, { tableId: e.target.value })}
                            >
                              <option value="">Auto assign</option>
                              {tables.map((t) => (
                                <option key={t._id} value={t._id}>
                                  {t.name} · Seats {t.capacity} {t.isActive ? '' : '(inactive)'}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Status</span>
                            <select
                              className="field-input"
                              value={draft.status || 'confirmed'}
                              onChange={(e) => updateDraft(r._id, { status: e.target.value })}
                            >
                              <option value="confirmed">confirmed</option>
                              <option value="cancelled">cancelled</option>
                            </select>
                          </label>
                          <label className="field">
                            <span>Notes</span>
                            <textarea
                              className="field-input"
                              rows="2"
                              value={draft.notes || ''}
                              onChange={(e) => updateDraft(r._id, { notes: e.target.value })}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="reservation-actions">
                      <button
                        className="btn btn-danger"
                        type="button"
                        onClick={() => cancelReservation(r._id)}
                        disabled={savingRowId === r._id}
                      >
                        {savingRowId === r._id ? 'Working…' : 'Cancel'}
                      </button>
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => updateReservation(r._id)}
                        disabled={savingRowId === r._id}
                      >
                        {savingRowId === r._id ? 'Saving…' : 'Update'}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Tables */}
        <div className="card tables-section">
          <div>
            <h2>Manage tables</h2>
            <p className="muted">Create tables and toggle availability.</p>
          </div>

          <form className="table-form" onSubmit={saveTable}>
            <div className="form-grid">
              <Field
                label="Table name"
                value={tableForm.name}
                onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                required
              />
              <Field
                label="Capacity"
                type="number"
                min="1"
                max="50"
                value={tableForm.capacity}
                onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                required
              />
            </div>
            <label className="field">
              <span>Notes</span>
              <textarea
                className="field-input"
                rows="2"
                value={tableForm.notes}
                onChange={(e) => setTableForm({ ...tableForm, notes: e.target.value })}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={tableForm.isActive}
                onChange={(e) => setTableForm({ ...tableForm, isActive: e.target.checked })}
              />
              <span>Active</span>
            </label>
            <button className="btn btn-primary" type="submit" disabled={savingTable}>
              {savingTable ? 'Saving…' : 'Create table'}
            </button>
          </form>

          <div className="table-list">
            {loading ? (
              <div className="loading-spinner">Loading tables…</div>
            ) : tables.length === 0 ? (
              <div className="empty-state">No tables found.</div>
            ) : (
              tables.map((table) => (
                <div className="table-item" key={table._id}>
                  <div>
                    <strong>{table.name}</strong>
                    <div className="muted">
                      Capacity {table.capacity} · {table.isActive ? 'Active' : 'Inactive'}
                      {table.notes && ` · ${table.notes}`}
                    </div>
                  </div>
                  <button
                    className={`btn ${table.isActive ? 'btn-warning' : 'btn-success'}`}
                    type="button"
                    onClick={() => toggleTable(table)}
                  >
                    {table.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))
            )}
          </div>

          <p className="hint">
            Table assignment is automatic by capacity unless an admin explicitly selects
            a table during edits.
          </p>
        </div>
      </div>
    </div>
  );
}