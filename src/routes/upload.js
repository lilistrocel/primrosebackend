const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const networkConfig = require('../config/network');

const router = express.Router();

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

    const imageUrl = `/public/uploads/${req.file.filename}`;
    const fullImageUrl = `${networkConfig.getFrontendApiUrl()}/public/uploads/${req.file.filename}`;
    
    console.log(`✅ Image uploaded: ${req.file.filename}`);
    console.log(`📍 Image path: ${imageUrl}`);
    console.log(`🔗 Full URL: ${fullImageUrl}`);

    res.json({
      code: 0,
      msg: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: imageUrl,
        fullUrl: fullImageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({
      code: -1,
      msg: 'Error uploading image',
      data: null
    });
  }
});

module.exports = router;
