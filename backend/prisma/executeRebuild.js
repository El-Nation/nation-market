const Database = require('better-sqlite3');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const Jimp = require('jimp');

cloudinary.config({
  cloud_name: 'dgibtepjn',
  api_key: '523449358252537',
  api_secret: '-fz89r5gQQaSwnWQoLMkV4_NGAU'
});

const db = new Database(path.join(__dirname, '..', 'dev.db'));
const usedHashes = [];

const STOP_WORDS = ['basic', 'standard', 'premium', 'deal', 'box', 'item', 'exclusive', 'store', 'bundle', 'pack', 'set', 'branch', 'hub', 'official', 'direct', 'online', 'connect', 'market', 'megastore', 'eatery', 'cafe', 'solutions', 'nigeria', 'options', 'care'];

function cleanName(str) {
  if (!str) return '';
  let words = str.toLowerCase().replace(/&/g, '').split(/\s+/);
  words = words.filter(w => !STOP_WORDS.includes(w) && w.length > 2);
  return words.join(' ').trim();
}

function isVisuallyUnique(newHash) {
  for (const existingHash of usedHashes) {
    const distance = Jimp.compareHashes(existingHash, newHash);
    if (distance < 0.15) return false;
  }
  return true;
}

// Download thumbnail for ultra-fast Jimp perceptive hashing
async function processCandidateImage(url) {
  try {
     const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
     if (!res.ok) return { valid: false, reason: `HTTP ${res.status}` };
     const arrayBuffer = await res.arrayBuffer();
     const buffer = Buffer.from(arrayBuffer);
     
     const img = await Jimp.read(buffer);
     const hash = img.hash();
     
     if (!isVisuallyUnique(hash)) {
        return { valid: false, reason: 'Duplicate/Perceptually Similar' };
     }
     
     return { valid: true, hash };
  } catch (err) {
     return { valid: false, reason: `Error: ${err.message}` };
  }
}

// Download high-def for Cloudinary mapping
async function downloadFullImage(url) {
  try {
     const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
     if (!res.ok) return null;
     const arrayBuffer = await res.arrayBuffer();
     return Buffer.from(arrayBuffer);
  } catch(e) {
     return null;
  }
}

async function uploadToCloudinary(buffer, publicIdBase) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'nation-market/stage9_final', public_id: publicIdBase, overwrite: true, format: 'jpg', quality: 'auto', crop: 'fill', width: 600, height: 600 },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchUnsplash(query) {
    const enc = encodeURIComponent(query);
    try {
       const res = await fetch(`https://unsplash.com/napi/search/photos?query=${enc}&per_page=10`);
       if(!res.ok) return [];
       const data = await res.json();
       // Return objects containing both resolution streams
       return (data.results || []).map(r => ({ full: r.urls.regular, thumb: r.urls.thumb }));
    } catch(e) {
       return [];
    }
}

