const express = require('express');
const router = express.Router();
const db = require('../database/db');
const Joi = require('joi');

// Validation schemas
const optionNameSchema = Joi.object({
  option_key: Joi.string().required(),
  name_en: Joi.string().required(),
  name_ar: Joi.string().required(),
  description_en: Joi.string().allow('').optional(),
  description_ar: Joi.string().allow('').optional(),
  is_active: Joi.boolean().optional()
});

const updateOptionNameSchema = Joi.object({
  name_en: Joi.string().optional(),
  name_ar: Joi.string().optional(),
  description_en: Joi.string().allow('').optional(),
  description_ar: Joi.string().allow('').optional(),
  is_active: Joi.boolean().optional()
});

// GET /api/motong/option-names - Get all option names
router.get('/', (req, res) => {
  try {
    const optionNames = db.getAllOptionNames();
    
    // Transform to the format expected by frontend
    const transformedNames = {};
    optionNames.forEach(option => {
      transformedNames[option.option_key] = {
        en: option.name_en,
        ar: option.name_ar,
        description: {
          en: option.description_en || '',
          ar: option.description_ar || ''
        }
      };
    });
    
    res.json({
      code: 0,
      msg: 'Option names retrieved successfully',
      data: transformedNames
    });
  } catch (error) {
    console.error('Error fetching option names:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to fetch option names',
      data: null
    });
  }
});

// POST /api/motong/option-names - Create new option name
router.post('/', (req, res) => {
  try {
    const { error, value } = optionNameSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        code: 1,
        msg: `Validation error: ${error.details[0].message}`,
        data: null
      });
    }

    const optionName = db.createOptionName(value);
    
    res.status(201).json({
      code: 0,
      msg: 'Option name created successfully',
      data: optionName
    });
  } catch (error) {
    console.error('Error creating option name:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to create option name',
      data: null
    });
  }
});

// PUT /api/motong/option-names/:key - Update option name
router.put('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { error, value } = updateOptionNameSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        code: 1,
        msg: `Validation error: ${error.details[0].message}`,
        data: null
      });
    }

    const optionName = db.updateOptionName(key, value);
    
    if (!optionName) {
      return res.status(404).json({
        code: 1,
        msg: 'Option name not found',
        data: null
      });
    }
    
    res.json({
      code: 0,
      msg: 'Option name updated successfully',
      data: optionName
    });
  } catch (error) {
    console.error('Error updating option name:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to update option name',
      data: null
    });
  }
});

// DELETE /api/motong/option-names/:key - Delete option name
router.delete('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const success = db.deleteOptionName(key);
    
    if (!success) {
      return res.status(404).json({
        code: 1,
        msg: 'Option name not found',
        data: null
      });
    }
    
    res.json({
      code: 0,
      msg: 'Option name deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('Error deleting option name:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to delete option name',
      data: null
    });
  }
});

module.exports = router;
