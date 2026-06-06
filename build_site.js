const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Load site data
console.log('Loading site data...');
let siteData;
try {
  siteData = require('./site_data.js');
} catch (err) {
  console.error('Error: Could not load site_data.js. Make sure it exists and has no syntax errors.', err);
  process.exit(1);
}

// Ensure output directories exist
fs.mkdirSync(path.join(__dirname, 'product'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'category'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'blog'), { recursive: true });

// 2. Read template files
console.log('Reading templates...');
const templatesDir = path.join(__dirname, 'templates');
const readTemplate = (filename) => fs.readFileSync(path.join(templatesDir, filename), 'utf-8');

const layoutTemplate = readTemplate('layout.html');
const indexTemplate = readTemplate('index.html');
const shopTemplate = readTemplate('shop.html');
const productTemplate = readTemplate('product.html');
const categoryTemplate = readTemplate('category.html');
const aboutTemplate = readTemplate('about.html');
const contactTemplate = readTemplate('contact.html');
const blogTemplate = readTemplate('blog.html');
const blogDetailTemplate = readTemplate('blog_detail.html');
const error404Template = readTemplate('404.html');

// Helper to generate star ratings
function generateStarsHTML(rating) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars += '★'; // Solid Star
    } else if (i === fullStars + 1 && hasHalf) {
      stars += '★'; // We can use solid for simplicity, or half if needed
    } else {
      stars += '☆'; // Empty Star
    }
  }
  return stars;
}

// Helper to fill layout placeholders
function compilePage(contentHTML, pageTitle, rawPageDesc, pathPrefix = '', activeNav = '', extraHead = '', seoOptions = {}) {
  let footerCategoriesHTML = '';
  siteData.categories.forEach(cat => {
    footerCategoriesHTML += `<li><a href="${pathPrefix}category/${cat.id}/" class="hover:text-white transition-colors">${cat.name}</a></li>\n`;
  });

  const resolveAssetPath = (filePath) => {
    if (!filePath) return '';
    if (pathPrefix === '/') {
      return '/' + filePath.replace(/^\//, '');
    }
    return pathPrefix + filePath;
  };

  const homeURL = pathPrefix || './';

  // --- Technical SEO Implementation ---
  
  // 1. Smart Meta Description Length Control
  let pageDesc = (rawPageDesc || '').trim();
  if (pageDesc.length > 0 && pageDesc.length < 120) {
    pageDesc += ' Trusted by professionals worldwide. Instant delivery and 100% replacement guarantee.';
  }
  if (pageDesc.length > 160) {
    pageDesc = pageDesc.substring(0, 157) + '...';
  }

  // 2. Generate SEO Tags (Canonical, Robots, OG, Twitter, Keywords)
  const canonicalUrl = seoOptions.url || `https://pvamarketplace.com/`;
  const ogType = seoOptions.type || 'website';
  const ogImage = seoOptions.image ? `https://pvamarketplace.com/${seoOptions.image}` : `https://pvamarketplace.com/${siteData.settings.logoImage || 'images/logo/logo.webp'}`;
  
  let seoHeadHTML = `
  <link rel="canonical" href="${canonicalUrl}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="${pageTitle}" />
  <meta property="og:description" content="${pageDesc}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:image" content="${ogImage}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${pageTitle}" />
  <meta name="twitter:description" content="${pageDesc}" />
  <meta name="twitter:image" content="${ogImage}" />`;

  if (seoOptions.keywords) {
    seoHeadHTML += `\n  <meta name="keywords" content="${seoOptions.keywords}" />`;
  }

  // 3. Organization Schema (Default)
  let schemas = [];
  if (seoOptions.schemas) {
    schemas = seoOptions.schemas;
  }
  
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PVA Marketplace",
    "url": "https://pvamarketplace.com/",
    "logo": `https://pvamarketplace.com/${siteData.settings.logoImage || 'images/logo/logo.webp'}`
  };
  schemas.push(orgSchema);

  schemas.forEach(schemaObj => {
    seoHeadHTML += `\n  <script type="application/ld+json">\n${JSON.stringify(schemaObj, null, 2)}\n  </script>`;
  });

  const finalExtraHead = seoHeadHTML + '\n  ' + extraHead;

  let html = layoutTemplate
    .replace(/\{\{CONTENT\}\}/g, () => contentHTML)
    .replace(/\{\{PATH_PREFIX\}\}index/g, () => homeURL)
    .replace(/\{\{PAGE_TITLE\}\}/g, () => pageTitle)
    .replace(/\{\{PAGE_DESCRIPTION\}\}/g, () => pageDesc)
    .replace(/\{\{SITE_NAME\}\}/g, () => siteData.settings.siteName)
    .replace(/\{\{LOGO_IMAGE\}\}/g, () => resolveAssetPath(siteData.settings.logoImage || 'images/logo/logo.webp') + '?v=' + Date.now())
    .replace(/\{\{FAVICON_IMAGE\}\}/g, () => resolveAssetPath(siteData.settings.faviconImage || 'images/logo/favicon.webp') + '?v=' + Date.now())
    .replace(/\{\{FOOTER_ABOUT_TEXT\}\}/g, () => siteData.settings.footerAboutText)
    .replace(/\{\{FACEBOOK_URL\}\}/g, () => siteData.settings.facebookUrl)
    .replace(/\{\{INSTAGRAM_URL\}\}/g, () => siteData.settings.instagramUrl)
    .replace(/\{\{TIKTOK_URL\}\}/g, () => siteData.settings.tiktokUrl || '')
    .replace(/\{\{TELEGRAM_URL\}\}/g, () => siteData.settings.telegramUrl || '')
    .replace(/\{\{TELEGRAM_USERNAME\}\}/g, () => {
      const url = siteData.settings.telegramUrl || '';
      const match = url.match(/t\.me\/([\w]+)/);
      return match ? '@' + match[1] : url;
    })
    .replace(/\{\{CONTACT_ADDRESS\}\}/g, () => siteData.settings.address)
    .replace(/\{\{CONTACT_PHONE\}\}/g, () => siteData.settings.contactPhone)
    .replace(/\{\{CONTACT_EMAIL\}\}/g, () => siteData.settings.contactEmail)
    .replace(/\{\{WHATSAPP_NUMBER\}\}/g, () => siteData.settings.whatsappNumber)
    .replace(/\{\{CLEAN_WHATSAPP_NUMBER\}\}/g, () => siteData.settings.whatsappNumber.replace(/\D/g, ''))
    .replace(/\{\{INSIDE_CHAPAIFEE\}\}/g, () => siteData.settings.insideChapaiDeliveryFee)
    .replace(/\{\{OUTSIDE_CHAPAIFEE\}\}/g, () => siteData.settings.outsideChapaiDeliveryFee)
    .replace(/\{\{PATH_PREFIX\}\}/g, () => pathPrefix)
    .replace(/\{\{FOOTER_CATEGORIES\}\}/g, () => footerCategoriesHTML)
    .replace(/\{\{COUPONS_JSON\}\}/g, () => JSON.stringify(siteData.coupons || []))
    .replace(/\{\{EXTRA_HEAD\}\}/g, () => finalExtraHead);

  // Set active class for navigation
  html = html
    .replace(/\{\{NAV_ACTIVE_HOME\}\}/g, activeNav === 'home' ? 'text-brand-500 font-semibold border-b-2 border-brand-500' : 'text-slate-600')
    .replace(/\{\{NAV_ACTIVE_SHOP\}\}/g, activeNav === 'shop' ? 'text-brand-500 font-semibold border-b-2 border-brand-500' : 'text-slate-600')
    .replace(/\{\{NAV_ACTIVE_ABOUT\}\}/g, activeNav === 'about' ? 'text-brand-500 font-semibold border-b-2 border-brand-500' : 'text-slate-600')
    .replace(/\{\{NAV_ACTIVE_BLOG\}\}/g, activeNav === 'blog' ? 'text-brand-500 font-semibold border-b-2 border-brand-500' : 'text-slate-600')
    .replace(/\{\{NAV_ACTIVE_CONTACT\}\}/g, activeNav === 'contact' ? 'text-brand-500 font-semibold border-b-2 border-brand-500' : 'text-slate-600');

  return html;
}

