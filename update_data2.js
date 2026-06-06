
const fs = require('fs');

const extracted = JSON.parse(fs.readFileSync('extracted_seo.json', 'utf8'));
const siteData = require('./site_data.js');

let updatedCount = 0;

for (const key in extracted) {
  let productId = key.match(/product\\\\(.*?)\\\\index.html/);
  if (!productId) {
     productId = key.match(/product\/(.*?)\/index.html/);
  }
  if (!productId) continue;
  productId = productId[1].replace(/\\\\/g, ''); // just in case
  
  const product = siteData.products.find(p => p.id === productId);
  if (!product) continue;
  
  const chunks = extracted[key];
  if (typeof chunks === 'string') {
    try {
        chunks = JSON.parse(chunks);
    } catch(e) {}
  }
  
  for (const chunk of chunks) {
    const rc = chunk.ReplacementContent;
    if (!rc) continue;
    
    const metaDescMatch = rc.match(/<meta name="description" content="([^"]+)">/);
    if (metaDescMatch) product.seo_description = metaDescMatch[1];
    
    const keywordsMatch = rc.match(/<meta name="keywords" content="([^"]+)" \/>/);
    if (keywordsMatch) product.seo_tags = keywordsMatch[1];
    else {
        const kw2 = rc.match(/<meta name="keywords" content="([^"]+)">/);
        if (kw2) product.seo_tags = kw2[1];
    }
    
    if (rc.includes('text-sm text-slate-600 leading-relaxed font-sans') && !rc.includes('Detailed Product Description')) {
      const match = rc.match(/<div class="text-sm text-slate-600 leading-relaxed font-sans(?: whitespace-pre-line)?">([\s\S]*?)<\/div>/);
      if (match) {
        product.shortDescription = match[1].trim();
      }
    }
    
    if (rc.includes('Detailed Product Description') || rc.includes('text-base text-slate-700 leading-relaxed')) {
      const match = rc.match(/<div class="text-base text-slate-700 leading-relaxed(?: whitespace-pre-line)?(?: space-y-5)?(?: space-y-4)?">([\s\S]*?)(?:<\/div>\s*<\/div>\s*<\/section>|$)/);
      if (match) {
        product.description = match[1].trim();
      }
    }
  }
  updatedCount++;
}

const newData = 'const siteData = ' + JSON.stringify(siteData, null, 2) + ';\n\nif (typeof module !== \'undefined\' && module.exports) {\n  module.exports = siteData;\n} else if (typeof window !== \'undefined\') {\n  window.siteData = siteData;\n}\n';

fs.writeFileSync('site_data.js', newData);
console.log('Updated ' + updatedCount + ' products in site_data.js');

