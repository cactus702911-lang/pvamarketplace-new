const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'templates');
const buildSiteJS = path.join(__dirname, 'build_site.js');

function optimizeImgTags(content) {
    // This regex matches <img ...> 
    // and adds decoding="async" if not present
    // and loading="lazy" if it's not the hero image, not the logo, and doesn't already have fetchpriority="high" or loading="lazy"
    
    return content.replace(/<img\s([^>]+)>/gi, (match, attrs) => {
        let newAttrs = attrs;
        
        // Add decoding="async" if not present
        if (!/decoding=/i.test(newAttrs)) {
            newAttrs = `decoding="async" ` + newAttrs;
        }

        // Check if it's a critical image (hero, logo)
        const isCritical = /fetchpriority="high"/i.test(newAttrs) || /LOGO_IMAGE/i.test(newAttrs) || /hero-bg/i.test(newAttrs);

        // Add loading="lazy" if not critical and not present
        if (!isCritical && !/loading=/i.test(newAttrs)) {
            newAttrs = `loading="lazy" ` + newAttrs;
        }

        // Remove loading="lazy" if critical and present (just in case)
        if (isCritical && /loading="lazy"/i.test(newAttrs)) {
            newAttrs = newAttrs.replace(/loading="lazy"/gi, '').trim();
        }

        return `<img ${newAttrs}>`.replace(/\s+/g, ' ');
    });
}

// Process templates
if (fs.existsSync(templatesDir)) {
    const files = fs.readdirSync(templatesDir);
    for (const file of files) {
        if (file.endsWith('.html')) {
            const filePath = path.join(templatesDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            const optimized = optimizeImgTags(content);
            if (content !== optimized) {
                fs.writeFileSync(filePath, optimized, 'utf8');
                console.log(`Optimized ${file}`);
            }
        }
    }
}

// Process build_site.js
if (fs.existsSync(buildSiteJS)) {
    let content = fs.readFileSync(buildSiteJS, 'utf8');
    const optimized = optimizeImgTags(content);
    if (content !== optimized) {
        fs.writeFileSync(buildSiteJS, optimized, 'utf8');
        console.log(`Optimized build_site.js`);
    }
}