// Generate product card HTML
function renderProductCard(product, prefix = '', index = 0) {
  // Filter reviews for this product dynamically
  const productReviews = (siteData.reviews || []).filter(r => r.productId === product.id);
  const reviewsCount = productReviews.length;
  let rating = 5;
  if (productReviews.length > 0) {
    const totalRating = productReviews.reduce((sum, r) => sum + Number(r.rating), 0);
    rating = Number((totalRating / productReviews.length).toFixed(1));
  }

  const badgesHTML = `
    ${product.isNew ? `<span class="px-2.5 py-1 text-[10px] font-bold bg-brand-500 text-white rounded-full uppercase tracking-wider">New</span>` : ''}
    ${product.isBestSeller ? `<span class="px-2.5 py-1 text-[10px] font-bold bg-accent-orange text-white rounded-full uppercase tracking-wider">Best Seller</span>` : ''}
  `;

  return `
  <div class="product-card-item bg-white rounded-2xl border border-brand-100 p-4 hover-glow flex flex-col justify-between group relative transition-custom"
       data-category="${product.category}"
       data-price="${product.price}"
       data-rating="${rating}"
       data-name="${product.name}"
       data-in-stock="${product.inStock}"
       data-index="${index}">
       
    <!-- Badges -->
    <div class="absolute top-4 left-4 z-10 flex flex-col gap-1">
      ${badgesHTML}
    </div>
    
    <!-- Image -->
    <a href="${prefix}product/${product.id}/" class="h-48 w-full bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center mb-4">
      <img decoding="async" src="${prefix}${product.image}" alt="${product.name}" loading="lazy" width="240" height="240" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
    </a>

    <!-- Details -->
    <div class="space-y-2 flex-grow flex flex-col justify-between">
      <div>
        <div class="flex items-center gap-1 text-amber-400 text-xs">
          ${generateStarsHTML(rating)}
          <span class="text-slate-400 font-medium ml-1">(${reviewsCount})</span>
        </div>
        <a href="${prefix}product/${product.id}/" class="block mt-1">
          <h3 class="text-base font-bold text-slate-800 hover:text-brand-500 transition-colors leading-snug font-sans">${product.name}</h3>
        </a>
      </div>

      <!-- Pricing & Actions -->
      <div class="flex items-center justify-between pt-3 border-t border-slate-50">
        <div class="flex flex-col">
          <span class="text-[10px] text-slate-400 font-medium font-sans">Per ${product.unit}</span>
          <div class="flex items-baseline gap-1.5">
            <span class="text-base font-bold text-brand-600 font-serif">$${product.price}</span>
            <span class="text-xs text-slate-400 line-through font-serif">$${product.originalPrice}</span>
          </div>
        </div>

        ${product.inStock ? `
        <button onclick="window.dispatchEvent(new CustomEvent('add-to-cart-event', { detail: { id: '${product.id}', name: '${product.name.replace(/'/g, "\\'")}', price: ${product.price}, unit: '${product.unit}', image: '${product.image}', qty: 1 } }))"
                class="w-9 h-9 rounded-full bg-brand-50 hover:bg-brand-500 text-brand-600 hover:text-white flex items-center justify-center transition-all shadow-xs border border-brand-100 hover:border-brand-500 cursor-pointer" 
                aria-label="Add to cart">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        ` : `
        <span class="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">Out of Stock</span>
        `}
      </div>
    </div>
  </div>
  `;
}

