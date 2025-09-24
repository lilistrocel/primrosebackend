const express = require('express');
const router = express.Router();
const db = require('../database/db');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Configure multer for admin latte art image uploads
const adminStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads/latte-art');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `latte-art-${name}-${timestamp}${ext}`);
  }
});

// Configure multer for customer latte art image uploads
const customerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const customerUploadDir = path.join(__dirname, '../../public/uploads/latte-art/customer');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(customerUploadDir)) {
      fs.mkdirSync(customerUploadDir, { recursive: true });
      console.log('📁 Created customer latte-art upload directory');
    }
    
    cb(null, customerUploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and customer prefix
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `customer-${name}-${timestamp}${ext}`);
  }
});

const fileFilter = function (req, file, cb) {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: adminStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

const customerUpload = multer({
  storage: customerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Validation schemas
const createLatteArtSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow('', null).optional(),
  isDefault: Joi.boolean().default(true),
  displayOrder: Joi.number().integer().min(0).default(0)
});

const updateLatteArtSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).allow('', null).optional(),
  isDefault: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  displayOrder: Joi.number().integer().min(0).optional()
}).min(1); // At least one field required

/**
 * GET /api/motong/latte-art
 * Get all active latte art designs
 */
router.get('/', (req, res) => {
  try {
    console.log('🎨 Fetching all latte art designs...');
    
    const designs = db.getAllLatteArtDesigns();
    
    console.log(`📊 Found ${designs.length} latte art designs`);
    
    // Transform to camelCase for frontend
    const transformedDesigns = designs.map(design => ({
      id: design.id,
      name: design.name,
      description: design.description,
      imagePath: design.image_path,
      isDefault: Boolean(design.is_default),
      isActive: Boolean(design.is_active),
      displayOrder: design.display_order,
      createdAt: design.created_at,
      updatedAt: design.updated_at
    }));
    
    res.json({
      code: 0,
      msg: 'Request successfully',
      data: transformedDesigns
    });
    
  } catch (error) {
    console.error('❌ Error fetching latte art designs:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to fetch latte art designs',
      data: null
    });
  }
});

/**
 * GET /api/motong/latte-art/:id
 * Get specific latte art design by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🎨 Fetching latte art design: ${id}`);
    
    const design = db.getLatteArtDesignById(id);
    
    if (!design) {
      return res.status(404).json({
        code: 1,
        msg: 'Latte art design not found',
        data: null
      });
    }
    
    // Transform to camelCase for frontend
    const transformedDesign = {
      id: design.id,
      name: design.name,
      description: design.description,
      imagePath: design.image_path,
      isDefault: Boolean(design.is_default),
      isActive: Boolean(design.is_active),
      displayOrder: design.display_order,
      createdAt: design.created_at,
      updatedAt: design.updated_at
    };
    
    res.json({
      code: 0,
      msg: 'Request successfully',
      data: transformedDesign
    });
    
  } catch (error) {
    console.error('❌ Error fetching latte art design:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to fetch latte art design',
      data: null
    });
  }
});

/**
 * POST /api/motong/latte-art
 * Create new latte art design
 */
