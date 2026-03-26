#!/usr/bin/env node
/**
 * Blog build script
 * Run: node build.js
 *
 * Scans the /posts directory for HTML files named YYYY-MM-DD-slug.html,
 * reads the <title> and optional <meta name="excerpt"> from each,
 * then regenerates index.html sorted newest-first.
 */

const fs   = require('fs');
const path = require('path');

const POSTS_DIR  = path.join(__dirname, 'posts');
const INDEX_FILE = path.join(__dirname, 'index.html');
const COMPANY    = 'Guidance Labs';  // ← change this to your company name

// ── helpers ──────────────────────────────────────────────────────────────────

function extractTag(html, tag) {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : null;
}

function extractMeta(html, name) {
  const m = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
           || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'));
  return m ? m[1].trim() : null;
}

function formatDate(dateStr) {
  // dateStr: "YYYY-MM-DD"
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── scan posts ────────────────────────────────────────────────────────────────

const files = fs.readdirSync(POSTS_DIR)
  .filter(f => /^\d{4}-\d{2}-\d{2}-.+\.html$/.test(f))
  .sort()          // lexicographic = chronological for YYYY-MM-DD prefix
  .reverse();      // newest first

if (files.length === 0) {
  console.log('No posts found in /posts. Add files named YYYY-MM-DD-slug.html');
  process.exit(0);
}

const posts = files.map(filename => {
  const html    = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8');
  const dateStr = filename.slice(0, 10);
  const title   = extractTag(html, 'title') || filename;
  const excerpt = extractMeta(html, 'excerpt') || '';
  return { filename, dateStr, title, excerpt };
});

// ── build index.html ──────────────────────────────────────────────────────────

const listItems = posts.map(p => `
    <li>
      <div class="post-date">${formatDate(p.dateStr)}</div>
      <div class="post-title"><a href="posts/${p.filename}">${p.title}</a></div>
      ${p.excerpt ? `<div class="post-excerpt">${p.excerpt}</div>` : ''}
    </li>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${COMPANY} — Blog</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <a class="logo" href="index.html">${COMPANY}</a>
  </header>
  <main>
    <ul class="post-list">
${listItems}
    </ul>
  </main>
</body>
</html>
`;

fs.writeFileSync(INDEX_FILE, html, 'utf8');
console.log(`✓ index.html rebuilt — ${posts.length} post(s) listed.`);
