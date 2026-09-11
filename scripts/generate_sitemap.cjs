const fs = require('fs');
const path = require('path');

// Read tools and guides from source
const toolsContent = fs.readFileSync(path.join(__dirname, '../src/data/tools.ts'), 'utf8');
const guidesContent = fs.readFileSync(path.join(__dirname, '../src/data/guides.ts'), 'utf8');

// Extract slugs
const toolSlugs = [];
const toolMatches = toolsContent.matchAll(/slug:\s*['"]([^'"]+)['"]/g);
for (const match of toolMatches) {
  if (!toolSlugs.includes(match[1])) {
    toolSlugs.push(match[1]);
  }
}

const guideSlugs = [];
const guideMatches = guidesContent.matchAll(/"?slug"?:\s*['"]([^'"]+)['"]/g);
for (const match of guideMatches) {
  if (!guideSlugs.includes(match[1])) {
    guideSlugs.push(match[1]);
  }
}

const categories = ['pdf', 'images', 'documents', 'text', 'qr', 'files', 'productivity', 'students', 'business', 'developer'];

const domain = 'https://toolboxword.com';
const today = '2026-09-10';

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Home -->
  <url>
    <loc>${domain}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Guides Hub -->
  <url>
    <loc>${domain}/#/guides</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;

// Categories
xml += `  <!-- Categories -->\n`;
for (const cat of categories) {
  xml += `  <url>
    <loc>${domain}/#/category/${cat}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
}

// Flagship Tools
xml += `  <!-- Flagship Tools -->
  <url>
    <loc>${domain}/#/tool/pdf-to-word</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/#/tool/citation-generator</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>\n`;

// Other Tools
xml += `  <!-- Tools Catalog -->\n`;
for (const slug of toolSlugs) {
  if (slug !== 'pdf-to-word' && slug !== 'citation-generator') {
    xml += `  <url>
    <loc>${domain}/#/tool/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
  }
}

// Guides
xml += `  <!-- Guides & Tutorials (100+) -->\n`;
for (const slug of guideSlugs) {
  xml += `  <url>
    <loc>${domain}/#/guide/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
}

// Legal & Info Pages
const legalPages = ['privacy', 'terms', 'cookies', 'about', 'contact', 'disclaimer'];
xml += `  <!-- Legal & Info Pages -->\n`;
for (const page of legalPages) {
  xml += `  <url>
    <loc>${domain}/#/${page}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>\n`;
}

xml += `</urlset>\n`;

fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), xml, 'utf8');
console.log(`Generated sitemap.xml with ${toolSlugs.length} tools and ${guideSlugs.length} guides.`);
