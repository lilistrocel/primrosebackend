const express = require('express');
const router = express.Router();
const db = require('../database/db');
const Joi = require('joi');
const webSocketManager = require('../websocket/WebSocketManager');

// Validation schemas
const updateSettingSchema = Joi.object({
  value: Joi.alternatives().try(
    Joi.string(),
    Joi.boolean(),
    Joi.number()
  ).required()
});

/**
 * GET /api/motong/system-settings
 * Get all system settings
 */
router.get('/', (req, res) => {
  try {
    console.log('⚙️ Fetching all system settings...');
    
    const settings = db.getAllSystemSettings();
    
    console.log(`📊 Found ${settings.length} system settings`);
    
    // Transform to camelCase and convert values
    const transformedSettings = settings.map(setting => {
      let value = setting.setting_value;
      
      // Convert value based on type
      if (setting.setting_type === 'boolean') {
        value = setting.setting_value === 'true';
      } else if (setting.setting_type === 'number') {
        value = parseFloat(setting.setting_value);
      }
      
      return {
        id: setting.id,
        key: setting.setting_key,
        value: value,
        type: setting.setting_type,
        description: setting.description,
        createdAt: setting.created_at,
        updatedAt: setting.updated_at
      };
    });
    
    res.json({
      code: 0,
      msg: 'Request successfully',
      data: transformedSettings
    });
    
  } catch (error) {
    console.error('❌ Error fetching system settings:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to fetch system settings',
      data: null
    });
  }
});

/**
 * GET /api/motong/system-settings/:key
 * Get specific system setting by key
 */
router.get('/:key', (req, res) => {
  try {
    const { key } = req.params;
    
    console.log(`⚙️ Fetching system setting: ${key}`);
    
    const setting = db.getSystemSetting(key);
    
    if (!setting) {
      return res.status(404).json({
        code: 1,
        msg: 'System setting not found',
        data: null
      });
    }
    
    // Transform to camelCase
    const transformedSetting = {
      id: setting.id,
      key: setting.setting_key,
      value: setting.setting_value,
      type: setting.setting_type,
      description: setting.description,
      createdAt: setting.created_at,
      updatedAt: setting.updated_at
    };
    
    res.json({
      code: 0,
      msg: 'Request successfully',
      data: transformedSetting
    });
    
  } catch (error) {
    console.error('❌ Error fetching system setting:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to fetch system setting',
      data: null
    });
  }
});

/**
 * PUT /api/motong/system-settings/:key
 * Update system setting value
 */
router.put('/:key', (req, res) => {
  try {
    const { key } = req.params;
    
    console.log(`⚙️ Updating system setting: ${key}`);
    console.log('📝 Request body:', req.body);
    
    // Validate input
    const { error, value } = updateSettingSchema.validate(req.body);
    if (error) {
      console.error('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        code: 1,
        msg: `Validation error: ${error.details[0].message}`,
        data: null
      });
    }
    
    // Check if setting exists
    const existingSetting = db.getSystemSetting(key);
    if (!existingSetting) {
      return res.status(404).json({
        code: 1,
        msg: 'System setting not found',
        data: null
      });
    }
    
    const success = db.updateSystemSetting(key, value.value);
    
    if (!success) {
      return res.status(500).json({
        code: 1,
        msg: 'Failed to update system setting',
        data: null
      });
    }
    
    console.log(`✅ Updated system setting: ${key} = ${value.value}`);
    
    // Log important setting changes and notify WebSocket clients
    if (key === 'frontend_enabled') {
      console.log(`🔄 FRONTEND ${value.value ? 'ENABLED' : 'DISABLED'}`);
      const message = value.value ? null : db.getOutOfOrderMessage();
      webSocketManager.notifyFrontendStatusChange(value.value, message);
    } else if (key === 'test_mode') {
      console.log(`🧪 TEST MODE ${value.value ? 'ENABLED' : 'DISABLED'}`);
      webSocketManager.notifyTestModeChange(value.value);
    }
    
    // General system setting change notification
    webSocketManager.notifySystemSettingChange(key, value.value);
    
    res.json({
      code: 0,
      msg: 'System setting updated successfully',
      data: { 
        key: key, 
        value: value.value,
        updated: true
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating system setting:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to update system setting',
      data: null
    });
  }
});

/**
 * GET /api/motong/system-settings/status/frontend
 * Quick check if frontend is enabled (for kiosk)
 */
