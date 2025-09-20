// Test latte art upload functionality
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing latte art upload setup...');

try {
  // Check if upload directory exists
  const uploadDir = path.join(__dirname, 'public/uploads/latte-art');
  console.log(`📁 Upload directory path: ${uploadDir}`);
  
  if (fs.existsSync(uploadDir)) {
    console.log('✅ Upload directory exists');
    
    // Check permissions by trying to create a test file
    const testFile = path.join(uploadDir, 'test.txt');
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('✅ Directory is writable');
    } catch (writeError) {
      console.log('❌ Directory is not writable:', writeError.message);
    }
  } else {
    console.log('❌ Upload directory does not exist. Creating it...');
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('✅ Upload directory created successfully');
    } catch (createError) {
      console.log('❌ Failed to create upload directory:', createError.message);
    }
  }
  
  // Check if database methods exist
  const db = require('./src/database/db');
  
  if (typeof db.insertLatteArtDesign === 'function') {
    console.log('✅ Database insertLatteArtDesign method exists');
  } else {
    console.log('❌ Database insertLatteArtDesign method missing');
  }
  
  if (typeof db.getAllLatteArtDesigns === 'function') {
    console.log('✅ Database getAllLatteArtDesigns method exists');
  } else {
    console.log('❌ Database getAllLatteArtDesigns method missing');
  }
  
  // Check if latte_art_designs table exists
  try {
    const designs = db.getAllLatteArtDesigns();
    console.log(`✅ Latte art designs table exists with ${designs.length} designs`);
  } catch (dbError) {
    console.log('❌ Database error:', dbError.message);
  }
  
} catch (error) {
  console.error('❌ Test failed:', error);
}

console.log('\n✨ Test completed!');
