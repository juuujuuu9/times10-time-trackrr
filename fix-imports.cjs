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

// Function to fix import paths in a file
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix imports from db
    const dbImportRegex = /from\s+['"](\.\.?\/)+db['"]/g;
    if (dbImportRegex.test(content)) {
      content = content.replace(dbImportRegex, (match) => {
        const pathPart = match.match(/from\s+['"](\.\.?\/)+db['"]/)[0];
        const newPath = pathPart.replace(/['"]$/, '/index.js"');
        modified = true;
        return newPath;
      });
    }
    
    // Fix imports from db/schema
    const schemaImportRegex = /from\s+['"](\.\.?\/)+db\/schema['"]/g;
    if (schemaImportRegex.test(content)) {
      content = content.replace(schemaImportRegex, (match) => {
        const pathPart = match.match(/from\s+['"](\.\.?\/)+db\/schema['"]/)[0];
        const newPath = pathPart.replace(/['"]$/, '.js"');
        modified = true;
        return newPath;
      });
    }
    
    // Fix imports from utils
    const utilsImportRegex = /from\s+['"](\.\.?\/)+utils\/[^'"]*['"]/g;
    if (utilsImportRegex.test(content)) {
      content = content.replace(utilsImportRegex, (match) => {
        const pathPart = match.match(/from\s+['"](\.\.?\/)+utils\/[^'"]*['"]/)[0];
        if (!pathPart.includes('.js')) {
          const newPath = pathPart.replace(/['"]$/, '.js"');
          modified = true;
          return newPath;
        }
        return match;
      });
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed imports in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('Fixing import paths...');

const srcDir = path.join(__dirname, 'src');
const tsFiles = findTsFiles(srcDir);

let fixedCount = 0;
tsFiles.forEach(file => {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
});

console.log(`Fixed imports in ${fixedCount} files.`);
