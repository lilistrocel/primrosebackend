const express = require('express');
const Joi = require('joi');
const db = require('../database/db');

const router = express.Router();

/**
 * CUSTOM ORDERS — bespoke per-customer menu pages (Aldar first).
 *
 * These orders are intentionally SEPARATE from the machine `orders` pipeline
 * so nothing here touches deviceOrderQueueList / editDeviceOrderStatus /
 * inventory. Lounge staff fulfill them by hand.
 *
 * customer_key: URL slug used at /:customer (e.g. "aldar"). Slug-only:
 *   lowercase, digits, dashes — no dots, slashes, or spaces. Keeps the URL
 *   safe and the DB key predictable across multiple bespoke pages.
 */

const CUSTOMER_KEY = Joi.string().lowercase().pattern(/^[a-z0-9-]{2,60}$/).required();

// tableNumber is the URL-embedded table identifier (from /aldar/<table>). Kept as
// a free-form short string so venues can use "12", "B-4", "Boardroom" etc.
const createSchema = Joi.object({
  items: Joi.array().min(1).max(50).items(Joi.object({
    id: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    name: Joi.string().max(200).required(),
    desc: Joi.string().max(500).allow('').optional(),
    section: Joi.string().max(120).allow('').optional(),
    ar: Joi.string().max(200).allow('').optional(),
    quantity: Joi.number().integer().min(1).max(20).default(1)
  })).required(),
  tableNumber: Joi.string().max(60).allow('', null).optional(),
  roomOrTable: Joi.string().max(120).allow('').optional(),
  notes: Joi.string().max(500).allow('').optional()
});

const statusSchema = Joi.object({
  status: Joi.string().valid('pending', 'in_progress', 'delivered', 'cancelled').required()
});

// POST /api/motong/custom-orders/:customer — create a new bespoke order
router.post('/:customer', (req, res) => {
  const { error: keyErr, value: customer } = CUSTOMER_KEY.validate(req.params.customer);
  if (keyErr) return res.status(400).json({ code: 400, msg: 'Invalid customer key', data: null });

  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ code: 400, msg: `Validation error: ${error.details[0].message}`, data: null });

  try {
    const result = db.db.prepare(`
      INSERT INTO custom_orders (customer_key, table_number, items_json, room_or_table, notes, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(customer, value.tableNumber || null, JSON.stringify(value.items), value.roomOrTable || null, value.notes || null);

    const tableLabel = value.tableNumber ? `table ${value.tableNumber}` : (value.roomOrTable || 'no table');
    console.log(`📇 Custom order #${result.lastInsertRowid} created for "${customer}" — ${tableLabel} — ${value.items.length} items`);

    res.json({
      code: 0,
      msg: 'Order received',
      data: {
        id: result.lastInsertRowid,
        customer_key: customer,
        status: 'pending',
        tableNumber: value.tableNumber || null,
        items: value.items,
        roomOrTable: value.roomOrTable || null,
        notes: value.notes || null
      }
    });
  } catch (err) {
    console.error('❌ Failed to create custom order:', err);
    res.status(500).json({ code: 500, msg: 'Failed to create order', data: null });
  }
});

// GET /api/motong/custom-orders/:customer — list this customer's recent orders
router.get('/:customer', (req, res) => {
  const { error: keyErr, value: customer } = CUSTOMER_KEY.validate(req.params.customer);
  if (keyErr) return res.status(400).json({ code: 400, msg: 'Invalid customer key', data: null });

  const status = req.query.status; // optional filter
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);

  try {
    const rows = status
      ? db.db.prepare(`SELECT * FROM custom_orders WHERE customer_key = ? AND status = ? ORDER BY created_at DESC LIMIT ?`).all(customer, status, limit)
      : db.db.prepare(`SELECT * FROM custom_orders WHERE customer_key = ? ORDER BY created_at DESC LIMIT ?`).all(customer, limit);

    const data = rows.map(r => ({
      id: r.id,
      customer_key: r.customer_key,
      tableNumber: r.table_number,
      items: JSON.parse(r.items_json),
      roomOrTable: r.room_or_table,
      notes: r.notes,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));

    res.json({ code: 0, msg: 'ok', data });
  } catch (err) {
    console.error('❌ Failed to list custom orders:', err);
    res.status(500).json({ code: 500, msg: 'Failed to list orders', data: [] });
  }
});

// PUT /api/motong/custom-orders/:id/status — update a single order's status
router.put('/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ code: 400, msg: 'Invalid id', data: null });

  const { error, value } = statusSchema.validate(req.body);
  if (error) return res.status(400).json({ code: 400, msg: `Validation error: ${error.details[0].message}`, data: null });

  try {
    const result = db.db.prepare(`
      UPDATE custom_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(value.status, id);
    if (result.changes === 0) return res.status(404).json({ code: 404, msg: 'Order not found', data: null });
    res.json({ code: 0, msg: 'Status updated', data: { id, status: value.status } });
  } catch (err) {
    console.error('❌ Failed to update custom order status:', err);
    res.status(500).json({ code: 500, msg: 'Failed to update status', data: null });
  }
});

module.exports = router;
