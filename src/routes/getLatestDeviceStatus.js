const express = require('express');
const Joi = require('joi');
const db = require('../database/db');

const router = express.Router();

// Validation schema for getLatestDeviceStatus request
const getLatestDeviceStatusSchema = Joi.object({
  deviceId: Joi.number().integer().default(1)
});

/**
 * GET LATEST DEVICE STATUS - Frontend endpoint for ingredient levels
 * Retrieves the most recent device status data for the frontend DeviceStatus page
 */
router.post('/getLatestDeviceStatus', async (req, res) => {
  try {
    console.log('📊 getLatestDeviceStatus called with:', req.body);
    
    // Validate request
    const { error, value } = getLatestDeviceStatusSchema.validate(req.body);
    if (error) {
      console.log('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        code: 400,
        msg: 'Invalid request parameters: ' + error.details[0].message,
        data: null
      });
    }

    const { deviceId } = value;
    
    // Get latest device status from database
    const deviceStatus = db.getLatestDeviceStatus(deviceId);
    
    if (deviceStatus) {
      console.log(`✅ Found device status for device ${deviceId}:`, {
        id: deviceStatus.id,
        updated_at: deviceStatus.updated_at,
        hasIngredientData: !!deviceStatus.matter_status_json
      });

      // Return the latest status
      res.json({
        code: 0,
        msg: 'Device status retrieved successfully',
        data: {
          id: deviceStatus.id,
          deviceId: deviceStatus.device_id,
          matterStatusJson: deviceStatus.matter_status_json,
          deviceStatusJson: deviceStatus.device_status_json,
          updatedAt: deviceStatus.updated_at
        }
      });
    } else {
      console.log(`📋 No device status found for device ${deviceId}`);
      
      // Return empty result (frontend will use fallback data)
      res.json({
        code: 404,
        msg: 'No device status found',
        data: null
      });
    }

  } catch (error) {
    console.error('❌ Error retrieving device status:', error);
    res.status(500).json({
      code: 500,
      msg: 'Internal server error while retrieving device status',
      data: null
    });
  }
});

module.exports = router;
