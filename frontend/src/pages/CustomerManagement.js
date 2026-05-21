import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Plus, Edit2, Trash2, Save, X, Search, CreditCard } from 'lucide-react';
import { getApiUrl } from '../utils/config';
import currencyUtils from '../utils/currency';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;

  h1 {
    margin: 0;
    color: #1f2937;
    font-size: 28px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }
`;

const SearchBar = styled.div`
  position: relative;
  margin-bottom: 20px;

  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }

  input {
    width: 100%;
    padding: 12px 14px 12px 40px;
    font-size: 0.95rem;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: white;
    outline: none;
    box-sizing: border-box;

    &:focus {
      border-color: #10b981;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;

  th {
    text-align: left;
    padding: 12px 14px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  td {
    padding: 12px 14px;
    font-size: 0.92rem;
    color: #1f2937;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: #fafafa;
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.85rem;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
  }
`;

const RowActions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid ${p => p.$variant === 'danger' ? '#fecaca' : '#e5e7eb'};
  background: ${p => p.$variant === 'danger' ? '#fef2f2' : 'white'};
  color: ${p => p.$variant === 'danger' ? '#dc2626' : '#6b7280'};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${p => p.$variant === 'danger' ? '#fee2e2' : '#f3f4f6'};
    color: ${p => p.$variant === 'danger' ? '#b91c1c' : '#1f2937'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Empty = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
  background: white;
  border-radius: 12px;
  border: 1px dashed #e5e7eb;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;

  h2 {
    margin: 0 0 20px;
    font-size: 1.3rem;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const Field = styled.div`
  margin-bottom: 14px;

  label {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
  }

  input {
    width: 100%;
    padding: 11px 13px;
    font-size: 0.95rem;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    outline: none;
    box-sizing: border-box;

    &:focus {
      border-color: #10b981;
    }
  }

  .required {
    color: #dc2626;
  }
`;

const ErrorBox = styled.div`
  background: #fef2f2;
  color: #b91c1c;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 14px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;

  button {
    padding: 10px 18px;
    font-size: 0.92rem;
    font-weight: 600;
    border-radius: 10px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .secondary {
    background: white;
    color: #6b7280;
    border-color: #e5e7eb;

    &:hover { background: #f9fafb; }
  }

  .primary {
    background: #10b981;
    color: white;

    &:hover:not(:disabled) { background: #059669; }
    &:disabled { background: #d1d5db; cursor: not-allowed; }
  }

  .danger {
    background: #dc2626;
    color: white;

    &:hover:not(:disabled) { background: #b91c1c; }
    &:disabled { background: #fca5a5; cursor: not-allowed; }
  }
`;

const EMPTY_FORM = { uid: '', pin: '', name: '', organization: '', nickname: '', phone: '', balance: '' };

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create'); // 'create' | 'edit'
  const [editorTarget, setEditorTarget] = useState(null); // customer being edited
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [assignedPin, setAssignedPin] = useState('');
  const [assignedFor, setAssignedFor] = useState(''); // customer name for the pin reveal dialog

  const fetchCustomers = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(getApiUrl('/api/motong/customers'));
      const json = await res.json();
      if (json.code === 0) {
        setCustomers(json.data || []);
      } else {
        setLoadError(json.msg || 'Failed to load customers');
      }
    } catch (err) {
      setLoadError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      (c.uid || '').toLowerCase().includes(q) ||
      (c.pin || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.organization || '').toLowerCase().includes(q) ||
      (c.nickname || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  const openCreate = () => {
    setEditorMode('create');
    setEditorTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setEditorOpen(true);
  };

  const openEdit = (customer) => {
    setEditorMode('edit');
    setEditorTarget(customer);
    setForm({
      uid: customer.uid || '',
      pin: customer.pin || '',
      name: customer.name || '',
      organization: customer.organization || '',
      nickname: customer.nickname || '',
      phone: customer.phone || '',
      balance: customer.balance != null ? String(customer.balance) : ''
    });
    setFormError('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setForm(EMPTY_FORM);
    setEditorTarget(null);
    setFormError('');
  };

  const submitForm = async () => {
    const uid = form.uid.trim().toUpperCase();
    const pin = form.pin.trim();
    const name = form.name.trim();
    const organization = form.organization.trim();
    if (!name || !organization) {
      setFormError('Name and Organization are required');
      return;
    }
    if (editorMode === 'create' && !uid && pin && !/^\d{4,8}$/.test(pin)) {
      setFormError('PIN must be 4–8 digits');
      return;
    }
    if (editorMode === 'edit' && !uid && !pin) {
      setFormError('A customer must have either a card UID or a PIN');
      return;
    }
    const balanceNum = form.balance === '' ? null : Number(form.balance);
    if (balanceNum != null && (!Number.isFinite(balanceNum) || balanceNum < 0)) {
      setFormError('Balance must be a non-negative number');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const body = {
        name,
        organization,
        nickname: form.nickname.trim(),
        phone: form.phone.trim()
      };
      if (uid) body.uid = uid;
      if (pin) body.pin = pin;
      let url = getApiUrl('/api/motong/customers');
      let method = 'POST';
      if (editorMode === 'edit' && editorTarget) {
        url = getApiUrl(`/api/motong/customers/${editorTarget.id}`);
        method = 'PUT';
        // Always send uid/pin on edit so admins can clear them (use empty string → null upstream)
        body.uid = uid;
        body.pin = pin;
        if (balanceNum != null) body.balance = balanceNum;
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json().catch(() => ({}));
      if ((res.ok || res.status === 201) && json.code === 0) {
        await fetchCustomers();
        const created = json.data;
        closeEditor();
        // If we just created a PIN-only customer (server assigned the PIN), show it to the admin so they can share it.
        if (editorMode === 'create' && created && created.pin && !uid) {
          setAssignedPin(created.pin);
          setAssignedFor(created.name);
        }
      } else {
        setFormError(json.msg || `Save failed (${res.status})`);
      }
    } catch (err) {
      setFormError(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(getApiUrl(`/api/motong/customers/${deleteTarget.id}`), { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.code === 0) {
        await fetchCustomers();
        setDeleteTarget(null);
      } else {
        setDeleteError(json.msg || `Delete failed (${res.status})`);
      }
    } catch (err) {
      setDeleteError(err.message || 'Network error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container>
      <Header>
        <h1><CreditCard size={26} /> Customer Management</h1>
        <AddButton onClick={openCreate}><Plus size={18} /> Add Customer</AddButton>
      </Header>

      <SearchBar>
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by UID, PIN, name, organization, nickname or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SearchBar>

      {loadError && <ErrorBox>{loadError}</ErrorBox>}

      {loading ? (
        <Empty>Loading customers…</Empty>
      ) : filtered.length === 0 ? (
        <Empty>
          {customers.length === 0
            ? 'No customers registered yet. Tap a card on the kiosk or use "Add Customer".'
            : 'No customers match your search.'}
        </Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Card UID</th>
              <th>PIN</th>
              <th>Name</th>
              <th>Organization</th>
              <th>Nickname</th>
              <th>Phone</th>
              <th>Balance</th>
              <th>Orders</th>
              <th>Registered</th>
              <th style={{ width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>{c.uid ? <code>{c.uid}</code> : <span style={{ color: '#9ca3af' }}>—</span>}</td>
                <td>{c.pin ? <code>{c.pin}</code> : <span style={{ color: '#9ca3af' }}>—</span>}</td>
                <td>{c.name}</td>
                <td>{c.organization}</td>
                <td>{c.nickname || '—'}</td>
                <td>{c.phone || '—'}</td>
                <td>{currencyUtils.formatPrice(Number(c.balance) || 0)}</td>
                <td>{c.order_count ?? 0}</td>
                <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>{c.created_at}</td>
                <td>
                  <RowActions>
                    <IconButton title="Edit" onClick={() => openEdit(c)}><Edit2 size={16} /></IconButton>
                    <IconButton
                      title={c.order_count > 0 ? `Has ${c.order_count} orders — cannot delete` : 'Delete'}
                      $variant="danger"
                      onClick={() => { setDeleteTarget(c); setDeleteError(''); }}
                      disabled={c.order_count > 0}
                    ><Trash2 size={16} /></IconButton>
                  </RowActions>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {editorOpen && (
        <ModalBackdrop onMouseDown={(e) => { if (e.target === e.currentTarget) closeEditor(); }}>
          <Modal onMouseDown={(e) => e.stopPropagation()}>
            <h2><CreditCard size={22} /> {editorMode === 'create' ? 'Add Customer' : 'Edit Customer'}</h2>

            <Field>
              <label>Card UID <span style={{ color: '#9ca3af', fontWeight: 500 }}>(optional — from NFC tap)</span></label>
              <input
                type="text"
                value={form.uid}
                onChange={(e) => setForm((f) => ({ ...f, uid: e.target.value }))}
                placeholder="e.g. 04A1B2C3D4E5F6"
                disabled={saving}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
              />
            </Field>
            <Field>
              <label>PIN <span style={{ color: '#9ca3af', fontWeight: 500 }}>
                {editorMode === 'create' ? '(leave blank to auto-generate if no UID)' : '(4–8 digits)'}
              </span></label>
              <input
                type="text"
                inputMode="numeric"
                value={form.pin}
                onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/[^0-9]/g, '') }))}
                placeholder={editorMode === 'create' ? 'auto' : '1234'}
                disabled={saving}
                maxLength={8}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: '0.2em' }}
              />
            </Field>
            <Field>
              <label>Full Name <span className="required">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={saving}
              />
            </Field>
            <Field>
              <label>Organization <span className="required">*</span></label>
              <input
                type="text"
                value={form.organization}
                onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                disabled={saving}
              />
            </Field>
            <Field>
              <label>Nickname</label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                disabled={saving}
              />
            </Field>
            <Field>
              <label>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                disabled={saving}
              />
            </Field>
            {editorMode === 'edit' && (
              <Field>
                <label>Balance</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.balance}
                  onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
                  disabled={saving}
                />
              </Field>
            )}

            {formError && <ErrorBox>{formError}</ErrorBox>}

            <ModalActions>
              <button className="secondary" onClick={closeEditor} disabled={saving}>
                <X size={16} /> Cancel
              </button>
              <button className="primary" onClick={submitForm} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}

      {assignedPin && (
        <ModalBackdrop onMouseDown={(e) => { if (e.target === e.currentTarget) { setAssignedPin(''); setAssignedFor(''); } }}>
          <Modal onMouseDown={(e) => e.stopPropagation()}>
            <h2><CreditCard size={22} /> PIN assigned</h2>
            <p style={{ color: '#374151', fontSize: '0.92rem', marginTop: 0 }}>
              <strong>{assignedFor}</strong> can now order using this PIN. Share it with them before closing this dialog — you can always look it up again in the table.
            </p>
            <div style={{
              background: '#fff7ed',
              border: '2px solid #fed7aa',
              borderRadius: '14px',
              padding: '22px',
              textAlign: 'center',
              margin: '12px 0 18px'
            }}>
              <div style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                New PIN
              </div>
              <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#ea580c', letterSpacing: '0.45rem', fontVariantNumeric: 'tabular-nums' }}>
                {assignedPin}
              </div>
            </div>
            <ModalActions>
              <button className="primary" onClick={() => { setAssignedPin(''); setAssignedFor(''); }}>
                <Save size={16} /> Done
              </button>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}

      {deleteTarget && (
        <ModalBackdrop onMouseDown={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}>
          <Modal onMouseDown={(e) => e.stopPropagation()}>
            <h2><Trash2 size={22} /> Delete Customer</h2>
            <p style={{ color: '#374151', fontSize: '0.95rem', marginTop: 0 }}>
              Delete <strong>{deleteTarget.name}</strong> (<code>{deleteTarget.uid}</code>)? This cannot be undone.
            </p>
            {deleteError && <ErrorBox>{deleteError}</ErrorBox>}
            <ModalActions>
              <button className="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                <X size={16} /> Cancel
              </button>
              <button className="danger" onClick={confirmDelete} disabled={deleting}>
                <Trash2 size={16} /> {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      )}
    </Container>
  );
};

export default CustomerManagement;