router.post('/', upload.single('image'), async (req, res) => {
  console.log('🎨 LATTE ART POST ROUTE HIT!');
  console.log('📍 Route: POST /api/motong/latte-art');
  console.log('🌐 Request URL:', req.url);
  console.log('📊 Request headers:', req.headers);
  
  try {
    console.log('🎨 Creating new latte art design...');
    console.log('📝 Request body:', req.body);
    console.log('📁 Uploaded file:', req.file);
    
    // Validate input
    const { error, value } = createLatteArtSchema.validate(req.body);
    if (error) {
      console.error('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        code: 1,
        msg: `Validation error: ${error.details[0].message}`,
        data: null
      });
    }
    
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        code: 1,
        msg: 'Image file is required',
        data: null
      });
    }
    
    // Process the image to 1000x1000 with 20px border
    const sharp = require('sharp');
    const originalPath = req.file.path;
    const processedFilename = req.file.filename.replace(/\.[^/.]+$/, '') + '_processed.jpg';
    const processedPath = path.join(req.file.destination, processedFilename);
    
    console.log('🎨 Processing latte art image...');
    console.log(`📷 Original: ${req.file.filename}`);
    console.log(`🔄 Processing to: ${processedFilename}`);
    
    try {
      // Get image metadata
      const metadata = await sharp(originalPath).metadata();
      console.log(`📏 Original size: ${metadata.width}x${metadata.height}`);
      
      // For latte art, we want to preserve the original aspect ratio
      // and center it within 1000x1000 canvas without any stretching
      console.log(`🎨 Processing latte art: maintaining original aspect ratio`);
      
      // Process the image - fit within 1000x1000 while maintaining aspect ratio
      await sharp(originalPath)
        .resize(1000, 1000, {
          fit: 'contain', // Fit within 1000x1000 without cropping or stretching
          background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for padding
        })
        .jpeg({ 
          quality: 95, // Higher quality for latte art details
          progressive: true 
        })
        .toFile(processedPath);
      
      console.log(`✅ Latte art processed: centered within 1000x1000 with original proportions`);
      
      // Delete original file to save space
      fs.unlinkSync(originalPath);
      console.log('🗑️ Deleted original file');
      console.log('✅ Latte art image processed successfully');
      
    } catch (processError) {
      console.error('❌ Error processing latte art image:', processError);
      // If processing fails, keep original file
      processedPath = originalPath;
      processedFilename = req.file.filename;
    }
    
    // Create relative path for database storage (use processed image)
    const imagePath = `/public/uploads/latte-art/${processedFilename}`;
    
    const designData = {
      name: value.name,
      description: value.description || '',
      image_path: imagePath,
      is_default: (value.isDefault === 'true' || value.isDefault === true) ? 1 : 0, // Convert to integer for SQLite
      display_order: parseInt(value.displayOrder) || 0 // Convert to integer for SQLite
    };
    
    const result = db.insertLatteArtDesign(designData);
    
    console.log(`✅ Created latte art design with ID: ${result.lastInsertRowid}`);
    
    res.json({
      code: 0,
      msg: 'Latte art design created successfully',
      data: {
        id: result.lastInsertRowid,
        name: designData.name,
        description: designData.description,
        imagePath: imagePath,
        isDefault: Boolean(designData.is_default),
        displayOrder: designData.display_order
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating latte art design:', error);
    
    // Clean up uploaded file if database insert failed
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Cleaned up uploaded file after error');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({
      code: 1,
      msg: 'Failed to create latte art design',
      data: null
    });
  }
});

/**
 * PUT /api/motong/latte-art/:id
 * Update existing latte art design
 */
router.put('/:id', upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🎨 Updating latte art design: ${id}`);
    console.log('📝 Request body:', req.body);
    console.log('📁 Uploaded file:', req.file);
    
    // Validate input
    const { error, value } = updateLatteArtSchema.validate(req.body);
    if (error) {
      console.error('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        code: 1,
        msg: `Validation error: ${error.details[0].message}`,
        data: null
      });
    }
    
    // Get existing design
    const existingDesign = db.getLatteArtDesignById(id);
    if (!existingDesign) {
      return res.status(404).json({
        code: 1,
        msg: 'Latte art design not found',
        data: null
      });
    }
    
    const updates = {};
    
    // Add fields that were provided with proper type conversion
    if (value.name !== undefined) updates.name = value.name;
    if (value.description !== undefined) updates.description = value.description;
    if (value.isDefault !== undefined) {
      // Convert string boolean to integer for SQLite
      updates.is_default = (value.isDefault === 'true' || value.isDefault === true) ? 1 : 0;
    }
    if (value.isActive !== undefined) {
      // Convert string boolean to integer for SQLite  
      updates.is_active = (value.isActive === 'true' || value.isActive === true) ? 1 : 0;
    }
    if (value.displayOrder !== undefined) {
      // Convert string to integer
      updates.display_order = parseInt(value.displayOrder) || 0;
    }
    
    // Handle image update
    if (req.file) {
      const newImagePath = `/public/uploads/latte-art/${req.file.filename}`;
      updates.image_path = newImagePath;
      
      // Optionally delete old image file (if it's not a default)
      if (existingDesign.image_path && !existingDesign.is_default) {
        const oldFilePath = path.join(__dirname, '../..', existingDesign.image_path);
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log('🗑️ Deleted old image file');
          }
        } catch (cleanupError) {
          console.error('⚠️ Failed to delete old image file:', cleanupError);
        }
      }
    }
    
    const success = db.updateLatteArtDesign(id, updates);
    
    if (!success) {
      return res.status(404).json({
        code: 1,
        msg: 'Latte art design not found or not updated',
        data: null
      });
    }
    
    console.log(`✅ Updated latte art design: ${id}`);
    
    res.json({
      code: 0,
      msg: 'Latte art design updated successfully',
      data: { id: parseInt(id), ...updates }
    });
    
  } catch (error) {
    console.error('❌ Error updating latte art design:', error);
    
    // Clean up uploaded file if database update failed
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Cleaned up uploaded file after error');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({
      code: 1,
      msg: 'Failed to update latte art design',
      data: null
    });
  }
});

/**
 * DELETE /api/motong/latte-art/:id
 * Delete (deactivate) latte art design
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🎨 Deleting latte art design: ${id}`);
    
    const success = db.deleteLatteArtDesign(id);
    
    if (!success) {
      return res.status(404).json({
        code: 1,
        msg: 'Latte art design not found',
        data: null
      });
    }
    
    console.log(`✅ Deleted latte art design: ${id}`);
    
    res.json({
      code: 0,
      msg: 'Latte art design deleted successfully',
      data: { id: parseInt(id) }
    });
    
  } catch (error) {
    console.error('❌ Error deleting latte art design:', error);
    res.status(500).json({
      code: 1,
      msg: 'Failed to delete latte art design',
      data: null
    });
  }
});

