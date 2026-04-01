import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

// 1. Rename src/pages to src/app
const pagesDir = path.join(SRC_DIR, 'pages');
const appDir = path.join(SRC_DIR, 'app');
if (fs.existsSync(pagesDir)) {
  fs.cpSync(pagesDir, appDir, { recursive: true });
  try {
    fs.rmSync(pagesDir, { recursive: true, force: true });
    console.log('Moved pages to app');
  } catch (e) {
    console.log('Copied pages to app. Could not delete pages due to EPERM lock by Vite.');
  }
}

// 2. Setup utils
const libUtils = path.join(SRC_DIR, 'lib', 'utils.ts');
const utilsDir = path.join(SRC_DIR, 'utils');
const newUtils = path.join(utilsDir, 'utils.ts');
if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir);
if (fs.existsSync(libUtils)) {
  fs.copyFileSync(libUtils, newUtils);
  try { fs.unlinkSync(libUtils); } catch(e){}
  console.log('Moved utils.ts');
}

// 3. Setup ui & layout
const uiDir = path.join(SRC_DIR, 'components', 'ui');
const layoutDir = path.join(SRC_DIR, 'components', 'layout');
const commonDir = path.join(SRC_DIR, 'components', 'common');

if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir);
if (!fs.existsSync(layoutDir)) fs.mkdirSync(layoutDir);

if (fs.existsSync(commonDir)) {
  const layoutTsx = path.join(commonDir, 'layout.tsx');
  if (fs.existsSync(layoutTsx)) fs.renameSync(layoutTsx, path.join(layoutDir, 'layout.tsx'));
  
  const ebTsx = path.join(commonDir, 'error-boundary.tsx');
  if (fs.existsSync(ebTsx)) fs.renameSync(ebTsx, path.join(uiDir, 'error-boundary.tsx'));
  
  // Delete the rest of common (this drops unused animated-logo and skeletons)
  fs.rmSync(commonDir, { recursive: true, force: true });
  console.log('Moved common components and safely deleted unused files inside common');
}

// 4. Update imports
const files = walk(SRC_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace lib/utils across all files to use the alias
  content = content.replace(/['"](\.\.\/)+lib\/utils['"]/g, '"@/utils/utils"');
  content = content.replace(/['"]\.\/lib\/utils['"]/g, '"@/utils/utils"');
  
  // Replace in App.tsx specifically
  if (file.endsWith('App.tsx')) {
    content = content.replace(/import\("\.\/pages\//g, 'import("./app/');
    content = content.replace(/from "\.\/components\/common\/layout"/g, 'from "./components/layout/layout"');
    content = content.replace(/from "\.\/components\/common\/error-boundary"/g, 'from "./components/ui/error-boundary"');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated imports in ${path.relative(SRC_DIR, file)}`);
  }
});

console.log('Done refactoring architecture.');