router.get('/status/frontend', (req, res) => {
  try {
    console.log('🔍 Checking frontend status...');
    
    const isEnabled = db.isFrontendEnabled();
    const outOfOrderMessage = db.getOutOfOrderMessage();
    
    console.log(`📱 Frontend status: ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    res.json({
      code: 0,
      msg: 'Request successfully',
      data: {
        enabled: isEnabled,
        message: isEnabled ? null : outOfOrderMessage
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking frontend status:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to check frontend status',
      data: null
    });
  }
});

/**
 * GET /api/motong/system-settings/status/test-mode
 * Quick check if test mode is enabled (for debugging)
 */
router.get('/status/test-mode', (req, res) => {
  try {
    console.log('🔍 Checking test mode status...');
    
    const isTestMode = db.isTestMode();
    
    console.log(`🧪 Test mode status: ${isTestMode ? 'ENABLED' : 'DISABLED'}`);
    
    res.json({
      code: 0,
      msg: 'Request successfully',
      data: {
        testMode: isTestMode,
        debugTypeList: isTestMode ? 'typeList100' : 'typeList2'
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking test mode status:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to check test mode status',
      data: null
    });
  }
});

/**
 * GET /api/motong/system-settings/status/payment
 * Get payment status and daily PIN for admin
 */
router.get('/status/payment', (req, res) => {
  try {
    console.log('💳 Checking payment status...');

    const isPaymentEnabled = db.isPaymentEnabled();
    const dailyPin = db.getDailyPin();

    console.log(`💳 Payment status: ${isPaymentEnabled ? 'ENABLED' : 'DISABLED (PIN required)'}`);

    res.json({
      code: 0,
      msg: 'Request successfully',
      data: {
        paymentEnabled: isPaymentEnabled,
        dailyPin: dailyPin // Only show in admin, not in kiosk
      }
    });

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to check payment status',
      data: null
    });
  }
});

/**
 * GET /api/motong/system-settings/kiosk/payment-status
 * Get payment status for kiosk (no PIN exposed)
 */
router.get('/kiosk/payment-status', (req, res) => {
  try {
    const isPaymentEnabled = db.isPaymentEnabled();

    res.json({
      code: 0,
      msg: 'Request successfully',
      data: {
        paymentEnabled: isPaymentEnabled
      }
    });

  } catch (error) {
    console.error('❌ Error checking payment status for kiosk:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to check payment status',
      data: null
    });
  }
});

/**
 * POST /api/motong/system-settings/verify-pin
 * Verify daily PIN for checkout bypass
 */
router.post('/verify-pin', (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        code: 1,
        msg: 'PIN is required',
        data: null
      });
    }

    console.log('🔐 Verifying daily PIN...');

    const isValid = db.verifyDailyPin(pin);

    if (isValid) {
      console.log('✅ PIN verified successfully');
    } else {
      console.log('❌ Invalid PIN entered');
    }

    res.json({
      code: 0,
      msg: isValid ? 'PIN verified' : 'Invalid PIN',
      data: {
        valid: isValid
      }
    });

  } catch (error) {
    console.error('❌ Error verifying PIN:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to verify PIN',
      data: null
    });
  }
});

/**
 * POST /api/motong/system-settings/toggle/:key
 * Quick toggle for boolean settings
 */
router.post('/toggle/:key', (req, res) => {
  try {
    const { key } = req.params;
    
    console.log(`⚙️ Toggling system setting: ${key}`);
    
    // Check if setting exists and is boolean
    const existingSetting = db.getSystemSetting(key);
    if (!existingSetting) {
      return res.status(404).json({
        code: 1,
        msg: 'System setting not found',
        data: null
      });
    }
    
    if (existingSetting.setting_type !== 'boolean') {
      return res.status(400).json({
        code: 1,
        msg: 'Can only toggle boolean settings',
        data: null
      });
    }
    
    // Toggle the value
    const newValue = !existingSetting.setting_value;
    const success = db.updateSystemSetting(key, newValue);
    
    if (!success) {
      return res.status(500).json({
        code: 1,
        msg: 'Failed to toggle system setting',
        data: null
      });
    }
    
    console.log(`✅ Toggled ${key}: ${existingSetting.setting_value} → ${newValue}`);
    
    // Log important setting changes and notify WebSocket clients
    if (key === 'frontend_enabled') {
      console.log(`🔄 FRONTEND ${newValue ? 'ENABLED' : 'DISABLED'}`);
      const message = newValue ? null : db.getOutOfOrderMessage();
      webSocketManager.notifyFrontendStatusChange(newValue, message);
    } else if (key === 'test_mode') {
      console.log(`🧪 TEST MODE ${newValue ? 'ENABLED' : 'DISABLED'}`);
      webSocketManager.notifyTestModeChange(newValue);
    } else if (key === 'payment_enabled') {
      console.log(`💳 PAYMENT ${newValue ? 'ENABLED' : 'DISABLED (PIN required)'}`);
    }

    // General system setting change notification
    webSocketManager.notifySystemSettingChange(key, newValue);

    // Build response data
    const responseData = {
      key: key,
      previousValue: existingSetting.setting_value,
      newValue: newValue,
      toggled: true
    };

    // Include daily PIN in response when payment is disabled
    if (key === 'payment_enabled' && !newValue) {
      responseData.dailyPin = db.getDailyPin();
    }

    res.json({
      code: 0,
      msg: 'System setting toggled successfully',
      data: responseData
    });
    
  } catch (error) {
    console.error('❌ Error toggling system setting:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to toggle system setting',
      data: null
    });
  }
});

module.exports = router;