// Generate blog card HTML
function renderBlogCard(blog, prefix = '') {
  return `
  <div class="bg-white rounded-2xl border border-brand-100 overflow-hidden hover-glow flex flex-col justify-between group transition-custom">
    <div>
      <!-- Image -->
      <a href="${prefix}blog/${blog.id}/" class="block aspect-video w-full overflow-hidden bg-slate-50 border-b border-slate-50">
        <img decoding="async" src="${prefix}${blog.image}" alt="${blog.title}" loading="lazy" width="400" height="250" class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500">
      </a>
      
      <!-- Details -->
      <div class="p-6 space-y-3">
        <div class="flex items-center justify-between text-[11px] font-semibold text-slate-400 font-sans">
          <span class="px-2.5 py-0.5 bg-brand-50 text-brand-600 rounded-full">${blog.category}</span>
          <span>${blog.date}</span>
        </div>
        <a href="${prefix}blog/${blog.id}/" class="block">
          <h3 class="text-base font-bold text-slate-800 hover:text-brand-500 transition-colors leading-snug font-serif">${blog.title}</h3>
        </a>
        <p class="text-xs text-slate-500 leading-relaxed font-sans line-clamp-3">${blog.excerpt}</p>
      </div>
    </div>
    
    <div class="px-6 pb-6 pt-2">
      <a href="${prefix}blog/${blog.id}/" class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-500 transition-all group-hover:translate-x-0.5 duration-300">
        Read More 
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </a>
    </div>
  </div>
  `;
}

// ----------------------------------------------------
// BUILD HOMEPAGE (index.html)
// ----------------------------------------------------
console.log('Generating index.html...');
let categoriesGridHTML = '';
siteData.categories.forEach(cat => {
  categoriesGridHTML += `
  <a href="category/${cat.id}/" class="relative group h-64 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-brand-100 block">
    <img decoding="async" src="${cat.image}" alt="${cat.name}" loading="lazy" width="300" height="200" class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500">
    <div class="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/20 to-transparent"></div>
    <div class="absolute bottom-5 left-5 right-5">
      <span class="text-[10px] font-bold text-accent-yellow uppercase tracking-wider font-sans">Collection</span>
      <h3 class="text-lg font-bold text-white mt-0.5 font-serif">${cat.name}</h3>
      <p class="text-xs text-brand-200/80 mt-1 leading-relaxed font-sans">${cat.description}</p>
    </div>
  </a>
  `;
});

let bestSellersGridHTML = '';
let bestSellers = siteData.products.filter(p => p.isBestSeller).slice(0, 6);
bestSellers.forEach((prod, index) => {
  bestSellersGridHTML += renderProductCard(prod, '', index);
});

let testimonialsGridHTML = '';
siteData.testimonials.forEach(test => {
  testimonialsGridHTML += `
  <div class="bg-white p-6 rounded-2xl border border-brand-100 shadow-xs space-y-4">
    <div class="flex items-center gap-1 text-amber-400 text-sm">
      ${generateStarsHTML(test.rating)}
    </div>
    <p class="text-sm text-slate-600 leading-relaxed italic font-sans">"${test.text}"</p>
    <div class="flex items-center gap-3 pt-2">
      <div class="w-8 h-8 rounded-full bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-xs">
        ${test.name.charAt(0)}
      </div>
      <div>
        <h4 class="text-xs font-bold text-slate-800">${test.name}</h4>
        <p class="text-[10px] text-slate-400">${test.designation} • ${test.date}</p>
      </div>
    </div>
  </div>
  `;
});

