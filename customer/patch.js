const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
             results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk(path.join(process.cwd(), 'src/app'), (err, files) => {
  if (err) throw err;
  let updatedCount = 0;
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    content = content.replace(/\(process\.env\.NEXT_PUBLIC_API_URL \|\| ''\)/g, "(process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com')");
    content = content.replace(/process\.env\.NEXT_PUBLIC_API_URL(?!\s*\|\||\s*\&\&)/g, "(process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com')");

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      updatedCount++;
      console.log('Updated', file);
    }
  }
  console.log('Total files updated:', updatedCount);
});
