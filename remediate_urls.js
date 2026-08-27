const fs = require('fs');
const path = require('path');

const root = __dirname;
const skipDirs = ['node_modules', '.next', 'dist', '.git', '.expo'];

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            if (!skipDirs.includes(f)) {
                walk(dirPath, callback);
            }
        } else {
            if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.js')) {
                callback(dirPath);
            }
        }
    });
}

const isBackend = (p) => p.includes(path.join('backend', 'src')) || p.includes(path.join('backend', 'controllers'));

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    if (isBackend(filePath)) {
        // Backend overrides
        content = content.replace(/['"`]http:\/\/localhost:3000\/?(.*?)['"`]/g, (match, p1) => {
            return p1 ? `(process.env.FRONTEND_CUSTOMER_URL || (process.env.NEXT_PUBLIC_CUSTOMER_URL || '')) + '/${p1}'` : `(process.env.FRONTEND_CUSTOMER_URL || (process.env.NEXT_PUBLIC_CUSTOMER_URL || ''))`;
        });
        content = content.replace(/['"`]http:\/\/localhost:3001\/?(.*?)['"`]/g, (match, p1) => {
            return p1 ? `(process.env.FRONTEND_VENDOR_URL || (process.env.NEXT_PUBLIC_VENDOR_URL || '')) + '/${p1}'` : `(process.env.FRONTEND_VENDOR_URL || (process.env.NEXT_PUBLIC_VENDOR_URL || ''))`;
        });
        content = content.replace(/['"`]http:\/\/localhost:3002\/?(.*?)['"`]/g, (match, p1) => {
            return p1 ? `(process.env.FRONTEND_ADMIN_URL || (process.env.NEXT_PUBLIC_ADMIN_URL || '')) + '/${p1}'` : `(process.env.FRONTEND_ADMIN_URL || (process.env.NEXT_PUBLIC_ADMIN_URL || ''))`;
        });
    } else {
        // Frontend overrides
        content = content.replace(/process\.env\.NEXT_PUBLIC_API_URL\s*\|\|\s*['"`]http:\/\/localhost:5000\/api['"`]/g, "process.env.NEXT_PUBLIC_API_URL");
        content = content.replace(/process\.env\.NEXT_PUBLIC_API_URL\s*\|\|\s*['"`]http:\/\/localhost:5000['"`]/g, "process.env.NEXT_PUBLIC_API_URL");
        
        content = content.replace(/['"`]http:\/\/localhost:5000(\/.*?)?['"`]/g, (match, p1) => {
            return p1 ? `(process.env.NEXT_PUBLIC_API_URL || '') + '${p1}'` : `(process.env.NEXT_PUBLIC_API_URL || '')`;
        });
        
        content = content.replace(/['"`]http:\/\/localhost:3000\/?(.*?)['"`]/g, (match, p1) => {
            return p1 ? `(process.env.NEXT_PUBLIC_CUSTOMER_URL || '') + '/${p1}'` : `(process.env.NEXT_PUBLIC_CUSTOMER_URL || '')`;
        });
        content = content.replace(/['"`]http:\/\/localhost:3001\/?(.*?)['"`]/g, (match, p1) => {
            return p1 ? `(process.env.NEXT_PUBLIC_VENDOR_URL || '') + '/${p1}'` : `(process.env.NEXT_PUBLIC_VENDOR_URL || '')`;
        });
        content = content.replace(/['"`]http:\/\/localhost:3002\/?(.*?)['"`]/g, (match, p1) => {
            return p1 ? `(process.env.NEXT_PUBLIC_ADMIN_URL || '') + '/${p1}'` : `(process.env.NEXT_PUBLIC_ADMIN_URL || '')`;
        });
        content = content.replace(/['"`]http:\/\/localhost:3003\/?(.*?)['"`]/g, (match, p1) => {
            return p1 ? `(process.env.NEXT_PUBLIC_RIDER_URL || '') + '/${p1}'` : `(process.env.NEXT_PUBLIC_RIDER_URL || '')`;
        });
        
        // Clean up formatting artifacts like  resulting from empty p1 maps.
        content = content.replace(/\/g, '');
    }

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Remediated URLs in:', filePath);
    }
}

walk(root, processFile);
console.log('Remediation complete.');
