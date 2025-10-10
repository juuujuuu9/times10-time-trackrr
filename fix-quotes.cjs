#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix quote issues in a file
function fixQuotesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix unterminated string literals - look for patterns like .js"; instead of .js';
    const quoteFixRegex = /\.js";/g;
    if (quoteFixRegex.test(content)) {
      content = content.replace(quoteFixRegex, ".js';");
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed quotes in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('Fixing quote issues...');

const srcDir = path.join(__dirname, 'src');
const tsFiles = findTsFiles(srcDir);

let fixedCount = 0;
tsFiles.forEach(file => {
  if (fixQuotesInFile(file)) {
    fixedCount++;
  }
});

console.log(`Fixed quotes in ${fixedCount} files.`);