let indexContent = indexTemplate
  .replace(/\{\{CATEGORIES_GRID\}\}/g, () => categoriesGridHTML)
  .replace(/\{\{PRODUCTS_GRID\}\}/g, () => bestSellersGridHTML)
  .replace(/\{\{TESTIMONIALS_GRID\}\}/g, () => testimonialsGridHTML);

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "PVA Marketplace",
  "url": "https://pvamarketplace.com/",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://pvamarketplace.com/shop.html?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are PVA accounts?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Phone Verified Accounts (PVA) are email or social media accounts verified using unique phone numbers to ensure higher security, trust score, and compliance."
      }
    },
    {
      "@type": "Question",
      "name": "How long does delivery take?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Orders are processed quickly. Standard accounts are delivered within 2 to 24 hours via email or WhatsApp."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer a replacement guarantee?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we offer a 100% security replacement guarantee for all verified accounts if you encounter any login or checkpoint issues within the specified warranty period."
      }
    },
    {
      "@type": "Question",
      "name": "Can I buy accounts in bulk?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we offer bulk discounts for bulk orders. Contact our sales team on WhatsApp or Telegram for a custom quote."
      }
    }
  ]
};

const compiledHomepage = compilePage(
  indexContent, 
  'Premium Verified Accounts Marketplace', 
  'Buy verified Gmail, Facebook, Twitter, Binance, and Cash App accounts. Trusted phone verified accounts for marketing and automation.', 
  '', 
  'home', 
  '<link rel="preload" as="image" href="images/hero-bg.webp" fetchpriority="high">', 
  { 
    url: 'https://pvamarketplace.com/', 
    image: 'images/hero-bg.webp', 
    keywords: 'pva accounts, buy pva, verified accounts, digital marketing',
    schemas: [websiteSchema, faqSchema]
  }
);

fs.writeFileSync(
  path.join(__dirname, 'index.html'), 
  compiledHomepage
);

fs.writeFileSync(
  path.join(__dirname, 'home.html'), 
  compiledHomepage
);

// ----------------------------------------------------
// BUILD SHOP PAGE (shop.html)
// ----------------------------------------------------
console.log('Generating shop.html...');
let categoriesFilterListHTML = '';
siteData.categories.forEach(cat => {
  categoriesFilterListHTML += `
  <button @click="setCategory('${cat.id}')" 
          :class="activeCategory === '${cat.id}' ? 'bg-brand-500 text-white font-semibold' : 'text-slate-600 hover:bg-brand-50'" 
          class="w-full text-left text-sm px-3 py-2 rounded-lg transition-all flex justify-between items-center cursor-pointer">
    <span>${cat.name}</span>
  </button>
  `;
});

let shopProductsHTML = '';
siteData.products.forEach((prod, index) => {
  shopProductsHTML += renderProductCard(prod, '../', index);
});

let shopContent = shopTemplate
  .replace(/\{\{CATEGORIES_FILTER_LIST\}\}/g, () => categoriesFilterListHTML)
  .replace(/\{\{SHOP_PRODUCTS_LIST\}\}/g, () => shopProductsHTML);

const shopDir = path.join(__dirname, 'shop');
if (!fs.existsSync(shopDir)) fs.mkdirSync(shopDir, { recursive: true });
fs.writeFileSync(
  path.join(shopDir, 'index.html'),
  compilePage(shopContent, 'Shop PVA Accounts', 'Explore our selection of premium verified accounts, including email, social, and payment gateway profiles.', '../', 'shop', '', { url: 'https://pvamarketplace.com/shop/' })
);

// ----------------------------------------------------
// BUILD CATEGORY PAGES (category/[id].html)
// ----------------------------------------------------
console.log('Generating category pages...');
siteData.categories.forEach(cat => {
  const catProducts = siteData.products.filter(p => p.category === cat.id);
  
  let catProductsHTML = '';
  catProducts.forEach((prod, index) => {
    catProductsHTML += renderProductCard(prod, '../../', index);
  });

  let catContent = categoryTemplate
    .replace(/\{\{CATEGORY_NAME\}\}/g, () => cat.name)
    .replace(/\{\{CATEGORY_DESCRIPTION\}\}/g, () => cat.description)
    .replace(/\{\{CATEGORY_PRODUCTS\}\}/g, () => catProductsHTML)
    .replace(/\{\{CATEGORY_EMPTY\}\}/g, () => catProducts.length === 0 ? 'true' : 'false');

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://pvamarketplace.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": cat.name,
        "item": `https://pvamarketplace.com/category/${cat.id}/`
      }
    ]
  };

  const catDir = path.join(__dirname, 'category', cat.id);
  if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });
  fs.writeFileSync(
    path.join(catDir, 'index.html'),
    compilePage(catContent, cat.name, cat.description, '../../', '', '', { 
      url: `https://pvamarketplace.com/category/${cat.id}/`,
      schemas: [breadcrumbSchema]
    })
  );
});

