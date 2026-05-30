const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'build_site.js');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Fix homeURL
code = code.replace(
  "const homeURL = pathPrefix === '../' ? '../' : './';",
  "const homeURL = pathPrefix || './';"
);

// 2. Fix shopProductsHTML
code = code.replace(
  /siteData\.products\.forEach\(\(prod, index\) => \{\s+shopProductsHTML \+= renderProductCard\(prod, '', index\);\s+\}\);/,
  `siteData.products.forEach((prod, index) => {
  shopProductsHTML += renderProductCard(prod, '../', index);
});`
);

// 3. Fix shop.html write
code = code.replace(
  /fs\.writeFileSync\(\s*path\.join\(__dirname, 'shop\.html'\),\s*compilePage\(shopContent, 'Shop PVA Accounts', 'Explore our selection of premium verified accounts, including email, social, and payment gateway profiles\.', '', 'shop', '', \{ url: 'https:\/\/pvamarketplace\.com\/shop\/' \}\)\s*\);/,
  `const shopDir = path.join(__dirname, 'shop');
if (!fs.existsSync(shopDir)) fs.mkdirSync(shopDir, { recursive: true });
fs.writeFileSync(
  path.join(shopDir, 'index.html'),
  compilePage(shopContent, 'Shop PVA Accounts', 'Explore our selection of premium verified accounts, including email, social, and payment gateway profiles.', '../', 'shop', '', { url: 'https://pvamarketplace.com/shop/' })
);`
);

// 4. Fix catProductsHTML prefix (from '../' to '../../')
code = code.replace(
  /catProducts\.forEach\(\(prod, index\) => \{\s+catProductsHTML \+= renderProductCard\(prod, '\.\.\/', index\);\s+\}\);/,
  `catProducts.forEach((prod, index) => {
    catProductsHTML += renderProductCard(prod, '../../', index);
  });`
);

// 5. Fix category write
code = code.replace(
  /fs\.writeFileSync\(\s*path\.join\(__dirname, 'category', `\$\{cat\.id\}\.html`\),\s*compilePage\(catContent, cat\.name, cat\.description, '\.\.\/', '', '', \{\s*url: `https:\/\/pvamarketplace\.com\/category\/\$\{cat\.id\}\/`,\s*schemas: \[breadcrumbSchema\]\s*\}\)\s*\);/,
  `const catDir = path.join(__dirname, 'category', cat.id);
  if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });
  fs.writeFileSync(
    path.join(catDir, 'index.html'),
    compilePage(catContent, cat.name, cat.description, '../../', '', '', { 
      url: \`https://pvamarketplace.com/category/\${cat.id}/\`,
      schemas: [breadcrumbSchema]
    })
  );`
);

// 6. Fix relatedProducts in product (from '../' to '../../')
code = code.replace(
  /relatedProducts\.forEach\(\(related, idx\) => \{\s+relatedHTML \+= renderProductCard\(related, '\.\.\/', idx\);\s+\}\);/,
  `relatedProducts.forEach((related, idx) => {
    relatedHTML += renderProductCard(related, '../../', idx);
  });`
);

// 7. Fix product preload image prefix
code = code.replace(
  /href="\.\.\/\$\{prod\.image\}"/,
  `href="../../\${prod.image}"`
);

