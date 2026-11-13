const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const from = path.join(dist, 'assets', 'node_modules');
const to = path.join(dist, 'assets', 'vendor');

if (fs.existsSync(from)) fs.renameSync(from, to);

// rewrite every reference to the old path
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(js|html|json)$/.test(f)) {
      const s = fs.readFileSync(p, 'utf8');
      if (s.includes('/assets/node_modules/')) {
        fs.writeFileSync(p, s.split('/assets/node_modules/').join('/assets/vendor/'));
      }
    }
  }
}
walk(dist);