// ----------------------------------------------------
// BUILD PRODUCT DETAILS PAGES (product/[id].html)
// ----------------------------------------------------
console.log('Generating product detail pages...');
siteData.products.forEach(prod => {
  const cat = siteData.categories.find(c => c.id === prod.category) || { name: 'Products', id: 'all' };
  
  // Badges
  let badgesHTML = '';
  if (prod.isNew) badgesHTML += `<span class="px-2.5 py-1 text-[10px] font-bold bg-brand-500 text-white rounded-full uppercase tracking-wider">New</span>`;
  if (prod.isBestSeller) badgesHTML += `<span class="px-2.5 py-1 text-[10px] font-bold bg-accent-orange text-white rounded-full uppercase tracking-wider">Best Seller</span>`;

  // Filter reviews for this product
  const productReviews = (siteData.reviews || []).filter(r => r.productId === prod.id);
  const reviewsCount = productReviews.length;
  let rating = 5;
  if (productReviews.length > 0) {
    const totalRating = productReviews.reduce((sum, r) => sum + Number(r.rating), 0);
    rating = Number((totalRating / productReviews.length).toFixed(1));
  }

  // Related products
  let relatedProducts = siteData.products.filter(p => p.category === prod.category && p.id !== prod.id).slice(0, 4);
  let relatedHTML = '';
  relatedProducts.forEach((related, idx) => {
    relatedHTML += renderProductCard(related, '../../', idx);
  });
  if (!relatedHTML) {
    relatedHTML = `<p class="col-span-full text-sm text-slate-400 italic font-sans">No related products found.</p>`;
  }

  // Generate dynamic JSON-LD Product & Review schema
  const schemaObj = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": prod.name,
    "image": (prod.images || [prod.image]).map(img => `https://pvamarketplace.com/${img}`),
    "description": prod.shortDescription || prod.description,
    "sku": prod.id,
    "brand": {
      "@type": "Brand",
      "name": siteData.settings.siteName || "PVA Marketplace"
    },
    "offers": {
      "@type": "AggregateOffer",
      "url": `https://pvamarketplace.com/product/${prod.id}/`,
      "priceCurrency": "USD",
      "lowPrice": prod.price,
      "highPrice": prod.originalPrice,
      "offerCount": 1,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": prod.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  if (reviewsCount > 0) {
    schemaObj.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": rating,
      "reviewCount": reviewsCount,
      "bestRating": "5",
      "worstRating": "1"
    };
    schemaObj.review = productReviews.map(r => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": r.name
      },
      "datePublished": r.date,
      "reviewBody": r.text,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": r.rating,
        "bestRating": "5",
        "worstRating": "1"
      }
    }));
  } else {
    // Default aggregate rating if none
    schemaObj.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": 5,
      "reviewCount": 1,
      "bestRating": "5",
      "worstRating": "1"
    };
  }
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://pvamarketplace.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": cat.name,
        "item": `https://pvamarketplace.com/category/${cat.id}/`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": prod.name,
        "item": `https://pvamarketplace.com/product/${prod.id}/`
      }
    ]
  };

  // Generate features list HTML
  const featuresList = (prod.features || []).map(f => `
    <li class="flex items-start gap-2.5 text-slate-600 text-sm">
      <svg class="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span>${f}</span>
    </li>
  `).join('');

  // Generate pricing options HTML
  let pricingOptionsHTML = '<option value="" selected disabled>Choose an option</option>';
  if (prod.pricing && prod.pricing.length > 0) {
    pricingOptionsHTML += prod.pricing.map(p => `<option value="${p}">${p}</option>`).join('');
  }

  let prodContent = productTemplate
    .replace(/\{\{PRODUCT_ID\}\}/g, () => prod.id)
    .replace(/\{\{PRODUCT_NAME\}\}/g, () => prod.name)
    .replace(/\{\{PRODUCT_CATEGORY_ID\}\}/g, () => cat.id)
    .replace(/\{\{PRODUCT_CATEGORY_NAME\}\}/g, () => cat.name)
    .replace(/\{\{PRODUCT_IMAGE\}\}/g, () => prod.image)
    .replace(/\{\{PRODUCT_IMAGES_LIST_JSON\}\}/g, () => JSON.stringify(prod.images || [prod.image]).replace(/'/g, "\\'").replace(/"/g, "'"))
    .replace(/\{\{PRODUCT_SCHEMA_JSON\}\}/g, () => '') // Removed as it's injected via Extra Head
    .replace(/\{\{PRODUCT_PRICE\}\}/g, () => prod.price)
    .replace(/\{\{PRODUCT_ORIGINAL_PRICE\}\}/g, () => prod.originalPrice)
    .replace(/\{\{PRODUCT_UNIT\}\}/g, () => prod.unit)
    .replace(/\{\{PRODUCT_DESCRIPTION\}\}/g, () => prod.description)
    .replace(/\{\{PRODUCT_SHORT_DESCRIPTION\}\}/g, () => prod.shortDescription || prod.description)
    .replace(/\{\{PRODUCT_REVIEWS_COUNT\}\}/g, () => reviewsCount)
    .replace(/\{\{PRODUCT_STARS\}\}/g, () => generateStarsHTML(rating))
    .replace(/\{\{PRODUCT_RATING_RAW\}\}/g, () => rating)
    .replace(/\{\{PRODUCT_REVIEWS_JSON\}\}/g, () => JSON.stringify(productReviews).replace(/'/g, "\\'"))
    .replace(/\{\{PRODUCT_BADGES\}\}/g, () => badgesHTML)
    .replace(/\{\{PRODUCT_IN_STOCK\}\}/g, () => prod.inStock ? 'true' : 'false')
    .replace(/\{\{STOCK_STATUS_TEXT\}\}/g, () => prod.inStock ? 'In Stock' : 'Out of Stock')
    .replace(/\{\{STOCK_STATUS_COLOR\}\}/g, () => prod.inStock ? 'text-emerald-500' : 'text-rose-500')
    .replace(/\{\{RELATED_PRODUCTS\}\}/g, () => relatedHTML)
    .replace(/\{\{FEATURES_LIST\}\}/g, () => featuresList)
    .replace(/\{\{PRICING_OPTIONS\}\}/g, () => pricingOptionsHTML)
    .replace(/\{\{PRODUCT_PRICING_OPTIONS_JSON\}\}/g, () => JSON.stringify(prod.pricing || []).replace(/'/g, "\\'").replace(/"/g, "'"))
    .replace(/\{\{PRODUCT_HAS_FEATURES\}\}/g, () => prod.features && prod.features.length > 0 ? 'true' : 'false');

  const cleanMetaDesc = prod.seo_description || prod.description.replace(/[\r\n]+/g, ' ').replace(/"/g, '&quot;').substring(0, 150) + '...';
  const finalTitle = prod.seo_title || `${prod.name} – Verified & Fast | ${siteData.settings.siteName || "PVA Marketplace"}`;

  const prodDir = path.join(__dirname, 'product', prod.id);
  if (!fs.existsSync(prodDir)) fs.mkdirSync(prodDir, { recursive: true });
  fs.writeFileSync(
    path.join(prodDir, 'index.html'),
    compilePage(prodContent, finalTitle, cleanMetaDesc, '../../', '', `<link rel="preload" as="image" href="../../${prod.image}" fetchpriority="high">`, {
      url: `https://pvamarketplace.com/product/${prod.id}/`,
      image: prod.image,
      keywords: prod.seo_tags || 'pva accounts, buy pva',
      type: 'product',
      schemas: [schemaObj, breadcrumbSchema]
    })
  );
});

// Clean up stale product pages in the product/ directory
try {
  const productFiles = fs.readdirSync(path.join(__dirname, 'product'));
  const activeProductDirs = new Set(siteData.products.map(p => p.id));
  productFiles.forEach(file => {
    const fullPath = path.join(__dirname, 'product', file);
    if (fs.statSync(fullPath).isDirectory() && !activeProductDirs.has(file)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`Deleted stale product page: product/${file}`);
      } catch (err) {
        console.error(`Error deleting stale product page product/${file}:`, err.message);
      }
    }
  });
} catch (err) {
  console.error('Error cleaning up product directory:', err.message);
}

