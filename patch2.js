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

function processDirectory(dirToProcess) {
    walk(path.join(process.cwd(), dirToProcess, 'src'), (err, files) => {
        if (err) throw err;
        let updatedCount = 0;
        for (const file of files) {
          let content = fs.readFileSync(file, 'utf8');
          let original = content;
          
          // Pattern: (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com')
          // We will strictly grab this massive ternary, and replace it so it wraps with .replace(/\/api\/?$/, '') 
          // So it trims /api if the user manually added it in the env var.

          const search = "(process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com')";
          const replace = "((process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') ? process.env.NEXT_PUBLIC_API_URL : 'https://api.eghedev.com').replace(/\\/api\\/?$/, ''))";

          // Since the previous string might already be there, let's avoid double-wrapping
          if (content.includes(search) && !content.includes(".replace(/\\/api\\/?$/, ''))")) {
              content = content.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
          }

          if (content !== original) {
            fs.writeFileSync(file, content, 'utf8');
            updatedCount++;
            console.log(`Updated ${file}`);
          }
        }
        console.log(`Finished ${dirToProcess}, Total files updated: ${updatedCount}`);
      });
}

// Process Customer, Admin, Vendor
processDirectory('customer');
processDirectory('admin');
processDirectory('vendor');