async function runExecution() {
  console.log("Starting Optimized Semantic Execution Engine...");
  const gallery = [];
  
  // Exclude previously processed items from the db mapping so we don't repeat the ones already done
  // The first execution did about 11 subcategories successfully without breaking. I will run everything indiscriminately; it will correctly just overwrite Cloudinary natively.
  
  const categories = db.prepare(`SELECT id, name FROM Category`).all();
  for (const c of categories) {
     let query = cleanName(c.name);
     console.log(`[Category] ${c.name} -> ${query}`);
     let finalUrl = await executeSearchPipeline(query, null, `cat_${c.id.substring(0,6)}`);
     if (finalUrl) db.prepare('UPDATE Category SET image = ? WHERE id = ?').run(finalUrl, c.id);
     gallery.push({ type: 'Category', name: c.name, query, url: finalUrl || 'FAILED' });
  }

  const subcategories = db.prepare(`SELECT s.id, s.name, c.name as catName FROM Subcategory s JOIN Category c ON s.categoryId = c.id`).all();
  for (const s of subcategories) {
     let query = `${cleanName(s.name)} ${cleanName(s.catName)}`.trim();
     console.log(`[Subcategory] ${s.name} -> ${query}`);
     let finalUrl = await executeSearchPipeline(query, cleanName(s.catName), `sub_${s.id.substring(0,6)}`);
     if (finalUrl) db.prepare('UPDATE Subcategory SET image = ? WHERE id = ?').run(finalUrl, s.id);
     gallery.push({ type: 'Subcategory', name: s.name, query, url: finalUrl || 'FAILED' });
  }
  
  const vendors = db.prepare(`SELECT id, name, businessType FROM Vendor`).all();
  for (const v of vendors) {
     let query = `${cleanName(v.name)} ${cleanName(v.businessType)} store`.trim();
     console.log(`[Vendor] ${v.name} -> ${query}`);
     let finalUrl = await executeSearchPipeline(query, cleanName(v.businessType), `ven_${v.id.substring(0,6)}`);
     if (finalUrl) db.prepare('UPDATE Vendor SET image = ?, logo = ? WHERE id = ?').run(finalUrl, finalUrl, v.id);
     gallery.push({ type: 'Vendor', name: v.name, query, url: finalUrl || 'FAILED' });
  }

  const products = db.prepare(`SELECT p.id, p.name, c.name as catName, s.name as subName FROM Product p JOIN Category c ON p.categoryId = c.id LEFT JOIN Subcategory s ON p.subcategoryId = s.id`).all();
  for (const p of products) {
     let query = `${cleanName(p.name)} ${cleanName(p.subName)}`.trim();
     console.log(`[Product] ${p.name} -> ${query}`);
     let fallback = `${cleanName(p.subName)} ${cleanName(p.catName)}`.trim();
     let finalUrl = await executeSearchPipeline(query, fallback, `prod_${p.id.substring(0,8)}`);
     if (finalUrl) db.prepare('UPDATE Product SET images = ? WHERE id = ?').run(finalUrl, p.id);
     gallery.push({ type: 'Product', name: p.name, query, url: finalUrl || 'FAILED' });
  }

  let md = '# Stage 9 Rebuild (Complete Visual Gallery Audit)\n\n';
  let totalFails = 0;
  for (const g of gallery) {
      md += `### [${g.type}] ${g.name}\n`;
      md += `- **Query**: \`${g.query}\`\n`;
      md += `- **Result**: ${g.url}\n`;
      if (g.url !== 'FAILED') md += `\n![Preview](${g.url})\n`;
      else totalFails++;
      md += `\n---\n`;
  }
  md += `\n> **Total Items**: ${gallery.length} | **Total Failed Skips**: ${totalFails}`;
  
  const destPath = path.join(__dirname, '..', '..', '..', '..', '.gemini', 'antigravity', 'brain', '8ab5dbd6-e767-4941-91d5-791cf3284005', 'stage9_visual_gallery.md');
  fs.writeFileSync(destPath, md);
  fs.writeFileSync(destPath + '.resolved', ''); // Register native mapping

  console.log("Migration Suite Completed!");
}

async function executeSearchPipeline(primaryQuery, fallbackQuery, pubId) {
    let candidates = await fetchUnsplash(primaryQuery);
    await delay(1500);
    
    if (candidates.length === 0 && fallbackQuery && primaryQuery !== fallbackQuery) {
       console.log(` ---> Primary 0 results. Executing fallback: "${fallbackQuery}"`);
       candidates = await fetchUnsplash(fallbackQuery);
       await delay(1500);
    }

    for (const urlObj of candidates) {
        const processState = await processCandidateImage(urlObj.thumb);
        if (processState.valid) {
            const finalBuffer = await downloadFullImage(urlObj.full);
            if (finalBuffer) {
                usedHashes.push(processState.hash);
                const cRes = await uploadToCloudinary(finalBuffer, pubId);
                return cRes.secure_url;
            }
        } else {
            console.log(` ---> Hash Rejected: ${processState.reason}`);
        }
    }
    return null;
}

runExecution();