// Clean up stale category pages in the category/ directory
try {
  const categoryFiles = fs.readdirSync(path.join(__dirname, 'category'));
  const activeCategoryDirs = new Set(siteData.categories.map(c => c.id));
  categoryFiles.forEach(file => {
    const fullPath = path.join(__dirname, 'category', file);
    if (fs.statSync(fullPath).isDirectory() && !activeCategoryDirs.has(file)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`Deleted stale category page: category/${file}`);
      } catch (err) {
        console.error(`Error deleting stale category page category/${file}:`, err.message);
      }
    }
  });
} catch (err) {
  console.error('Error cleaning up category directory:', err.message);
}

// ----------------------------------------------------
// BUILD STATIC PAGES (about.html, contact.html)
// ----------------------------------------------------
console.log('Generating about.html and contact.html...');
const aboutDir = path.join(__dirname, 'about');
if (!fs.existsSync(aboutDir)) fs.mkdirSync(aboutDir, { recursive: true });
fs.writeFileSync(
  path.join(aboutDir, 'index.html'),
  compilePage(aboutTemplate, 'About Us', 'Learn about PVA Marketplace, our verification processes, security standards, and support channels.', '../', 'about', '', { url: 'https://pvamarketplace.com/about/' })
);
const contactDir = path.join(__dirname, 'contact');
if (!fs.existsSync(contactDir)) fs.mkdirSync(contactDir, { recursive: true });
fs.writeFileSync(
  path.join(contactDir, 'index.html'),
  compilePage(contactTemplate, 'Contact Us', 'Get in touch with the PVA Marketplace sales and support team. Available on WhatsApp and Telegram.', '../', 'contact', '', { url: 'https://pvamarketplace.com/contact/' })
);
fs.writeFileSync(
  path.join(__dirname, '404.html'),
  compilePage(
    error404Template, 
    '404 - Page Not Found', 
    'Sorry, the page you are looking for does not exist!', 
    '', 
    '', 
    `<script>
      (function() {
        var path = window.location.pathname;
        var baseHref = '/';
        if (path.includes('/PVA-Marketplace/')) {
          baseHref = '/PVA-Marketplace/';
        }
        var base = document.createElement('base');
        base.href = window.location.origin + baseHref;
        document.head.insertBefore(base, document.head.firstChild);
      })();
    </script>`,
    { url: 'https://pvamarketplace.com/404.html' }
  )
);

// ----------------------------------------------------
// BUILD BLOG PAGES (blog.html & blog/[id].html)
// ----------------------------------------------------
console.log('Generating blog.html and blog detail pages...');
let blogsGridHTML = '';
(siteData.blogs || []).forEach(blog => {
  blogsGridHTML += renderBlogCard(blog, '../');
});

