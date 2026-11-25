const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const POSTS_DIR = path.join(__dirname, 'posts');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DIST_DIR = path.join(__dirname, 'dist');
const STATIC_DIR = path.join(__dirname, 'static');

const layoutTpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'layout.html'), 'utf8');
const homeTpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'home.html'), 'utf8');
const postsTpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'posts.html'), 'utf8');

// 自定义 Markdown 渲染器（完全按你提供的 HTML 结构生成代码框，并赋予唯一 ID 防止复制冲突）
const renderer = new marked.Renderer();
renderer.code = function(code, lang) {
  const language = lang || 'text';
  const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const uniqueId = 'code-' + Math.random().toString(36).substr(2, 9);
  return `
  <div class="code-wrapper">
    <div class="code-toolbar">
      <div class="code-left">
        <div class="code-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <span class="code-lang">${language}</span>
      </div>
      <button class="copy-btn" data-target="${uniqueId}" aria-label="复制代码" title="复制">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="0" ry="0"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
    <pre><code id="${uniqueId}" class="language-${language}">${escapedCode}</code></pre>
  </div>`;
};

marked.setOptions({ renderer, headerIds: true, mangle: false });

if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR, { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'static'), { recursive: true });

['style.css', 'app.js'].forEach(file => {
  fs.copyFileSync(path.join(STATIC_DIR, file), path.join(DIST_DIR, 'static', file));
});

let posts = [];
const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

files.forEach(file => {
  const filePath = path.join(POSTS_DIR, file);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  const html = marked.parse(content);
  
  posts.push({
    slug: file.replace('.md', ''),
    title: data.title || '无标题',
    date: data.date || '2024-01-01',
    category: data.category || '未分类',
    excerpt: data.excerpt || content.slice(0, 100).replace(/[#\n\r]/g, '') + '...',
    content: html
  });
});

posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// 1. 生成文章详情页
posts.forEach(post => {
  const postHtml = postsTpl.replace('{{title}}', post.title)
                            .replace('{{date}}', post.date)
                            .replace('{{category}}', post.category)
                            .replace('{{content}}', post.content);
  const finalHtml = layoutTpl.replace('{{title}}', post.title).replace('{{content}}', postHtml);
  fs.writeFileSync(path.join(DIST_DIR, `${post.slug}.html`), finalHtml);
});

// 2. 生成首页
let postsListHtml = '';
posts.forEach((post, index) => {
  const displayStyle = index < 5 ? '' : 'style="display: none;"';
  postsListHtml += `
    <a href="/${post.slug}.html" class="post-card" data-category="${post.category}" ${displayStyle}>
      <div class="post-card-header">
        <div class="post-card-title">${post.title}</div>
        <span class="post-card-arrow">→</span>
      </div>
      <div class="post-card-meta">
        <span>${post.date}</span>
        <span class="chip">${post.category}</span>
      </div>
      <p class="post-card-excerpt">${post.excerpt}</p>
    </a>
  `;
});
const homeHtml = homeTpl.replace('{{postsList}}', postsListHtml);
const finalHome = layoutTpl.replace('{{title}}', 'Cobaltum\'s Blog').replace('{{content}}', homeHtml);
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), finalHome);

// 3. 生成归档页 (Archive)
let archiveHtml = '<div class="post-detail active"><h1 class="post-detail-title">归档</h1><div class="markdown-body" style="margin-top:2rem;">';
let currentYear = '';
posts.forEach(post => {
  const year = new Date(post.date).getFullYear();
  if (year !== currentYear) {
    if (currentYear !== '') archiveHtml += '</ul>';
    archiveHtml += `<h2 style="font-size:1.2rem; margin: 1.5rem 0 1rem;">${year}</h2><ul style="list-style:none; padding:0;">`;
    currentYear = year;
  }
  archiveHtml += `<li style="margin-bottom:0.75rem; display:flex; gap:1rem; align-items:baseline;">
    <span style="font-size:0.875rem; color:var(--md-sys-color-on-surface-variant);">${post.date.slice(5)}</span>
    <a href="/${post.slug}.html" style="font-size:0.95rem; text-decoration:none; color:var(--md-sys-color-primary);">${post.title}</a>
  </li>`;
});
if (currentYear !== '') archiveHtml += '</ul>';
archiveHtml += '</div></div>';
const finalArchive = layoutTpl.replace('{{title}}', '归档 - Cobaltum\'s Blog').replace('{{content}}', archiveHtml);
fs.writeFileSync(path.join(DIST_DIR, 'archive.html'), finalArchive);

console.log('✅ Build completed! Files generated in /dist');