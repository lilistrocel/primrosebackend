#!/usr/bin/env node

/**
 * Coffee Machine Backend - Memory Efficiency Audit
 * 
 * Analyzes:
 * - Unused dependencies
 * - Memory leaks
 * - Inefficient patterns
 * - Resource cleanup
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// Read file safely
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return null;
  }
}

// Check if dependency is used
function findDependencyUsage(dep, srcDir) {
  const usagePattern = new RegExp(`require\\(['"]${dep}['"]\\)`, 'g');
  let found = false;
  
  function searchDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules') {
        searchDir(filePath);
      } else if (stat.isFile() && file.endsWith('.js')) {
        const content = readFileSafe(filePath);
        if (content && usagePattern.test(content)) {
          found = true;
          return;
        }
      }
    }
  }
  
  searchDir(srcDir);
  return found;
}

// Analyze dependencies
function analyzeDependencies() {
  log('\n📦 DEPENDENCY ANALYSIS', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  const packagePath = './package.json';
  const packageData = JSON.parse(readFileSafe(packagePath));
  
  if (!packageData) {
    log('❌ Could not read package.json', 'red');
    return;
  }

  const dependencies = packageData.dependencies || {};
  const devDependencies = packageData.devDependencies || {};
  
  log('Production Dependencies:', 'yellow');
  const unusedDeps = [];
  
  Object.keys(dependencies).forEach(dep => {
    const isUsed = findDependencyUsage(dep, './src');
    if (!isUsed) {
      unusedDeps.push(dep);
      log(`   ⚠️  ${dep} - Not found in code`, 'yellow');
    } else {
      log(`   ✅ ${dep}`, 'green');
    }
  });

  if (unusedDeps.length > 0) {
    log(`\n💡 Found ${unusedDeps.length} potentially unused dependencies:`, 'yellow');
    unusedDeps.forEach(dep => {
      log(`   - ${dep}`, 'gray');
    });
    log('\n   Consider removing them to reduce bundle size:', 'gray');
    log(`   npm uninstall ${unusedDeps.join(' ')}`, 'cyan');
  } else {
    log('\n✅ All dependencies are being used', 'green');
  }
}

// Check for memory leak patterns
function checkMemoryLeakPatterns() {
  log('\n🔍 MEMORY LEAK PATTERN DETECTION', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  const patterns = {
    globalVariables: {
      regex: /global\.\w+\s*=/g,
      severity: 'high',
      message: 'Global variables can cause memory leaks'
    },
    unhandledEventListeners: {
      regex: /\.on\(['"].*?['"],/g,
      severity: 'medium',
      message: 'Event listeners should be cleaned up'
    },
    timersWithoutCleanup: {
      regex: /setInterval\(/g,
      severity: 'high',
      message: 'Intervals should be cleared'
    },
    largeArrays: {
      regex: /= \[.*?\]/g,
      severity: 'low',
      message: 'Large arrays can consume memory'
    }
  };

  const issues = [];

  function scanFile(filePath) {
    const content = readFileSafe(filePath);
    if (!content) return;

    const relativePath = path.relative('.', filePath);

    Object.entries(patterns).forEach(([patternName, pattern]) => {
      const matches = content.match(pattern.regex);
      if (matches && matches.length > 0) {
        issues.push({
          file: relativePath,
          pattern: patternName,
          count: matches.length,
          severity: pattern.severity,
          message: pattern.message
        });
      }
    });
  }

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && file !== 'frontend') {
        scanDirectory(filePath);
      } else if (stat.isFile() && file.endsWith('.js')) {
        scanFile(filePath);
      }
    }
  }

  scanDirectory('./src');

  if (issues.length === 0) {
    log('✅ No obvious memory leak patterns detected', 'green');
  } else {
    log('⚠️  Potential memory issues found:', 'yellow');
    
    const highSeverity = issues.filter(i => i.severity === 'high');
    const mediumSeverity = issues.filter(i => i.severity === 'medium');
    const lowSeverity = issues.filter(i => i.severity === 'low');

    if (highSeverity.length > 0) {
      log('\n   🚨 HIGH SEVERITY:', 'red');
      highSeverity.forEach(issue => {
        log(`      ${issue.file}: ${issue.count}x ${issue.pattern}`, 'red');
        log(`      → ${issue.message}`, 'gray');
      });
    }

    if (mediumSeverity.length > 0) {
      log('\n   ⚠️  MEDIUM SEVERITY:', 'yellow');
      mediumSeverity.forEach(issue => {
        log(`      ${issue.file}: ${issue.count}x ${issue.pattern}`, 'yellow');
        log(`      → ${issue.message}`, 'gray');
      });
    }

    if (lowSeverity.length > 0) {
      log('\n   ℹ️  LOW SEVERITY:', 'cyan');
      lowSeverity.forEach(issue => {
        log(`      ${issue.file}: ${issue.count}x ${issue.pattern}`, 'cyan');
        log(`      → ${issue.message}`, 'gray');
      });
    }
  }
}

// Analyze route efficiency
function analyzeRoutes() {
  log('\n🛣️  ROUTE EFFICIENCY ANALYSIS', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  const appPath = './src/app.js';
  const appContent = readFileSafe(appPath);
  
  if (!appContent) {
    log('❌ Could not read app.js', 'red');
    return;
  }

  // Count middleware usage
  const middlewareCount = (appContent.match(/\.use\(/g) || []).length;
  const routeCount = (appContent.match(/\.get\(|\.post\(|\.put\(|\.delete\(/g) || []).length;

  log(`Middleware: ${middlewareCount}`, 'gray');
  log(`Routes: ${routeCount}`, 'gray');

  // Check for redundant middleware
  const morganMatches = (appContent.match(/morgan\(/g) || []).length;
  if (morganMatches > 1) {
    log(`\n⚠️  Multiple morgan loggers detected (${morganMatches})`, 'yellow');
    log('   Consider using a single logger instance', 'gray');
  }

  // Check for duplicate routes
  const duplicateRoutes = appContent.match(/this\.app\.use\('\/api\/motong'/g) || [];
  const swoftRoutes = appContent.match(/this\.app\.use\('\/swoft\/api\/motong'/g) || [];
  
  if (duplicateRoutes.length > 10 && swoftRoutes.length > 10) {
    log(`\n💡 OPTIMIZATION OPPORTUNITY:`, 'cyan');
    log(`   You have ${duplicateRoutes.length + swoftRoutes.length} route registrations`, 'gray');
    log('   Consider consolidating routes to reduce memory footprint:', 'gray');
    log('   - Use a single router for all /api/motong routes', 'gray');
    log('   - Add alias middleware instead of duplicate registrations', 'gray');
  }
}

// Check database efficiency
function analyzeDatabaseUsage() {
  log('\n🗄️  DATABASE EFFICIENCY', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  const dbPath = './src/database/db.js';
  const dbContent = readFileSafe(dbPath);
  
  if (!dbContent) {
    log('❌ Could not read db.js', 'red');
    return;
  }

  // Check for prepare statements (good for performance)
  const prepareCount = (dbContent.match(/\.prepare\(/g) || []).length;
  log(`✅ Prepared statements: ${prepareCount}`, prepareCount > 0 ? 'green' : 'yellow');

  // Check for indexes
  const indexCount = (dbContent.match(/CREATE INDEX/gi) || []).length;
  log(`✅ Database indexes: ${indexCount}`, indexCount > 5 ? 'green' : 'yellow');

  // Check for potential N+1 queries
  const forLoopQueries = dbContent.match(/for\s*\([^)]*\)[^{]*{[^}]*\.get\(/g);
  if (forLoopQueries && forLoopQueries.length > 0) {
    log(`\n⚠️  Potential N+1 query patterns detected: ${forLoopQueries.length}`, 'yellow');
    log('   Consider using JOIN queries or batch operations', 'gray');
  } else {
    log('✅ No obvious N+1 query patterns', 'green');
  }
}

// Analyze file size
function analyzeFileSizes() {
  log('\n📁 FILE SIZE ANALYSIS', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  const files = [];

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && entry !== 'node_modules' && entry !== 'frontend') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && entry.endsWith('.js')) {
        files.push({
          path: path.relative('.', fullPath),
          size: stat.size
        });
      }
    }
  }

  scanDirectory('./src');

  // Sort by size
  files.sort((a, b) => b.size - a.size);

  log('Largest source files:', 'yellow');
  files.slice(0, 10).forEach((file, index) => {
    const sizeKB = (file.size / 1024).toFixed(2);
    const color = file.size > 50000 ? 'red' : file.size > 20000 ? 'yellow' : 'green';
    log(`   ${index + 1}. ${file.path.padEnd(50)} ${sizeKB} KB`, color);
  });

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  log(`\nTotal source code size: ${(totalSize / 1024).toFixed(2)} KB`, 'cyan');

  const largeFiles = files.filter(f => f.size > 50000);
  if (largeFiles.length > 0) {
    log(`\n⚠️  ${largeFiles.length} files exceed 50KB`, 'yellow');
    log('   Consider splitting large files into smaller modules', 'gray');
  }
}

// Main recommendations
function displayRecommendations() {
  log('\n💡 MEMORY EFFICIENCY RECOMMENDATIONS', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  log('General Best Practices:', 'yellow');
  log('   ✓ Use connection pooling for databases', 'gray');
  log('   ✓ Implement pagination for large datasets', 'gray');
  log('   ✓ Cache frequently accessed data', 'gray');
  log('   ✓ Use streams for large file operations', 'gray');
  log('   ✓ Clean up event listeners and timers', 'gray');
  log('   ✓ Avoid global variables', 'gray');
  log('   ✓ Use weak references for caches', 'gray');

  log('\nProduction Deployment:', 'yellow');
  log('   ✓ Use production mode (NODE_ENV=production)', 'gray');
  log('   ✓ Enable compression middleware', 'gray');
  log('   ✓ Use minimal logging in production', 'gray');
  log('   ✓ Monitor memory usage with tools like PM2', 'gray');
  log('   ✓ Set memory limits (--max-old-space-size)', 'gray');
}

// Main execution
function main() {
  log('\n☕ COFFEE MACHINE BACKEND - MEMORY EFFICIENCY AUDIT', 'bright');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  analyzeDependencies();
  checkMemoryLeakPatterns();
  analyzeRoutes();
  analyzeDatabaseUsage();
  analyzeFileSizes();
  displayRecommendations();

  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('✅ Memory audit complete!', 'green');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');
}

// Run the audit
main();

