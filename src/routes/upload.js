const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const networkConfig = require('../config/network');

const router = express.Router();

/**
 * Process uploaded image to standardized 1000x1000 format
 * - Maintains aspect ratio
 * - Centers image in 1000x1000 canvas
 * - 20px border on all sides (960x960 actual image area)
 * - White background
 */
async function processImage(inputPath, outputPath) {
  try {
    console.log('🎨 Processing image:', path.basename(inputPath));
    
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`📏 Original size: ${metadata.width}x${metadata.height}`);
    
    // Calculate dimensions to fit within 960x960 (1000x1000 minus 20px border each side)
    const maxSize = 960;
    const { width, height } = metadata;
    
    let newWidth, newHeight;
    if (width > height) {
      // Landscape: fit to width
      newWidth = Math.min(width, maxSize);
      newHeight = Math.round((height * newWidth) / width);
    } else {
      // Portrait or square: fit to height
      newHeight = Math.min(height, maxSize);
      newWidth = Math.round((width * newHeight) / height);
    }
    
    console.log(`🔄 Resizing to: ${newWidth}x${newHeight}`);
    
    // Process the image
    await sharp(inputPath)
      .resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: false // Allow upscaling for small images
      })
      .extend({
        top: Math.round((1000 - newHeight) / 2),
        bottom: Math.round((1000 - newHeight) / 2),
        left: Math.round((1000 - newWidth) / 2),
        right: Math.round((1000 - newWidth) / 2),
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
      })
      .jpeg({ 
        quality: 90,
        progressive: true 
      })
      .toFile(outputPath);
    
    console.log('✅ Image processed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error processing image:', error);
    throw error;
  }
}

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * POST UPLOAD IMAGE - Upload product image
 * For frontend product image uploads
 */
router.post('/upload/image', upload.single('image'), async (req, res) => {
  try {
    console.log('📷 Image upload API called');
    
    if (!req.file) {
      return res.status(400).json({
        code: -1,
        msg: 'No image file provided',
        data: null
      });
    }

    // Original file paths
    const originalPath = req.file.path;
    const originalFilename = req.file.filename;
    
    // Create processed filename (replace extension with .jpg)
    const processedFilename = originalFilename.replace(/\.[^/.]+$/, '') + '_processed.jpg';
    const processedPath = path.join(uploadDir, processedFilename);
    
    console.log(`📷 Original file: ${originalFilename}`);
    console.log(`🎨 Processing to: ${processedFilename}`);
    
    // Process the image to 1000x1000 with 20px border
    await processImage(originalPath, processedPath);
    
    // Delete original file to save space (optional)
    try {
      fs.unlinkSync(originalPath);
      console.log('🗑️ Deleted original file');
    } catch (err) {
      console.warn('⚠️ Could not delete original file:', err.message);
    }
    
    const imageUrl = `/public/uploads/${processedFilename}`;
    
    console.log(`✅ Image uploaded and processed: ${processedFilename}`);
    console.log(`📍 Final image path: ${imageUrl}`);

    res.json({
      code: 0,
      msg: 'Image uploaded and processed successfully',
      data: {
        filename: processedFilename,
        originalName: req.file.originalname,
        path: imageUrl,
        url: imageUrl, // Relative path for frontend to build full URL
        size: fs.statSync(processedPath).size, // Size of processed image
        mimetype: 'image/jpeg', // Always JPEG after processing
        dimensions: '1000x1000',
        processed: true
      }
    });

  } catch (error) {
    console.error('❌ Error uploading/processing image:', error);
    res.status(500).json({
      code: -1,
      msg: 'Error uploading or processing image',
      data: null
    });
  }
});

module.exports = router;
