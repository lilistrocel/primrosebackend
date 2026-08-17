import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { getApiUrl } from '../utils/config';

/**
 * Counter / server ops page for a bespoke customer menu (e.g. Aldar).
 * URL: /ops/<customer-slug>. The customer is read from window.location so
 * this component works whether or not it's mounted inside <Routes>.
 *
 * Fulfilment flow the staff sees:
 *   pending  ──▶  in_progress  ──▶  delivered
 *      └─────────────────────────▶  cancelled
 *
 * A tab strip switches between live-work views (Pending / Making) and
 * history (Delivered / Cancelled / All). Auto-refreshes every 5 s and
 * chirps once when a new pending order arrives while the page is open.
 */

const REFRESH_MS = 5000;

const STATUS = {
  pending: { label: 'Pending', color: '#f59e0b', bg: '#fffbeb' },
  in_progress: { label: 'Making', color: '#3b82f6', bg: '#eff6ff' },
  delivered: { label: 'Delivered', color: '#10b981', bg: '#ecfdf5' },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' }
};

// 'live' is the counter workspace — split into Pending (left) and Making (right)
// side-by-side so staff sees the whole work pipeline at once. The remaining
// tabs are history/audit views.
const TABS = [
  { key: 'live', label: 'Live' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' }
];

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.6); }
  50%      { box-shadow: 0 0 0 12px rgba(245,158,11,0); }
`;

const Page = styled.div`
  min-height: 100vh;
  background: #0f172a;
  color: #f8fafc;
  font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const Header = styled.header`
  display: flex; align-items: baseline; justify-content: space-between; gap: 24px;
  padding: 22px 32px; border-bottom: 1px solid rgba(255,255,255,0.08);
  background: #020617;
`;

const Title = styled.h1`
  margin: 0; font-size: 22px; font-weight: 500; letter-spacing: 0.02em;
  span { color: #94a3b8; font-weight: 300; margin-left: 8px; font-size: 15px; }
`;

const LiveTag = styled.span`
  display: inline-flex; align-items: center; gap: 8px; font-size: 12px;
  letter-spacing: 0.14em; text-transform: uppercase; color: #94a3b8;
  &:before {
    content: ''; width: 8px; height: 8px; border-radius: 50%;
    background: ${p => p.$stale ? '#ef4444' : '#10b981'};
    ${p => !p.$stale && 'box-shadow: 0 0 0 4px rgba(16,185,129,0.15);'}
  }
`;

const Tabs = styled.div`
  display: flex; gap: 4px; padding: 16px 32px 0; overflow-x: auto;
`;

const Tab = styled.button`
  background: ${p => p.$active ? '#1e293b' : 'transparent'};
  color: ${p => p.$active ? '#f8fafc' : '#94a3b8'};
  border: none; border-radius: 6px 6px 0 0;
  padding: 10px 18px; font-size: 14px; font-weight: 500;
  cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
  transition: background 0.15s, color 0.15s;
  &:hover { color: #f8fafc; }
`;

const Badge = styled.span`
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 22px; padding: 0 7px; border-radius: 999px;
  background: ${p => p.$color || '#334155'}; color: #fff;
  font-size: 12px; font-weight: 700;
`;

const Grid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px; padding: 20px 32px 40px;
`;

// Two-column split view for the live counter workspace. Each column scrolls
// independently so a busy Pending queue never pushes Making off screen.
const Split = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
  padding: 20px 32px 32px;
  /* Height fills whatever's left after header + tabs; columns scroll internally. */
  height: calc(100vh - 154px); min-height: 480px;
  @media (max-width: 900px) { grid-template-columns: 1fr; height: auto; }
`;

const Column = styled.section`
  display: flex; flex-direction: column; min-height: 0;
  background: rgba(15,23,42,0.6);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px; overflow: hidden;
`;

const ColHead = styled.header`
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 18px;
  background: ${p => p.$accent || '#0b1220'};
  border-bottom: 1px solid rgba(255,255,255,0.06);
  h2 {
    margin: 0; font-size: 14px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase; color: #f8fafc;
    display: inline-flex; align-items: center; gap: 10px;
  }
  h2:before {
    content: ''; width: 10px; height: 10px; border-radius: 50%;
    background: ${p => p.$dot || '#f59e0b'};
  }
`;

const ColBody = styled.div`
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 14px; display: flex; flex-direction: column; gap: 12px;
  /* Prettier scrollbars on the counter tablet */
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
`;

const ColEmpty = styled.div`
  color: #64748b; text-align: center; padding: 40px 20px; font-size: 14px;
`;

const Card = styled.article`
  background: #1e293b; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);
  padding: 18px; display: flex; flex-direction: column; gap: 12px;
  /* styled-components v6 requires the css helper when interpolating keyframes
     inside a conditional — otherwise the @keyframes rules never get injected
     and, more importantly, older toolchains can throw. */
  ${p => p.$pulse && css`animation: ${pulse} 1.8s ease-in-out 3;`}
`;