// 8. Fix product write
code = code.replace(
  /fs\.writeFileSync\(\s*path\.join\(__dirname, 'product', `\$\{prod\.id\}\.html`\),\s*compilePage\(prodContent, finalTitle, cleanMetaDesc, '\.\.\/', '', `<link rel="preload" as="image" href="\.\.\/\.\.\/\$\{prod\.image\}" fetchpriority="high">`, \{\s*url: `https:\/\/pvamarketplace\.com\/product\/\$\{prod\.id\}\/`,\s*image: prod\.image,\s*keywords: prod\.seo_tags \|\| 'pva accounts, buy pva',\s*type: 'product',\s*schemas: \[schemaObj, breadcrumbSchema\]\s*\}\)\s*\);/,
  `const prodDir = path.join(__dirname, 'product', prod.id);
  if (!fs.existsSync(prodDir)) fs.mkdirSync(prodDir, { recursive: true });
  fs.writeFileSync(
    path.join(prodDir, 'index.html'),
    compilePage(prodContent, finalTitle, cleanMetaDesc, '../../', '', \`<link rel="preload" as="image" href="../../\${prod.image}" fetchpriority="high">\`, {
      url: \`https://pvamarketplace.com/product/\${prod.id}/\`,
      image: prod.image,
      keywords: prod.seo_tags || 'pva accounts, buy pva',
      type: 'product',
      schemas: [schemaObj, breadcrumbSchema]
    })
  );`
);

// Wait, the regex for product write above includes the PREVIOUS replacement of href="../../${prod.image}". 
// The order of replacements above: #7 replaces it to ../../, so #8 regex needs to match ../../
// Let's rewrite #8 regex more loosely to avoid issues.
code = code.replace(
  /fs\.writeFileSync\(\s*path\.join\(__dirname, 'product', `\$\{prod\.id\}\.html`\),\s*compilePage\(prodContent, finalTitle, cleanMetaDesc, '\.\.\/', '', `<link rel="preload" as="image" href="\.\.\/\.\.\/\$\{prod\.image\}" fetchpriority="high">`, ([\s\S]*?)\}\)\s*\);/,
  `const prodDir = path.join(__dirname, 'product', prod.id);
  if (!fs.existsSync(prodDir)) fs.mkdirSync(prodDir, { recursive: true });
  fs.writeFileSync(
    path.join(prodDir, 'index.html'),
    compilePage(prodContent, finalTitle, cleanMetaDesc, '../../', '', \`<link rel="preload" as="image" href="../../\${prod.image}" fetchpriority="high">\`, $1})
  );`
);


// 9. Fix about.html write
code = code.replace(
  /fs\.writeFileSync\(\s*path\.join\(__dirname, 'about\.html'\),\s*compilePage\(aboutTemplate, 'About Us', 'Learn about PVA Marketplace, our verification processes, security standards, and support channels\.', '', 'about', '', \{ url: 'https:\/\/pvamarketplace\.com\/about\/' \}\)\s*\);/,
  `const aboutDir = path.join(__dirname, 'about');
if (!fs.existsSync(aboutDir)) fs.mkdirSync(aboutDir, { recursive: true });
fs.writeFileSync(
  path.join(aboutDir, 'index.html'),
  compilePage(aboutTemplate, 'About Us', 'Learn about PVA Marketplace, our verification processes, security standards, and support channels.', '../', 'about', '', { url: 'https://pvamarketplace.com/about/' })
);`
);

// 10. Fix contact.html write
code = code.replace(
  /fs\.writeFileSync\(\s*path\.join\(__dirname, 'contact\.html'\),\s*compilePage\(contactTemplate, 'Contact Us', 'Get in touch with the PVA Marketplace sales and support team\. Available on WhatsApp and Telegram\.', '', 'contact', '', \{ url: 'https:\/\/pvamarketplace\.com\/contact\/' \}\)\s*\);/,
  `const contactDir = path.join(__dirname, 'contact');
if (!fs.existsSync(contactDir)) fs.mkdirSync(contactDir, { recursive: true });
fs.writeFileSync(
  path.join(contactDir, 'index.html'),
  compilePage(contactTemplate, 'Contact Us', 'Get in touch with the PVA Marketplace sales and support team. Available on WhatsApp and Telegram.', '../', 'contact', '', { url: 'https://pvamarketplace.com/contact/' })
);`
);

// 11. Fix blogsGridHTML prefix
code = code.replace(
  /\(siteData\.blogs \|\| \[\]\)\.forEach\(blog => \{\s+blogsGridHTML \+= renderBlogCard\(blog, ''\);\s+\}\);/,
  `(siteData.blogs || []).forEach(blog => {
  blogsGridHTML += renderBlogCard(blog, '../');
});`
);

