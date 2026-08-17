/**
 * Aldar bespoke-menu ordering layer.
 *
 * Non-invasive: the source HTML for the menu is untouched. This script binds
 * click handlers to every `.item`, tracks selections in memory, and lets the
 * guest submit an order to /api/motong/custom-orders/aldar.
 *
 * Design palette pulled from the menu itself:
 *   --ink #000, --ink-soft #515150, --ink-mute #808282, --tan #D6AC65,
 *   --clay #F0F1EF, --ceramic #D7D1CA
 * Fonts already loaded on <body> as --f-en (Poppins) / --f-ar (Almarai).
 */
(function () {
  'use strict';

  var CUSTOMER = 'aldar';
  var API_URL = '/api/motong/custom-orders/' + CUSTOMER;

  // Table detected from URL: /aldar/<table>. Empty when URL is /aldar or /aldar/.
  // Slug rule matches the nginx-served path (no query string here).
  var TABLE_NUMBER = (function () {
    var m = location.pathname.match(/^\/aldar\/([^/?#]+)\/?$/);
    if (!m) return '';
    var raw = decodeURIComponent(m[1]).trim();
    // Guard against obvious junk / accidental asset paths
    if (!raw || raw === 'index.html' || /\.[a-z0-9]{2,5}$/i.test(raw)) return '';
    return raw.slice(0, 60);
  })();

  // ------------------------------------------------------------------ styles
  var css = [
    ':root { --aldar-order-tan: #D6AC65; --aldar-order-ink: #000; --aldar-order-soft: #515150; --aldar-order-mute: #808282; --aldar-order-clay: #F0F1EF; }',
    '.item { cursor: pointer; transition: background-color .18s ease, border-color .18s ease; position: relative; }',
    '.item:hover { background: rgba(214,172,101,.06); }',
    '.item.is-selected { background: rgba(214,172,101,.10); box-shadow: inset 3px 0 0 var(--aldar-order-tan); }',
    '.item .item__badge { position: absolute; top: 50%; right: -8px; transform: translateY(-50%); width: 24px; height: 24px; border-radius: 50%; background: var(--aldar-order-tan); color: #fff; display: flex; align-items: center; justify-content: center; font-family: var(--f-en); font-weight: 600; font-size: 12px; opacity: 0; transition: opacity .18s ease, transform .18s ease; pointer-events: none; }',
    '.item.is-selected .item__badge { opacity: 1; transform: translateY(-50%) scale(1); }',

    /* Floating pill */
    '.aldar-pill { position: fixed; bottom: 24px; right: 24px; z-index: 60; display: flex; align-items: center; gap: 14px; padding: 14px 22px; border-radius: 999px; background: var(--aldar-order-ink); color: #fff; font-family: var(--f-en); font-size: 14px; letter-spacing: .04em; text-transform: uppercase; cursor: pointer; box-shadow: 0 8px 30px rgba(0,0,0,.18); border: none; transform: translateY(120%); transition: transform .28s cubic-bezier(.22,.61,.36,1), background-color .18s ease; }',
    '.aldar-pill.is-visible { transform: translateY(0); }',
    '.aldar-pill:hover { background: var(--aldar-order-tan); color: var(--aldar-order-ink); }',
    '.aldar-pill__count { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; padding: 0 6px; border-radius: 999px; background: var(--aldar-order-tan); color: var(--aldar-order-ink); font-weight: 700; font-size: 13px; letter-spacing: 0; }',
    '.aldar-pill:hover .aldar-pill__count { background: var(--aldar-order-ink); color: var(--aldar-order-tan); }',

    /* Overlay */
    '.aldar-overlay { position: fixed; inset: 0; z-index: 70; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,.42); backdrop-filter: blur(6px); padding: 24px; }',
    '.aldar-overlay.is-open { display: flex; }',
    '.aldar-sheet { width: 100%; max-width: 520px; max-height: 88vh; background: var(--aldar-order-clay); border-radius: 4px; display: flex; flex-direction: column; box-shadow: 0 30px 80px rgba(0,0,0,.30); overflow: hidden; font-family: var(--f-en); color: var(--aldar-order-ink); }',
    '.aldar-sheet__head { display: flex; align-items: baseline; justify-content: space-between; padding: 22px 26px 12px; border-bottom: 1px solid rgba(0,0,0,.08); }',
    '.aldar-sheet__title { font-family: var(--f-en); font-weight: 300; font-size: 22px; letter-spacing: .02em; }',
    '.aldar-sheet__close { background: none; border: none; color: var(--aldar-order-soft); font-size: 22px; cursor: pointer; line-height: 1; padding: 4px 8px; }',
    '.aldar-sheet__close:hover { color: var(--aldar-order-ink); }',
    '.aldar-sheet__body { padding: 12px 26px 4px; overflow-y: auto; flex: 1; }',
    '.aldar-sheet__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,.06); }',
    '.aldar-sheet__row:last-child { border-bottom: none; }',
    '.aldar-sheet__row-name { flex: 1; font-size: 15px; }',
    '.aldar-sheet__row-name .ar { display: block; font-family: var(--f-ar); direction: rtl; font-size: 13px; color: var(--aldar-order-mute); margin-top: 2px; }',
    '.aldar-sheet__qty { display: inline-flex; align-items: center; gap: 8px; }',
    '.aldar-sheet__qty button { width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(0,0,0,.14); background: #fff; color: var(--aldar-order-ink); font-size: 16px; line-height: 1; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }',
    '.aldar-sheet__qty button:hover { border-color: var(--aldar-order-tan); color: var(--aldar-order-tan); }',
    '.aldar-sheet__qty span { min-width: 22px; text-align: center; font-weight: 500; }',
    '.aldar-sheet__fields { padding: 12px 26px 20px; display: grid; gap: 12px; }',
    '.aldar-sheet__fields label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; color: var(--aldar-order-mute); margin-bottom: 6px; }',
    '.aldar-sheet__fields input, .aldar-sheet__fields textarea { width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1px solid rgba(0,0,0,.14); background: #fff; font-family: var(--f-en); font-size: 15px; color: var(--aldar-order-ink); border-radius: 2px; }',
    '.aldar-sheet__fields input:focus, .aldar-sheet__fields textarea:focus { outline: none; border-color: var(--aldar-order-tan); }',
    '.aldar-sheet__fields textarea { min-height: 72px; resize: vertical; }',
    '.aldar-sheet__foot { padding: 16px 26px 22px; border-top: 1px solid rgba(0,0,0,.08); display: flex; flex-direction: column; gap: 10px; }',
    '.aldar-sheet__tablechip { display: inline-flex; align-items: center; gap: 8px; margin-left: 12px; padding: 4px 12px; background: var(--aldar-order-tan); color: var(--aldar-order-ink); font-family: var(--f-en); font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; border-radius: 999px; vertical-align: middle; }',
    '.aldar-sheet__submit { width: 100%; padding: 16px 22px; background: var(--aldar-order-ink); color: #fff; border: none; font-family: var(--f-en); font-weight: 500; font-size: 14px; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; border-radius: 2px; transition: background-color .18s ease; }',
    '.aldar-sheet__submit:hover:not(:disabled) { background: var(--aldar-order-tan); color: var(--aldar-order-ink); }',
    '.aldar-sheet__submit:disabled { opacity: 0.5; cursor: not-allowed; }',
    '.aldar-sheet__error { color: #a02020; font-size: 13px; min-height: 18px; text-align: center; }',

    /* Success confirmation */
    '.aldar-sheet--success { padding: 40px 30px; text-align: center; }',
    '.aldar-sheet--success h3 { font-family: var(--f-en); font-weight: 300; font-size: 26px; margin: 0 0 10px; }',
    '.aldar-sheet--success p { color: var(--aldar-order-soft); font-size: 15px; margin: 0 0 24px; }',
    '.aldar-sheet--success .tick { display: inline-flex; width: 56px; height: 56px; border-radius: 50%; background: var(--aldar-order-tan); color: #fff; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 18px; }',
    '.aldar-sheet--success button { padding: 10px 22px; background: transparent; border: 1px solid var(--aldar-order-ink); color: var(--aldar-order-ink); font-family: var(--f-en); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; cursor: pointer; border-radius: 999px; }',
    '.aldar-sheet--success button:hover { background: var(--aldar-order-ink); color: #fff; }',

    /* Small-screen tweaks */
    '@media (max-width: 480px) { .aldar-pill { bottom: 16px; right: 16px; padding: 12px 18px; font-size: 13px; } .aldar-sheet { max-height: 92vh; } }'
  ].join('\n');

  var style = document.createElement('style');
  style.setAttribute('data-aldar-order', '');
  style.textContent = css;
  document.head.appendChild(style);

  // ---------------------------------------------------------------- state
  // Map from item DOM element -> {id, name, desc, section, ar, quantity}
  var selection = new Map();

  function readItem(li) {
    var nameEl = li.querySelector('.item__name');
    var descEl = li.querySelector('.item__desc');
    var arEl = li.querySelector('.item__ar');
    var section = li.closest('section');
    var sectionTitle = section ? (section.querySelector('.sec__title, h2, h1') || {}).textContent : '';
    return {
      name: (nameEl && nameEl.textContent || '').trim(),
      desc: (descEl && descEl.textContent || '').trim(),
      ar: (arEl && arEl.textContent || '').trim(),
      section: (sectionTitle || '').trim().replace(/\s+/g, ' '),
      quantity: 1
    };
  }

  function updatePill() {
    var totalQty = 0;
    selection.forEach(function (v) { totalQty += v.quantity; });
    if (totalQty > 0) {
      pill.classList.add('is-visible');
      pillCount.textContent = String(totalQty);
    } else {
      pill.classList.remove('is-visible');
    }
  }

  function toggleItem(li) {
    if (selection.has(li)) {
      selection.delete(li);
      li.classList.remove('is-selected');
    } else {
      selection.set(li, readItem(li));
      li.classList.add('is-selected');
      var badge = li.querySelector('.item__badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'item__badge';
        badge.textContent = '✓';
        li.appendChild(badge);
      }
    }
    updatePill();
  }

  // ---------------------------------------------------------- floating pill
  var pill = document.createElement('button');
  pill.className = 'aldar-pill';
  pill.setAttribute('aria-label', 'Review order');
  pill.innerHTML = '<span>Review order</span><span class="aldar-pill__count">0</span>';
  document.body.appendChild(pill);
  var pillCount = pill.querySelector('.aldar-pill__count');

  // -------------------------------------------------------------- overlay
  var overlay = document.createElement('div');
  overlay.className = 'aldar-overlay';
  // When the URL bakes in a table (/aldar/1), we drop the free-text
  // Room/table input entirely and show a "TABLE X" chip in the header instead.
  var tableChipHtml = TABLE_NUMBER
    ? '<span class="aldar-sheet__tablechip" title="Order will be delivered to this table">Table ' + escapeHtml(TABLE_NUMBER) + '</span>'
    : '';
  var roomFieldHtml = TABLE_NUMBER ? '' : [
    '<div><label for="aldar-room">Room / table (optional)</label>',
    '  <input id="aldar-room" type="text" maxlength="120" placeholder="e.g. Boardroom, Guest 3" autocomplete="off" /></div>'
  ].join('');

  overlay.innerHTML = [
    '<div class="aldar-sheet" role="dialog" aria-modal="true" aria-labelledby="aldar-sheet-title">',
    '  <div class="aldar-sheet__head">',
    '    <div class="aldar-sheet__title" id="aldar-sheet-title">Your selection' + tableChipHtml + '</div>',
    '    <button type="button" class="aldar-sheet__close" aria-label="Close">×</button>',
    '  </div>',
    '  <div class="aldar-sheet__body" data-body></div>',
    '  <div class="aldar-sheet__fields">',
    '    ' + roomFieldHtml,
    '    <div><label for="aldar-notes">Notes (optional)</label>',
    '      <textarea id="aldar-notes" maxlength="500" placeholder="Anything else we should know?"></textarea></div>',
    '  </div>',
    '  <div class="aldar-sheet__foot">',
    '    <div class="aldar-sheet__error" data-error></div>',
    '    <button type="button" class="aldar-sheet__submit" data-submit>Send order</button>',
    '  </div>',
    '</div>'
  ].join('');
  document.body.appendChild(overlay);

  var sheet = overlay.querySelector('.aldar-sheet');
  var body = overlay.querySelector('[data-body]');
  var errorEl = overlay.querySelector('[data-error]');
  var submitBtn = overlay.querySelector('[data-submit]');
  var roomInput = overlay.querySelector('#aldar-room');
  var notesInput = overlay.querySelector('#aldar-notes');

  function renderBody() {
    body.innerHTML = '';
    if (selection.size === 0) {
      body.innerHTML = '<div style="padding: 30px 0; text-align: center; color: var(--aldar-order-mute);">Tap an item on the menu to add it here.</div>';
      submitBtn.disabled = true;
      return;
    }
    submitBtn.disabled = false;
    selection.forEach(function (item, li) {
      var row = document.createElement('div');
      row.className = 'aldar-sheet__row';
      var nameHtml = '<div class="aldar-sheet__row-name"><div>' + escapeHtml(item.name) + '</div>' + (item.ar ? '<span class="ar">' + escapeHtml(item.ar) + '</span>' : '') + '</div>';
      row.innerHTML = nameHtml +
        '<div class="aldar-sheet__qty">' +
        '  <button type="button" data-op="dec" aria-label="Decrease">−</button>' +
        '  <span data-qty>' + item.quantity + '</span>' +
        '  <button type="button" data-op="inc" aria-label="Increase">+</button>' +
        '</div>';
      row.querySelector('[data-op="dec"]').addEventListener('click', function () {
        if (item.quantity <= 1) {
          selection.delete(li);
          li.classList.remove('is-selected');
        } else {
          item.quantity -= 1;
        }
        renderBody();
        updatePill();
      });
      row.querySelector('[data-op="inc"]').addEventListener('click', function () {
        if (item.quantity < 20) item.quantity += 1;
        renderBody();
        updatePill();
      });
      body.appendChild(row);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; });
  }

  function openOverlay() {
    errorEl.textContent = '';
    renderBody();
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeOverlay() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  pill.addEventListener('click', openOverlay);
  overlay.querySelector('.aldar-sheet__close').addEventListener('click', closeOverlay);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeOverlay(); });

  // ---------------------------------------------------------- submit flow
  submitBtn.addEventListener('click', async function () {
    if (submitBtn.disabled) return;
    var items = [];
    selection.forEach(function (item) { items.push(item); });
    if (items.length === 0) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    errorEl.textContent = '';

    try {
      var res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items,
          tableNumber: TABLE_NUMBER || null,
          // roomOrTable only present when there's no URL-embedded table
          roomOrTable: roomInput ? roomInput.value.trim() : '',
          notes: notesInput.value.trim()
        })
      });
      var data = await res.json();
      if (!res.ok || data.code !== 0) throw new Error(data.msg || 'Request failed');
      showSuccess();
    } catch (err) {
      console.error('Aldar order submit failed:', err);
      errorEl.textContent = 'Could not send order — please try again or ask an attendant.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send order';
    }
  });

  function showSuccess() {
    // Reset selection so the guest starts fresh next time
    selection.forEach(function (_, li) { li.classList.remove('is-selected'); });
    selection.clear();
    updatePill();
    if (roomInput) roomInput.value = '';
    notesInput.value = '';

    sheet.innerHTML = [
      '<div class="aldar-sheet--success">',
      '  <div class="tick">✓</div>',
      '  <h3>Order received</h3>',
      '  <p>An attendant will bring it over shortly.</p>',
      '  <button type="button" data-close>Return to menu</button>',
      '</div>'
    ].join('');
    sheet.querySelector('[data-close]').addEventListener('click', function () {
      closeOverlay();
      // Rebuild the sheet contents for the next order (simplest: hard reload
      // avoids threading state through the confirmation, and the guest usually
      // takes a moment before ordering again anyway).
      setTimeout(function () { location.reload(); }, 250);
    });
  }

  // ---------------------------------------------------- bind click handlers
  var items = document.querySelectorAll('.item');
  items.forEach(function (li) {
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.addEventListener('click', function () { toggleItem(li); });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItem(li); }
    });
  });

  console.log('[aldar] ordering layer ready —', items.length, 'items bound');
})();
