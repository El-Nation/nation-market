const https = require('https');

async function getUnsplashIds(query) {
  return new Promise((resolve, reject) => {
    https.get(`https://unsplash.com/s/photos/${query}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matches = data.match(/photo-[a-z0-9A-Z]+-[a-z0-9A-Z]+/g);
        if (matches) {
           const unique = [...new Set(matches)];
           resolve(unique.slice(0, 5));
        } else {
           resolve([]);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const queries = [
    'baby', 'kids-toys', 'drill', 'tires', 'car-parts',
    'sofa', 'kitchen-appliances', 'tractor', 'seeds',
    'headphones', 'smartphones', 'supermarket-aisle', 'fried-chicken'
  ];
  
  for (const q of queries) {
    const ids = await getUnsplashIds(q);
    console.log(`Query (${q}):`, ids);
  }
}

run();