let blogContent = blogTemplate
  .replace(/\{\{BLOGS_GRID\}\}/g, () => blogsGridHTML);

const blogDir = path.join(__dirname, 'blog');
if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
fs.writeFileSync(
  path.join(blogDir, 'index.html'),
  compilePage(blogContent, 'Blog & News', 'Read the latest guides, tips, and tutorials about PVA accounts, proxy setups, and digital marketing.', '../', 'blog', '', { url: 'https://pvamarketplace.com/blog/' })
);

(siteData.blogs || []).forEach(blog => {
  // Generate related blogs (excluding current)
  let relatedBlogs = (siteData.blogs || []).filter(b => b.id !== blog.id).slice(0, 3);
  let relatedBlogsHTML = '';
  relatedBlogs.forEach(rel => {
    relatedBlogsHTML += renderBlogCard(rel, '../../');
  });
  if (!relatedBlogsHTML) {
    relatedBlogsHTML = `<p class="col-span-full text-sm text-slate-400 italic font-sans">No related blog posts found.</p>`;
  }

  let blogDetailContent = blogDetailTemplate
    .replace(/\{\{BLOG_TITLE\}\}/g, () => blog.title)
    .replace(/\{\{BLOG_CATEGORY\}\}/g, () => blog.category)
    .replace(/\{\{BLOG_AUTHOR\}\}/g, () => blog.author)
    .replace(/\{\{BLOG_DATE\}\}/g, () => blog.date)
    .replace(/\{\{BLOG_READ_TIME\}\}/g, () => blog.readTime)
    .replace(/\{\{BLOG_IMAGE\}\}/g, () => blog.image)
    .replace(/\{\{BLOG_CONTENT\}\}/g, () => blog.content)
    .replace(/\{\{RELATED_BLOGS\}\}/g, () => relatedBlogsHTML);

  const cleanMetaDesc = blog.seo_description || (blog.excerpt || blog.content).replace(/[\r\n]+/g, ' ').replace(/"/g, '&quot;').substring(0, 150) + '...';
  const finalTitle = blog.seo_title || blog.title;

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "image": `https://pvamarketplace.com/${blog.image}`,
    "author": {
      "@type": "Person",
      "name": blog.author || "Admin"
    },
    "publisher": {
      "@type": "Organization",
      "name": "PVA Marketplace",
      "logo": {
        "@type": "ImageObject",
        "url": `https://pvamarketplace.com/${siteData.settings.logoImage || 'images/logo/logo.webp'}`
      }
    },
    "description": blog.excerpt || (blog.content || '').replace(/<[^>]+>/g, ' ').substring(0, 150).trim() + '...'
  };

  // Safe date conversion to ISO format (YYYY-MM-DD)
  try {
    const parsedDate = new Date(blog.date);
    if (!isNaN(parsedDate.getTime())) {
      blogPostingSchema.datePublished = parsedDate.toISOString().split('T')[0];
    } else {
      blogPostingSchema.datePublished = new Date().toISOString().split('T')[0];
    }
  } catch (e) {
    blogPostingSchema.datePublished = new Date().toISOString().split('T')[0];
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://pvamarketplace.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://pvamarketplace.com/blog/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": blog.title,
        "item": `https://pvamarketplace.com/blog/${blog.id}/`
      }
    ]
  };

  const blogPostDir = path.join(__dirname, 'blog', blog.id);
  if (!fs.existsSync(blogPostDir)) fs.mkdirSync(blogPostDir, { recursive: true });
  fs.writeFileSync(
    path.join(blogPostDir, 'index.html'),
    compilePage(blogDetailContent, finalTitle, cleanMetaDesc, '../../', 'blog', `<link rel="preload" as="image" href="../../${blog.image}" fetchpriority="high">`, { 
      url: `https://pvamarketplace.com/blog/${blog.id}/`, 
      image: blog.image,
      keywords: blog.seo_tags || 'pva accounts, blog, guide',
      schemas: [blogPostingSchema, breadcrumbSchema]
    })
  );
});

// Clean up stale blog pages in the blog/ directory
try {
  const blogSubDirs = fs.readdirSync(path.join(__dirname, 'blog'));
  const activeBlogDirs = new Set((siteData.blogs || []).map(b => b.id));
  blogSubDirs.forEach(file => {
    const fullPath = path.join(__dirname, 'blog', file);
    if (fs.statSync(fullPath).isDirectory() && !activeBlogDirs.has(file)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`Deleted stale blog directory: blog/${file}`);
      } catch (err) {
        console.error(`Error deleting stale blog directory blog/${file}:`, err.message);
      }
    } else if (!fs.statSync(fullPath).isDirectory() && file !== 'index.html') {
      try {
        fs.unlinkSync(fullPath);
        console.log(`Deleted old static blog file: blog/${file}`);
      } catch (err) {
        console.error(`Error deleting old static blog file blog/${file}:`, err.message);
      }
    }
  });
} catch (err) {
  console.error('Error cleaning up blog directory:', err.message);
}