// 12. Fix blog.html write
code = code.replace(
  /fs\.writeFileSync\(\s*path\.join\(__dirname, 'blog\.html'\),\s*compilePage\(blogContent, 'Blog & News', 'Read the latest guides, tips, and tutorials about PVA accounts, proxy setups, and digital marketing\.', '', 'blog', '', \{ url: 'https:\/\/pvamarketplace\.com\/blog\/' \}\)\s*\);/,
  `const blogDir = path.join(__dirname, 'blog');
if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
fs.writeFileSync(
  path.join(blogDir, 'index.html'),
  compilePage(blogContent, 'Blog & News', 'Read the latest guides, tips, and tutorials about PVA accounts, proxy setups, and digital marketing.', '../', 'blog', '', { url: 'https://pvamarketplace.com/blog/' })
);`
);

// 13. Fix blog details related prefix
code = code.replace(
  /relatedBlogs\.forEach\(rel => \{\s+relatedBlogsHTML \+= renderBlogCard\(rel, '\.\.\/'\);\s+\}\);/,
  `relatedBlogs.forEach(rel => {
    relatedBlogsHTML += renderBlogCard(rel, '../../');
  });`
);

// 14. Fix blog/[id].html write
code = code.replace(
  /fs\.writeFileSync\(\s*path\.join\(__dirname, 'blog', `\$\{blog\.id\}\.html`\),\s*compilePage\(bContent, finalTitle, cleanMetaDesc, '\.\.\/', 'blog', `<link rel="preload" as="image" href="\.\.\/\$\{blog\.image\}" fetchpriority="high">`, ([\s\S]*?)\}\)\s*\);/,
  `const blogPostDir = path.join(__dirname, 'blog', blog.id);
  if (!fs.existsSync(blogPostDir)) fs.mkdirSync(blogPostDir, { recursive: true });
  fs.writeFileSync(
    path.join(blogPostDir, 'index.html'),
    compilePage(bContent, finalTitle, cleanMetaDesc, '../../', 'blog', \`<link rel="preload" as="image" href="../../\${blog.image}" fetchpriority="high">\`, $1})
  );`
);

// 15. Fix sitemap.html -> sitemap/index.html (optional, let's keep sitemap.html or sitemap/index.html, doesn't matter too much, but trailing slash is requested for all links)
code = code.replace(
  /fs\.writeFileSync\(\s*path\.join\(__dirname, 'sitemap\.html'\),\s*compilePage\(sitemapHTML, 'Sitemap', 'Sitemap of PVA Marketplace', '', 'sitemap', '', \{ url: 'https:\/\/pvamarketplace\.com\/sitemap\/' \}\)\s*\);/,
  `const sitemapDir = path.join(__dirname, 'sitemap');
if (!fs.existsSync(sitemapDir)) fs.mkdirSync(sitemapDir, { recursive: true });
fs.writeFileSync(
  path.join(sitemapDir, 'index.html'),
  compilePage(sitemapHTML, 'Sitemap', 'Sitemap of PVA Marketplace', '../', 'sitemap', '', { url: 'https://pvamarketplace.com/sitemap/' })
);`
);


// 16. Cleanup stale code for products/categories deletion.
// Currently it cleans up `product/*.html`.
code = code.replace(
  /const activeProductFiles = new Set\(siteData\.products\.map\(p => `\$\{p\.id\}\.html`\)\);\s*productFiles\.forEach\(file => \{\s*if \(file\.endsWith\('\.html'\) && !activeProductFiles\.has\(file\)\) \{\s*try \{\s*fs\.unlinkSync\(path\.join\(__dirname, 'product', file\)\);/g,
  `const activeProductDirs = new Set(siteData.products.map(p => p.id));
  productFiles.forEach(file => {
    const fullPath = path.join(__dirname, 'product', file);
    if (fs.statSync(fullPath).isDirectory() && !activeProductDirs.has(file)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });`
);


fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully updated build_site.js');
