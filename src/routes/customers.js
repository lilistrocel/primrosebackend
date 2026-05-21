const express = require('express');
const Joi = require('joi');
const db = require('../database/db');

const router = express.Router();

const normalizeUid = (uid) => String(uid || '').trim().toUpperCase();
const normalizePin = (pin) => String(pin || '').trim();
const PIN_PATTERN = /^\d{4,8}$/;

const createCustomerSchema = Joi.object({
  // Either uid (NFC) or no-uid (server-generates PIN). Both are valid.
  uid: Joi.string().trim().min(4).max(32).allow('', null),
  pin: Joi.string().trim().pattern(PIN_PATTERN).allow('', null),
  name: Joi.string().trim().min(1).max(100).required(),
  organization: Joi.string().trim().min(1).max(100).required(),
  nickname: Joi.string().trim().max(50).allow('', null),
  phone: Joi.string().trim().max(32).allow('', null)
});

const updateCustomerSchema = Joi.object({
  uid: Joi.string().trim().min(4).max(32).allow('', null),
  pin: Joi.string().trim().pattern(PIN_PATTERN).allow('', null),
  name: Joi.string().trim().min(1).max(100),
  organization: Joi.string().trim().min(1).max(100),
  nickname: Joi.string().trim().max(50).allow('', null),
  phone: Joi.string().trim().max(32).allow('', null),
  balance: Joi.number().min(0)
}).min(1);

router.get('/', (req, res) => {
  try {
    const customers = db.getAllCustomers();
    res.json({ code: 0, msg: 'ok', data: customers });
  } catch (error) {
    console.error('❌ Error listing customers:', error);
    res.status(500).json({ code: 500, msg: 'Internal server error', data: [] });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ code: 400, msg: 'Invalid id', data: null });
    }
    const { error, value } = updateCustomerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ code: 400, msg: error.details[0].message, data: null });
    }
    const patch = { ...value };
    if (patch.uid !== undefined) patch.uid = patch.uid ? normalizeUid(patch.uid) : null;
    if (patch.pin !== undefined) patch.pin = patch.pin ? normalizePin(patch.pin) : null;
    if (patch.uid) {
      const collision = db.getCustomerByUid(patch.uid);
      if (collision && collision.id !== id) {
        return res.status(409).json({ code: 409, msg: 'UID is used by another customer', data: collision });
      }
    }
    if (patch.pin) {
      const collision = db.getCustomerByPin(patch.pin);
      if (collision && collision.id !== id) {
        return res.status(409).json({ code: 409, msg: 'PIN is used by another customer', data: null });
      }
    }
    let updated;
    try {
      updated = db.updateCustomer(id, patch);
    } catch (err) {
      return res.status(400).json({ code: 400, msg: err.message, data: null });
    }
    if (!updated) return res.status(404).json({ code: 404, msg: 'Customer not found', data: null });
    res.json({ code: 0, msg: 'Customer updated', data: updated });
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    res.status(500).json({ code: 500, msg: 'Internal server error', data: null });
  }
});

router.get('/by-pin/:pin', (req, res) => {
  try {
    const pin = normalizePin(req.params.pin);
    if (!PIN_PATTERN.test(pin)) {
      return res.status(400).json({ code: 400, msg: 'PIN must be 4-8 digits', data: null });
    }
    const customer = db.getCustomerByPin(pin);
    if (!customer) {
      return res.status(404).json({ code: 404, msg: 'PIN not recognized', data: null });
    }
    res.json({ code: 0, msg: 'ok', data: customer });
  } catch (error) {
    console.error('❌ Error looking up customer by pin:', error);
    res.status(500).json({ code: 500, msg: 'Internal server error', data: null });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ code: 400, msg: 'Invalid id', data: null });
    }
    const existing = db.getCustomerById(id);
    if (!existing) {
      return res.status(404).json({ code: 404, msg: 'Customer not found', data: null });
    }
    const orderCount = db.countOrdersForCustomer(id);
    if (orderCount > 0) {
      return res.status(409).json({
        code: 409,
        msg: `Customer has ${orderCount} linked order(s) and cannot be deleted`,
        data: { id, orderCount }
      });
    }
    db.deleteCustomer(id);
    res.json({ code: 0, msg: 'Customer deleted', data: { id } });
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    res.status(500).json({ code: 500, msg: 'Internal server error', data: null });
  }
});

router.get('/by-uid/:uid', (req, res) => {
  try {
    const uid = normalizeUid(req.params.uid);
    const customer = db.getCustomerByUid(uid);
    if (!customer) {
      return res.status(404).json({ code: 404, msg: 'Customer not found', data: { uid } });
    }
    res.json({ code: 0, msg: 'ok', data: customer });
  } catch (error) {
    console.error('❌ Error looking up customer by uid:', error);
    res.status(500).json({ code: 500, msg: 'Internal server error', data: null });
  }
});

router.post('/', (req, res) => {
  try {
    const { error, value } = createCustomerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ code: 400, msg: error.details[0].message, data: null });
    }
    const uid = value.uid ? normalizeUid(value.uid) : null;
    const requestedPin = value.pin ? normalizePin(value.pin) : null;
    if (uid) {
      const existingUid = db.getCustomerByUid(uid);
      if (existingUid) {
        return res.status(409).json({ code: 409, msg: 'Card already registered', data: existingUid });
      }
    }
    if (requestedPin) {
      const existingPin = db.getCustomerByPin(requestedPin);
      if (existingPin) {
        return res.status(409).json({ code: 409, msg: 'PIN already in use', data: null });
      }
    }
    const customer = db.insertCustomer({
      uid,
      pin: requestedPin,
      name: value.name,
      organization: value.organization,
      nickname: value.nickname || null,
      phone: value.phone || null
    });
    res.status(201).json({ code: 0, msg: 'Customer registered', data: customer });
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    res.status(500).json({ code: 500, msg: 'Internal server error', data: null });
  }
});

module.exports = router;
