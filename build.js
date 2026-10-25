const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'posts');
const TPL_DIR = path.join(ROOT, 'templates');
const STATIC_DIR = path.join(ROOT, 'static');
const DIST = path.join(ROOT, 'dist');
const BASE = '/blog'; // GitHub Pages 路径前缀

const read = (p) => fs.readFileSync(p, 'utf8');
const layout = read(path.join(TPL_DIR, 'layout.html'));
const tplPost = read(path.join(TPL_DIR, 'post.html'));
const tplArchive = read(path.join(TPL_DIR, 'archive.html'));

// 简单模板引擎
const render = (tpl, data) =>
  tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => data[k] ?? '');

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

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
    return {
      slug,
      title: data.title || slug,
      date: data.date ? String(data.date).slice(0, 10) : '',
      tags: data.tags || [],
      summary: data.summary || '',
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
    tags: p.tags.map((t) => `<span class="tag">${t}</span>`).join(' '),
    content: p.html,
  });
  const page = render(layout, { title: `${p.title} · 我的博客`, content: body });
  fs.writeFileSync(path.join(DIST, 'posts', `${p.slug}.html`), page);
}

// 4. 生成优化后的首页列表
const listHtml = posts.map((p) => {
  // 将 YYYY-MM-DD 转换为 2026 / 10 / 25 格式
  const dateStr = p.date ? p.date.replace(/-/g, ' / ') : '';
  return `
  <article class="post-item">
    <div class="post-meta">${dateStr}</div>
    <h2 class="post-title"><a href="${BASE}/posts/${p.slug}.html">${p.title}</a></h2>
    <p class="post-summary">${p.summary}</p>
  </article>`;
}).join('\n');

const indexBody = `
  <div class="site-intro">
    <h1>最近文章</h1>
    <p>记录技术与生活。</p>
  </div>
  <div class="post-list">
    ${listHtml}
  </div>
`;
fs.writeFileSync(
  path.join(DIST, 'index.html'),
  render(layout, { title: '我的博客', content: indexBody })
);

// 5. 生成归档页（修复了年份显示 Sun 的问题）
const byYear = {};
for (const p of posts) {
  // 使用 Date 对象提取正确的年份
  const y = p.date ? new Date(p.date).getFullYear() : '未知';
  (byYear[y] = byYear[y] || []).push(p);
}
const archiveHtml = Object.keys(byYear).sort().reverse().map((y) => `
  <h2>${y}</h2>
  <ul>${byYear[y].map((p) =>
    `<li>${p.date} · <a href="${BASE}/posts/${p.slug}.html">${p.title}</a></li>`
  ).join('')}</ul>`).join('\n');
fs.writeFileSync(
  path.join(DIST, 'archive.html'),
  render(layout, {
    title: '归档 · 我的博客',
    content: render(tplArchive, { archive: archiveHtml }),
  })
);

// 6. 生成 RSS
const site = 'https://Cobaltum60.github.io/blog';
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>我的博客</title><link>${site}</link><description>个人博客</description>
${posts.map((p) => `<item>
  <title>${p.title}</title>
  <link>${site}/posts/${p.slug}.html</link>
  <pubDate>${new Date(p.date).toUTCString()}</pubDate>
  <description>${p.summary}</description>
</item>`).join('')}
</channel></rss>`;
fs.writeFileSync(path.join(DIST, 'feed.xml'), rss);

console.log(`构建完成，共 ${posts.length} 篇文章 → dist/`);