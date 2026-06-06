const fs = require('fs');

let layout = fs.readFileSync('templates/layout.html', 'utf8');

// Replace footer h4 -> h3
layout = layout.replace(/<h4 class="text-brand-400/g, '<h3 class="text-brand-400');
layout = layout.replace(/tracking-wide font-sans">Quick Links<\/h4>/i, 'tracking-wide font-sans">Quick Links</h3>');
layout = layout.replace(/tracking-wide font-sans">Categories<\/h4>/i, 'tracking-wide font-sans">Categories</h3>');
layout = layout.replace(/tracking-wide font-sans">Contact Info<\/h4>/i, 'tracking-wide font-sans">Contact Info</h3>');

// Replace cart item h4 -> h3
layout = layout.replace(/<h4 class="text-sm font-semibold text-slate-800/g, '<h3 class="text-sm font-semibold text-slate-800');
layout = layout.replace(/x-text="item.name"><\/h4>/g, 'x-text="item.name"></h3>');

// Replace modal h4 -> h3
layout = layout.replace(/<h4 class="font-bold text-slate-500/g, '<h3 class="font-bold text-slate-500');
layout = layout.replace(/Customer Details<\/h4>/i, 'Customer Details</h3>');
layout = layout.replace(/Order Details<\/h4>/i, 'Order Details</h3>');

// Add aria-label to logo link
layout = layout.replace(/<a href="{{HOME_URL}}" class="flex items-center gap-2">/g, '<a href="{{HOME_URL}}" aria-label="Home page" class="flex items-center gap-2">');

fs.writeFileSync('templates/layout.html', layout);

let product = fs.readFileSync('templates/product.html', 'utf8');
product = product.replace(/<h4 class="text-xs font-bold text-brand-600 uppercase tracking-wider font-sans">Product Features<\/h4>/i, '<h2 class="text-xs font-bold text-brand-600 uppercase tracking-wider font-sans">Product Features</h2>');
fs.writeFileSync('templates/product.html', product);

let shop = fs.readFileSync('templates/shop.html', 'utf8');
shop = shop.replace(/<button class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-brand-500 hover:bg-brand-50 transition-colors" :disabled="currentPage === 1" @click="currentPage--">/, '<button aria-label="Previous page" class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-brand-500 hover:bg-brand-50 transition-colors" :disabled="currentPage === 1" @click="currentPage--">');
shop = shop.replace(/<button class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-brand-500 hover:bg-brand-50 transition-colors" :disabled="currentPage === totalPages" @click="currentPage\+\+">/, '<button aria-label="Next page" class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-brand-500 hover:bg-brand-50 transition-colors" :disabled="currentPage === totalPages" @click="currentPage++">');
fs.writeFileSync('templates/shop.html', shop);

console.log("Fixed headings and links");