/**
 * POST /api/motong/latte-art/upload-temp
 * Upload temporary image from kiosk (for customer uploads)
 */
router.post('/upload-temp', customerUpload.single('image'), async (req, res) => {
  try {
    console.log('🎨 Uploading temporary latte art image from kiosk...');
    console.log('📁 Uploaded file:', req.file);
    
    if (!req.file) {
      return res.status(400).json({
        code: 1,
        msg: 'Image file is required',
        data: null
      });
    }
    
    // Process the image to standardize it (same as latte art management)
    const originalPath = req.file.path;
    const processedFilename = `processed-customer-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const processedPath = path.join(customerUploadDir, processedFilename);
    
    console.log('🎨 Processing kiosk latte art image...');
    console.log(`📷 Original: ${req.file.filename}`);
    console.log(`🔄 Processing to: ${processedFilename}`);
    
    try {
      // Get image metadata
      const metadata = await sharp(originalPath).metadata();
      console.log(`📏 Original size: ${metadata.width}x${metadata.height}`);
      
      // For latte art, we want to preserve the original aspect ratio
      // and center it within 1000x1000 canvas without any stretching
      console.log(`🎨 Processing kiosk latte art: maintaining original aspect ratio`);
      
      // Process the image - fit within 1000x1000 while maintaining aspect ratio
      await sharp(originalPath)
        .resize(1000, 1000, {
          fit: 'contain', // Fit within 1000x1000 without cropping or stretching
          background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for padding
        })
        .jpeg({ 
          quality: 95, // Higher quality for latte art details
          progressive: true 
        })
        .toFile(processedPath);
      
      console.log(`✅ Kiosk latte art processed: centered within 1000x1000 with original proportions`);
      
      // Delete original file to save space
      fs.unlinkSync(originalPath);
      console.log('🗑️ Deleted original file');
      
    } catch (processError) {
      console.error('❌ Error processing kiosk latte art image:', processError);
      // If processing fails, keep original file
      processedPath = originalPath;
      processedFilename = req.file.filename;
    }
    
    // Create relative path for temporary storage (use processed image in customer folder)
    const imagePath = `/public/uploads/latte-art/customer/${processedFilename}`;
    
    console.log(`✅ Customer latte art image uploaded and processed: ${imagePath}`);
    
    res.json({
      code: 0,
      msg: 'Temporary image uploaded and processed successfully',
      data: {
        imagePath: imagePath,
        filename: processedFilename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
    
  } catch (error) {
    console.error('❌ Error uploading temporary latte art image:', error);
    
    // Clean up uploaded file if response failed
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Cleaned up uploaded file after error');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({
      code: 1,
      msg: 'Failed to upload temporary image',
      data: null
    });
  }
});

module.exports = router;