// Helper to escape XML special characters
const escapeXML = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// ----------------------------------------------------
// GENERATE SITEMAPS & RSS FEED
// ----------------------------------------------------
console.log('Generating sitemaps & feeds...');
const generateSitemaps = () => {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
  
  // Static pages
  const staticPages = ['index.html', 'shop.html', 'about.html', 'contact.html', 'blog.html'];
  staticPages.forEach(p => {
    let locPath = p.replace('.html', '');
    if (locPath === 'index') locPath = '';
    else locPath = locPath + '/';
    xml += `  <url>\n    <loc>https://pvamarketplace.com/${locPath}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${p === 'index.html' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
  });

  // Category pages
  siteData.categories.forEach(cat => {
    xml += `  <url>\n    <loc>https://pvamarketplace.com/category/${cat.id}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  });

  // Product pages with images
  siteData.products.forEach(prod => {
    xml += `  <url>\n    <loc>https://pvamarketplace.com/product/${prod.id}/</loc>\n    <image:image>\n      <image:loc>https://pvamarketplace.com/${escapeXML(prod.image)}</image:loc>\n      <image:title>${escapeXML(prod.seo_title || prod.name)}</image:title>\n    </image:image>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  });

  // Blog pages
  (siteData.blogs || []).forEach(blog => {
    xml += `  <url>\n    <loc>https://pvamarketplace.com/blog/${blog.id}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  });

  xml += `</urlset>`;
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), xml);

  // RSS Feed
  let rss = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n  <title>PVA Marketplace Blog</title>\n  <link>https://pvamarketplace.com/blog/</link>\n  <description>Latest guides and updates on PVA accounts and marketing.</description>\n`;
  
  (siteData.blogs || []).forEach(blog => {
    rss += `  <item>\n    <title>${escapeXML(blog.title)}</title>\n    <link>https://pvamarketplace.com/blog/${blog.id}/</link>\n    <description><![CDATA[${blog.excerpt || ''}]]></description>\n  </item>\n`;
  });
  
  rss += `</channel>\n</rss>`;
  fs.writeFileSync(path.join(__dirname, 'feed.xml'), rss);

  // HTML Sitemap (Visual)
  let htmlSitemap = `<div class="max-w-4xl mx-auto py-12 px-4 sm:px-6"><h1 class="text-3xl font-bold font-serif text-brand-600 mb-8">HTML Sitemap</h1><div class="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">`;
  
  htmlSitemap += `<div><h2 class="text-xl font-bold mb-4 border-b pb-2">Main Pages</h2><ul class="space-y-2">`;
  staticPages.forEach(p => {
    const title = p.replace('.html', '').replace(/^\w/, c => c.toUpperCase()) || 'Home';
    let cleanPath = p.replace('.html', '');
    if (cleanPath === 'index') cleanPath = './';
    else cleanPath = cleanPath + '/';
    htmlSitemap += `<li><a href="${cleanPath}" class="text-brand-500 hover:underline">${title}</a></li>`;
  });
  htmlSitemap += `</ul>`;
  
  // Blog Articles section
  htmlSitemap += `<div class="mt-8"><h2 class="text-xl font-bold mb-4 border-b pb-2">Blog Articles</h2><ul class="space-y-2">`;
  (siteData.blogs || []).forEach(blog => {
    htmlSitemap += `<li><a href="blog/${blog.id}/" class="text-brand-500 hover:underline">${blog.title}</a></li>`;
  });
  htmlSitemap += `</ul></div>`;
  
  htmlSitemap += `</div>`;
  
  htmlSitemap += `<div><h2 class="text-xl font-bold mb-4 border-b pb-2">Categories & Products</h2><ul class="space-y-4">`;
  siteData.categories.forEach(cat => {
    htmlSitemap += `<li><a href="category/${cat.id}/" class="font-bold text-slate-800 hover:text-brand-500">${cat.name}</a><ul class="pl-4 mt-2 border-l border-slate-200 space-y-1">`;
    const catProds = siteData.products.filter(p => p.category === cat.id);
    catProds.forEach(p => {
      htmlSitemap += `<li><a href="product/${p.id}/" class="text-slate-600 hover:text-brand-500 text-sm">${p.name}</a></li>`;
    });
    htmlSitemap += `</ul></li>`;
  });
  htmlSitemap += `</ul></div>`;
  
  htmlSitemap += `</div></div>`;
  
  fs.writeFileSync(
    path.join(__dirname, 'sitemap.html'),
    compilePage(htmlSitemap, 'Site Map', 'Sitemap of PVA Marketplace', '', '', '', { url: 'https://pvamarketplace.com/sitemap/' })
  );
};

generateSitemaps();

// ----------------------------------------------------
// COMPILE TAILWIND CSS
// ----------------------------------------------------
try {
  console.log('Compiling Tailwind CSS...');
  execSync('npx tailwindcss -i ./input.css -o ./output.css --minify', { stdio: 'inherit' });
  console.log('Tailwind compilation completed successfully.');
} catch (error) {
  console.error('Error compiling Tailwind CSS via npx:', error.message);
  console.log('Ensure tailwindcss CLI is working. Make sure npm dependencies are properly configured.');
}

console.log('🎉 Website built successfully!');
