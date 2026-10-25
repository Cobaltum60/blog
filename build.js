const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'posts');
const TPL_DIR = path.join(ROOT, 'templates');
const STATIC_DIR = path.join(ROOT, 'static');
const DIST = path.join(ROOT, 'dist');
const BASE = '/blog';

const read = (p) => fs.readFileSync(p, 'utf8');
const layout = read(path.join(TPL_DIR, 'layout.html'));
const tplPost = read(path.join(TPL_DIR, 'post.html'));
const tplArchive = read(path.join(TPL_DIR, 'archive.html'));

const render = (tpl, data) =>
  tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => data[k] ?? '');

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
function copyDir(src, dest) {
  ensureDir(dest);
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f);
    const d = path.join(dest, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// 1. 读取所有文章
const posts = fs.readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const raw = read(path.join(POSTS_DIR, f));
    const { data, content } = matter(raw);
    const slug = f.replace(/\.md$/, '');
    // 估算阅读时间
    const wordCount = content.replace(/[\u4e00-\u9fa5]/g, 'aa').length;
    const readTime = Math.ceil(wordCount / 400);
    
    return {
      slug,
      title: data.title || slug,
      date: data.date ? String(data.date).slice(0, 10) : '',
      tags: data.tags || [],
      summary: data.summary || '',
      readTime,
      html: marked(content),
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));

// 2. 清空并重建 dist
fs.rmSync(DIST, { recursive: true, force: true });
ensureDir(DIST);
copyDir(STATIC_DIR, path.join(DIST, 'static'));

// 3. 生成文章详情页
ensureDir(path.join(DIST, 'posts'));
for (const p of posts) {
  const body = render(tplPost, {
    title: p.title,
    date: p.date,
    readTime: p.readTime,
    tags: p.tags.map((t) => `<span class="tag">#${t}</span>`).join(' '),
    content: p.html,
  });
  const page = render(layout, { title: `${p.title} · Cobaltum60`, content: body });
  fs.writeFileSync(path.join(DIST, 'posts', `${p.slug}.html`), page);
}

// 4. 生成首页（硬核名片区 + 网格列表）
const listHtml = posts.map((p) => {
  const dateStr = p.date ? p.date.replace(/-/g, ' / ') : '';
  const tagsHtml = p.tags.length > 0 
    ? `<div class="post-tags">${p.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>` 
    : '';
  
  return `
  <article class="post-card">
    <div class="post-card-header">
      <span class="post-meta">${dateStr}</span>
      <span class="post-read-time">☕ ${p.readTime} min</span>
    </div>
    <h2 class="post-title"><a href="${BASE}/posts/${p.slug}.html">${p.title}</a></h2>
    <p class="post-summary">${p.summary}</p>
    <div class="post-card-footer">
      ${tagsHtml}
      <a href="${BASE}/posts/${p.slug}.html" class="read-more">Read &rarr;</a>
    </div>
  </article>`;
}).join('\n');

const indexBody = `
  <section class="hero">
    <div class="hero-content">
      <h1>Cobaltum60</h1>
      <p>记录技术、生活与思考。不追求华丽的装饰，只保留最纯粹的极简与直角。</p>
      <div class="hero-socials">
        <a href="https://github.com/Cobaltum60" target="_blank">GitHub</a>
        <a href="${BASE}/feed.xml">RSS 订阅</a>
      </div>
    </div>
  </section>

  <div class="section-title">
    <h2>LATEST POSTS</h2>
    <div class="line"></div>
  </div>

  <section class="post-grid">
    ${listHtml}
  </section>
`;
fs.writeFileSync(
  path.join(DIST, 'index.html'),
  render(layout, { title: 'Cobaltum60', content: indexBody })
);

// 5. 生成归档页
const byYear = {};
for (const p of posts) {
  const y = p.date ? new Date(p.date).getFullYear() : '未知';
  (byYear[y] = byYear[y] || []).push(p);
}
const archiveHtml = Object.keys(byYear).sort().reverse().map((y) => `
  <div class="archive-year">
    <h2>${y}</h2>
    <ul class="archive-list">${byYear[y].map((p) =>
      `<li><span class="archive-date">${p.date}</span> <a href="${BASE}/posts/${p.slug}.html">${p.title}</a></li>`
    ).join('')}</ul>
  </div>`).join('\n');
fs.writeFileSync(
  path.join(DIST, 'archive.html'),
  render(layout, {
    title: '归档 · Cobaltum60',
    content: render(tplArchive, { archive: archiveHtml }),
  })
);

// 6. 生成 RSS
const site = 'https://Cobaltum60.github.io/blog';
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Cobaltum60 Blog</title><link>${site}</link><description>记录技术与生活</description>
${posts.map((p) => `<item>
  <title>${p.title}</title>
  <link>${site}/posts/${p.slug}.html</link>
  <pubDate>${new Date(p.date).toUTCString()}</pubDate>
  <description>${p.summary}</description>
</item>`).join('')}
</channel></rss>`;
fs.writeFileSync(path.join(DIST, 'feed.xml'), rss);

console.log(`构建完成，共 ${posts.length} 篇文章 → dist/`);