const CardTop = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
`;

const TableBox = styled.div`
  display: inline-flex; flex-direction: column;
  padding: 8px 14px; border-radius: 6px;
  background: rgba(214,172,101,0.14); color: #fde68a;
  min-width: 84px; text-align: center;
  small { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #d6d3d1; opacity: 0.75; }
  strong { font-size: 22px; font-weight: 600; line-height: 1.1; margin-top: 2px; word-break: break-word; }
`;

const StatusPill = styled.span`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 11px; border-radius: 999px;
  background: ${p => p.$bg}; color: ${p => p.$color};
  font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
`;

const When = styled.div`
  color: #94a3b8; font-size: 12px;
`;

const Items = styled.ul`
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 6px;
  li {
    display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
    padding: 6px 0; border-bottom: 1px dashed rgba(255,255,255,0.06);
    font-size: 14px;
    &:last-child { border-bottom: none; }
    .name { color: #f1f5f9; }
    .qty { color: #94a3b8; font-variant-numeric: tabular-nums; font-weight: 500; }
    .desc { display: block; color: #64748b; font-size: 12px; margin-top: 2px; }
  }
`;

const Notes = styled.div`
  padding: 10px 12px; border-radius: 6px; background: rgba(148,163,184,0.08);
  color: #cbd5e1; font-size: 13px; line-height: 1.4;
  &:before { content: '📝 '; }
`;

const Actions = styled.div`
  display: flex; gap: 8px; margin-top: 4px;
`;

const Btn = styled.button`
  flex: 1; padding: 11px 14px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  cursor: pointer; transition: filter 0.15s, transform 0.05s;
  background: ${p => p.$primary ? '#d6ac65' : p.$success ? '#10b981' : p.$danger ? '#ef4444' : 'rgba(255,255,255,0.08)'};
  color: ${p => p.$primary ? '#0f172a' : '#fff'};
  &:hover { filter: brightness(1.08); }
  &:active { transform: translateY(1px); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const Empty = styled.div`
  padding: 60px 40px; text-align: center; color: #64748b; font-size: 15px;
  grid-column: 1 / -1;
`;

const ErrorBar = styled.div`
  background: #7f1d1d; color: #fee2e2; padding: 10px 32px; font-size: 13px;
`;

// --- helpers -----------------------------------------------------------------

function customerFromPath() {
  const m = window.location.pathname.match(/^\/ops\/([a-z0-9-]{2,60})\/?$/i);
  return m ? m[1].toLowerCase() : '';
}

function formatTimeAgo(iso) {
  if (!iso) return '';
  // SQLite CURRENT_TIMESTAMP returns UTC without a Z suffix — parse as UTC.
  const t = Date.parse(iso.includes('T') || iso.endsWith('Z') ? iso : iso.replace(' ', 'T') + 'Z');
  const diffSec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (diffSec < 60) return diffSec + 's ago';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return min + ' min ago';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + ' hr ago';
  return new Date(t).toLocaleString();
}

// Cheap wood-block chime when a new pending order arrives. Web Audio only —
// no asset load, no permissions beyond the audio graph (autoplay may still
// block until the first user interaction with the page, which is fine).
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 600);
  } catch (e) { /* ignore — no audio, no problem */ }
}

// --- component ---------------------------------------------------------------

export default function OpsCustomer() {
  const customer = useMemo(customerFromPath, []);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('live');
  const [error, setError] = useState('');
  const [lastFetch, setLastFetch] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());
  const knownIds = useRef(new Set());
  const primed = useRef(false);

  const fetchOrders = useCallback(async () => {
    if (!customer) return;
    try {
      const res = await fetch(getApiUrl(`/api/motong/custom-orders/${customer}?limit=200`));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.code !== 0) throw new Error(data.msg || 'Failed');

      const next = Array.isArray(data.data) ? data.data : [];
      // Chime on new pending orders — but only after the first fetch so we don't
      // play a cascade on initial mount for every historical order.
      if (primed.current) {
        for (const o of next) {
          if (o.status === 'pending' && !knownIds.current.has(o.id)) {
            playChime();
            break;
          }
        }
      }
      next.forEach(o => knownIds.current.add(o.id));
      primed.current = true;

      setOrders(next);
      setError('');
      setLastFetch(Date.now());
    } catch (err) {
      console.error('Ops fetch failed:', err);
      setError(err.message || 'Failed to load orders');
    }
  }, [customer]);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const updateStatus = useCallback(async (orderId, newStatus) => {
    setBusyIds(prev => new Set(prev).add(orderId));
    // Optimistic update so the button feels instant.
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    try {
      const res = await fetch(getApiUrl(`/api/motong/custom-orders/${orderId}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || data.code !== 0) throw new Error(data.msg || 'Failed');
      fetchOrders();
    } catch (err) {
      console.error('Status update failed:', err);
      setError('Update failed — will retry on next refresh');
      fetchOrders();
    } finally {
      setBusyIds(prev => {
        const n = new Set(prev); n.delete(orderId); return n;
      });
    }
  }, [fetchOrders]);

  const counts = useMemo(() => {
    const c = { pending: 0, in_progress: 0, delivered: 0, cancelled: 0, all: orders.length, live: 0 };
    orders.forEach(o => { if (c[o.status] !== undefined) c[o.status]++; });
    // The Live tab shows both pending + making, so its count reflects the
    // whole active workspace at a glance.
    c.live = c.pending + c.in_progress;
    return c;
  }, [orders]);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const makingOrders = useMemo(() => orders.filter(o => o.status === 'in_progress'), [orders]);
  const historyList = useMemo(() => {
    if (tab === 'all') return orders;
    return orders.filter(o => o.status === tab);
  }, [orders, tab]);

  if (!customer) {
    return (
      <Page>
        <Header><Title>Ops</Title></Header>
        <Empty>Invalid ops URL — expected <code>/ops/&lt;customer&gt;</code> (e.g. <code>/ops/aldar</code>).</Empty>
      </Page>
    );
  }

  const stale = lastFetch && (Date.now() - lastFetch > REFRESH_MS * 3);
  const titleName = customer.charAt(0).toUpperCase() + customer.slice(1);

  return (
    <Page>
      <Header>
        <Title>{titleName} <span>counter</span></Title>
        <LiveTag $stale={stale}>{stale ? 'reconnecting…' : `live · refreshes every ${REFRESH_MS / 1000}s`}</LiveTag>
      </Header>

      {error && <ErrorBar>⚠ {error}</ErrorBar>}

      <Tabs>
        {TABS.map(t => (
          <Tab key={t.key} $active={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
            {counts[t.key] > 0 && <Badge $color={t.key === 'live' ? '#f59e0b' : '#334155'}>{counts[t.key]}</Badge>}
          </Tab>
        ))}
      </Tabs>

      {tab === 'live' ? (
        <Split>
          <Column>
            <ColHead $accent="#1c1207" $dot="#f59e0b">
              <h2>Pending <Badge $color="#f59e0b">{counts.pending}</Badge></h2>
              <When style={{ color: '#94a3b8', fontSize: 11 }}>next up</When>
            </ColHead>
            <ColBody>
              {pendingOrders.length === 0
                ? <ColEmpty>No pending orders.</ColEmpty>
                : pendingOrders.map(o => renderCard(o, busyIds, updateStatus))}
            </ColBody>
          </Column>
          <Column>
            <ColHead $accent="#08131f" $dot="#3b82f6">
              <h2>Making <Badge $color="#3b82f6">{counts.in_progress}</Badge></h2>
              <When style={{ color: '#94a3b8', fontSize: 11 }}>in progress</When>
            </ColHead>
            <ColBody>
              {makingOrders.length === 0
                ? <ColEmpty>Nothing being made right now.</ColEmpty>
                : makingOrders.map(o => renderCard(o, busyIds, updateStatus))}
            </ColBody>
          </Column>
        </Split>
      ) : (
        <Grid>
          {historyList.length === 0
            ? <Empty>No {tab === 'all' ? '' : tab} orders.</Empty>
            : historyList.map(o => renderCard(o, busyIds, updateStatus))}
        </Grid>
      )}
    </Page>
  );
}

/**
 * One order card. Pulled out of the render tree so the split view and the
 * history grid share the exact same visuals + action wiring.
 */
function renderCard(o, busyIds, updateStatus) {
  const s = STATUS[o.status] || STATUS.pending;
  const isBusy = busyIds.has(o.id);
  const totalItems = (o.items || []).reduce((n, it) => n + (it.quantity || 1), 0);
  const isPulse = o.status === 'pending';
  return (
    <Card key={o.id} $pulse={isPulse}>
      <CardTop>
        <TableBox>
          <small>Table</small>
          <strong>{o.tableNumber || o.roomOrTable || '—'}</strong>
        </TableBox>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <StatusPill $bg={s.bg} $color={s.color}>{s.label}</StatusPill>
          <When>{formatTimeAgo(o.created_at)}</When>
          <When style={{ color: '#64748b', fontSize: 11 }}>#{o.id} · {totalItems} item{totalItems === 1 ? '' : 's'}</When>
        </div>
      </CardTop>

      <Items>
        {(o.items || []).map((it, i) => (
          <li key={i}>
            <div>
              <span className="name">{it.name}</span>
              {it.desc && <span className="desc">{it.desc}</span>}
            </div>
            <span className="qty">×{it.quantity || 1}</span>
          </li>
        ))}
      </Items>

      {o.notes && <Notes>{o.notes}</Notes>}

      <Actions>
        {o.status === 'pending' && (
          <>
            <Btn $primary disabled={isBusy} onClick={() => updateStatus(o.id, 'in_progress')}>Start</Btn>
            <Btn $danger disabled={isBusy} onClick={() => updateStatus(o.id, 'cancelled')}>Cancel</Btn>
          </>
        )}
        {o.status === 'in_progress' && (
          <>
            <Btn $success disabled={isBusy} onClick={() => updateStatus(o.id, 'delivered')}>Serve</Btn>
            <Btn $danger disabled={isBusy} onClick={() => updateStatus(o.id, 'cancelled')}>Cancel</Btn>
          </>
        )}
        {(o.status === 'delivered' || o.status === 'cancelled') && (
          <Btn disabled>{s.label}</Btn>
        )}
      </Actions>
    </Card>
  );
}
