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

const files = walk(SRC_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Remove comment blocks at EOF
  content = content.replace(/\n\/\/ RESPONSIVE FIXES:[\s\S]*/, '');
  content = content.replace(/\n\/\/ CHANGES:[\s\S]*/, '');
  content = content.replace(/\n\/\/ NAVBAR CHANGES:[\s\S]*/, '');
  
  // Remove trailing empty lines
  content = content.trim() + '\n';

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Cleaned comments in ${path.relative(SRC_DIR, file)}`);
  }
});

// Optimize ProductCard
const productCardPath = path.join(SRC_DIR, 'components/shop/product-card.tsx');
if (fs.existsSync(productCardPath)) {
  let pc = fs.readFileSync(productCardPath, 'utf8');
  if (!pc.includes('loading="lazy"')) {
    pc = pc.replace('<motion.img', '<motion.img\n            loading="lazy"');
    fs.writeFileSync(productCardPath, pc);
    console.log('Added lazy loading to ProductCard');
  }
}

// Optimize Cart Index
const cartPath = path.join(SRC_DIR, 'app/cart/index.tsx');
if (fs.existsSync(cartPath)) {
  let cc = fs.readFileSync(cartPath, 'utf8');
  if (!cc.includes('loading="lazy"')) {
    cc = cc.replace(/<img(.*?)src=\{item.product.images\[0\]\}/g, '<img loading="lazy"$1src={item.product.images[0]}');
    fs.writeFileSync(cartPath, cc);
  }
}

console.log('Done cleaning up.');
