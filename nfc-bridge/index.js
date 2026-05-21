const { NFC } = require('nfc-pcsc');
const { WebSocketServer } = require('ws');
const { URL } = require('url');

const PORT = Number(process.env.NFC_BRIDGE_PORT) || 8765;
const HOST = process.env.NFC_BRIDGE_HOST || '127.0.0.1';
const TOKEN = (process.env.NFC_BRIDGE_TOKEN || '').trim();

const wss = new WebSocketServer({
  host: HOST,
  port: PORT,
  verifyClient: (info, done) => {
    // If no token is configured, allow all (local dev).
    if (!TOKEN) return done(true);
    try {
      const parsed = new URL(info.req.url, 'http://placeholder.local');
      const sent = parsed.searchParams.get('token');
      if (sent && sent === TOKEN) return done(true);
      return done(false, 401, 'Unauthorized');
    } catch (err) {
      return done(false, 400, 'Bad request');
    }
  }
});
const state = { reader: null, readerName: null };

function broadcast(payload) {
  const msg = JSON.stringify({ ...payload, ts: Date.now() });
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(msg);
  }
}

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

wss.on('connection', (ws) => {
  log('client connected');
  ws.send(JSON.stringify({
    event: 'status',
    readerConnected: Boolean(state.reader),
    readerName: state.readerName,
    ts: Date.now(),
  }));
  ws.on('close', () => log('client disconnected'));
});

log(`websocket listening on ws://${HOST}:${PORT}`);

const nfc = new NFC();

nfc.on('reader', (reader) => {
  log('reader attached:', reader.name);
  state.reader = reader;
  state.readerName = reader.name;
  broadcast({ event: 'reader_connected', readerName: reader.name });

  // The ACR122U returns an ATR for non-ISO-14443-4 cards (Mifare Classic, etc.)
  // that nfc-pcsc does not auto-parse. Reading the UID via APDU works for both.
  reader.autoProcessing = false;

  reader.on('card', async (card) => {
    try {
      // APDU: Get Data - UID. FF CA 00 00 00 -> <UID> 90 00
      const res = await reader.transmit(Buffer.from([0xff, 0xca, 0x00, 0x00, 0x00]), 12);
      const sw1 = res[res.length - 2];
      const sw2 = res[res.length - 1];
      if (sw1 !== 0x90 || sw2 !== 0x00) {
        broadcast({ event: 'card_error', reason: `APDU status ${sw1.toString(16)}${sw2.toString(16)}` });
        return;
      }
      const uid = res.slice(0, res.length - 2).toString('hex').toUpperCase();
      const atr = card.atr ? Buffer.from(card.atr).toString('hex').toUpperCase() : null;
      log('card:', uid);
      broadcast({ event: 'card', uid, atr, readerName: reader.name });
    } catch (err) {
      log('card read error:', err.message);
      broadcast({ event: 'card_error', reason: err.message });
    }
  });

  reader.on('card.off', () => {
    broadcast({ event: 'card_removed', readerName: reader.name });
  });

  reader.on('error', (err) => {
    log('reader error:', err.message);
    broadcast({ event: 'reader_error', reason: err.message });
  });

  reader.on('end', () => {
    log('reader removed:', reader.name);
    if (state.reader === reader) {
      state.reader = null;
      state.readerName = null;
    }
    broadcast({ event: 'reader_disconnected', readerName: reader.name });
  });
});

nfc.on('error', (err) => {
  log('nfc error:', err.message);
  broadcast({ event: 'nfc_error', reason: err.message });
});

function shutdown() {
  log('shutting down');
  wss.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
