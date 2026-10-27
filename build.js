const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'posts');
const TPL_DIR = path.join(ROOT, 'templates');
const STATIC_DIR = path.join(ROOT, 'static');
const DIST = path.join(ROOT, 'dist');
const BASE = ''; 

const read = (p) => fs.readFileSync(p, 'utf8');
const layout = read(path.join(TPL_DIR, 'layout.html'));
const tplHome = read(path.join(TPL_DIR, 'home.html'));
const tplPost = read(path.join(TPL_DIR, 'posts.html')); 
const tplArchive = read(path.join(TPL_DIR, 'archive.html'));

const render = (tpl, data) =>
  tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => data[k] ?? '');

const escapeHTML = (str) => {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
  );
};

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

const FIXED_CATS = ['随笔', '生活', '编程', '其他'];

const posts = fs.readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const raw = read(path.join(POSTS_DIR, f));
    const { data, content } = matter(raw);
    const slug = f.replace(/\.md$/, '');
    
    const plainText = content.replace(/[#*`>_\-\[\]()]/g, ' ');
    const zhCount = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
    const enCount = (plainText.match(/[a-zA-Z0-9]+/g) || []).length;
    const wordCount = zhCount + enCount;
    const readTime = Math.ceil(wordCount / 400);
    
    let dateStr = '';
    if (data.date) {
      const d = new Date(data.date);
      dateStr = isNaN(d) ? String(data.date) : d.toISOString().slice(0, 10);
    }

    let cat = '其他';
    if (data.tags && Array.isArray(data.tags)) {
      const found = data.tags.find(t => FIXED_CATS.includes(t));
      if (found) cat = found;
    }

    let safeHtml = marked(content);
    safeHtml = safeHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    return {
      slug,
      title: escapeHTML(data.title || slug),
      date: dateStr,
      tags: (data.tags || []).map(t => escapeHTML(t)),
      summary: escapeHTML(data.summary || ''),
      cat: escapeHTML(cat),
      wordCount,
      readTime,
      html: safeHtml,
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));

if (path.basename(DIST) !== 'dist') {
  console.error('⚠️ 警告：目标目录不是 dist，已停止清理！');
  process.exit(1);
}
fs.rmSync(DIST, { recursive: true, force: true });
ensureDir(DIST);
copyDir(STATIC_DIR, path.join(DIST, 'static'));
copyDir(path.join(ROOT, 'images'), path.join(DIST, 'images'));

// 3. 生成文章详情页
ensureDir(path.join(DIST, 'posts'));
for (let i = 0; i < posts.length; i++) {
  const p = posts[i];
  const prev = posts[i - 1];
  const next = posts[i + 1];
  
  let postNav = '<nav class="post-nav" aria-label="文章导航">';
  if (prev) {
    postNav += `
      <a href="${BASE}/posts/${prev.slug}.html" class="post-nav-item prev">
        <span class="post-nav-label"><i class="fa-solid fa-arrow-left"></i> 上一篇</span>
        <span class="post-nav-title">${prev.title}</span>
      </a>`;
  } else {
    postNav += `<div class="post-nav-item prev disabled"><span class="post-nav-label"><i class="fa-solid fa-arrow-left"></i> 上一篇</span><span class="post-nav-title">已是第一篇</span></div>`;
  }
  
  if (next) {
    postNav += `
      <a href="${BASE}/posts/${next.slug}.html" class="post-nav-item next">
        <span class="post-nav-label">下一篇 <i class="fa-solid fa-arrow-right"></i></span>
        <span class="post-nav-title">${next.title}</span>
      </a>`;
  } else {
    postNav += `<div class="post-nav-item next disabled"><span class="post-nav-label">下一篇 <i class="fa-solid fa-arrow-right"></i></span><span class="post-nav-title">已是最后一篇</span></div>`;
  }
  postNav += '</nav>';

  const body = render(tplPost, {
    title: p.title, 
    date: p.date, 
    wordCount: p.wordCount, 
    readTime: p.readTime,
    tags: p.tags.map((t) => `<a href="#" class="tag"><i class="fa-solid fa-hashtag"></i> ${t}</a>`).join(' '),
    content: p.html,
    post_nav: postNav
  });
  const page = render(layout, { title: `${p.title} - Cobaltum60's Blog`, content: body });
  fs.writeFileSync(path.join(DIST, 'posts', `${p.slug}.html`), page);
}

// 4. 生成文章列表页
const listHtml = posts.map((p) => {
  const dateStr = p.date ? p.date.replace(/-/g, ' / ') : '';
  return `
  <article class="list-item"
           data-title="${p.title}"
           data-summary="${p.summary}"
           data-category="${p.cat}"
           data-keywords="${p.tags.join(' ')} ${p.title}"
           data-date="${p.date}">
    <h2 class="list-title"><a href="${BASE}/posts/${p.slug}.html">${p.title}</a></h2>
    <p class="list-summary">${p.summary}</p>
    <div class="list-footer">
      <div class="list-meta">
        <span class="list-category">${p.cat}</span>
        <span><i class="fa-regular fa-calendar"></i>${dateStr}</span>
        <span><i class="fa-regular fa-clock"></i>${p.readTime} min</span>
        <span><i class="fa-solid fa-pen-nib"></i>${p.wordCount} 字</span>
      </div>
      <a href="${BASE}/posts/${p.slug}.html" class="read-more">阅读全文 <i class="fa-solid fa-arrow-right"></i></a>
    </div>
  </article>`;
}).join('\n');

const postsScript = `
<script>
(function () {
  const FIXED = [
    { key: '全部', icon: 'fa-layer-group' },
    { key: '随笔', icon: 'fa-feather' },
    { key: '生活', icon: 'fa-mug-hot' },
    { key: '编程', icon: 'fa-code' },
    { key: '其他', icon: 'fa-ellipsis' }
  ];
  const ALL = '全部';
  const listEl = document.getElementById('article-list');
  if (!listEl) return; 

  const items = Array.from(listEl.querySelectorAll('.list-item')).map(el => ({
    el, title: el.dataset.title || '', summary: el.dataset.summary || '', category: el.dataset.category || '其他', keywords: el.dataset.keywords || '', date: el.dataset.date || ''
  }));
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');
  const navEl = document.getElementById('cat-nav');
  const emptyEl = document.getElementById('empty-state');
  const infoEl = document.getElementById('result-info');
  const resetLink = document.getElementById('reset-link');
  const sortSelect = document.getElementById('sort-select');
  const suggestEl = document.getElementById('search-suggest');
  let activeCategory = ALL, keyword = '', sortMode = 'date-desc', suggestIndex = -1;

  function counts() {
    const map = { [ALL]: items.length };
    FIXED.forEach(c => { if (c.key !== ALL) map[c.key] = 0; });
    items.forEach(it => { map[it.category] = (map[it.category] || 0) + 1; });
    return map;
  }
  function renderNav() {
    const c = counts();
    navEl.innerHTML = FIXED.map(cat => {
      const count = c[cat.key] || 0;
      const disabled = cat.key !== ALL && count === 0;
      return \`<li><button class="\${cat.key === activeCategory ? 'active' : ''}\${disabled ? ' disabled' : ''}" data-category="\${cat.key}" \${disabled ? 'disabled' : ''}><span><i class="fa-solid \${cat.icon}"></i>\${cat.key}</span><span class="cat-count">\${count}</span></button></li>\`;
    }).join('');
  }
  function tokenize(str) { return str.toLowerCase().replace(/[，。！？、；：""''（）【】《》,.!?;:()\\[\\]<>]/g, ' ').split(/\\s+/).filter(Boolean); }
  function fuzzyMatch(word, text) {
    if (word.length < 3) return false;
    const wl = word.length;
    for (let i = 0; i <= text.length - wl; i++) {
      const sub = text.slice(i, i + wl);
      if (sub === word) return true;
      let diff = 0;
      for (let k = 0; k < wl && diff <= 1; k++) if (sub[k] !== word[k]) diff++;
      if (diff <= 1) return true;
    }
    return false;
  }
  function scoreItem(item, tokens) {
    if (tokens.length === 0) return 1;
    const tL = item.title.toLowerCase(), sL = item.summary.toLowerCase(), cL = item.category.toLowerCase(), kL = item.keywords.toLowerCase();
    let total = 0;
    for (const token of tokens) {
      let s = 0;
      if (tL.includes(token)) s += 100; else if (fuzzyMatch(token, tL)) s += 50;
      if (cL === token || cL.includes(token)) s += 60;
      if (kL.includes(token)) s += 40; else if (fuzzyMatch(token, kL)) s += 20;
      if (sL.includes(token)) s += 20; else if (fuzzyMatch(token, sL)) s += 10;
      if (s === 0) return 0;
      total += s;
    }
    return total;
  }
  function escapeHTML(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  function highlight(text, tokens) {
    if (tokens.length === 0) return escapeHTML(text);
    let r = escapeHTML(text);
    const sorted = [...tokens].sort((a, b) => b.length - a.length);
    for (const t of sorted) {
      const safe = t.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
      r = r.replace(new RegExp(\`(\${safe})\`, 'gi'), '<mark class="hl">$1</mark>');
    }
    return r;
  }
  function sortItems(arr) {
    const sorted = [...arr];
    sorted.sort((a, b) => {
      if (sortMode === 'title') return a.title.localeCompare(b.title, 'zh');
      if (sortMode === 'date-asc') return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date);
    });
    return sorted;
  }
  function applyFilter() {
    const tokens = tokenize(keyword);
    const results = [];
    items.forEach(item => {
      const catOK = activeCategory === ALL || item.category === activeCategory;
      if (!catOK) { item.el.classList.add('hidden'); return; }
      const score = scoreItem(item, tokens);
      if (score > 0) { results.push({ item, score }); item.el.classList.remove('hidden'); } 
      else { item.el.classList.add('hidden'); }
    });
    if (tokens.length > 0) {
      results.sort((a, b) => b.score - a.score);
      results.forEach(({ item }) => listEl.appendChild(item.el));
    } else {
      const ordered = sortItems(items);
      ordered.forEach(item => listEl.appendChild(item.el));
    }
    items.forEach(item => {
      const t = item.el.querySelector('.list-title a');
      const s = item.el.querySelector('.list-summary');
      t.innerHTML = highlight(item.title, tokens);
      s.innerHTML = highlight(item.summary, tokens);
    });
    const visible = results.length;
    const totalToShow = tokens.length > 0 ? visible : items.filter(it => activeCategory === ALL || it.category === activeCategory).length;
    
    emptyEl.classList.toggle('visible', totalToShow === 0);
    resetLink.style.display = (activeCategory !== ALL || tokens.length) ? 'inline-flex' : 'none';
    let html = \`<span>共 \${totalToShow} 篇文章</span>\`;
    if (activeCategory !== ALL) html += \`<span class="result-chip">\${activeCategory}</span>\`;
    if (tokens.length) html += \`<span class="result-chip"><i class="fa-solid fa-magnifying-glass" style="font-size:.65rem"></i>\${keyword.trim()}</span>\`;
    infoEl.innerHTML = html;
    clearBtn.classList.toggle('visible', keyword.length > 0);
  }
  function renderSuggest() {
    const kw = keyword.trim().toLowerCase();
    if (!kw) { suggestEl.classList.remove('visible'); suggestEl.innerHTML = ''; suggestIndex = -1; return; }
    const tokens = tokenize(keyword);
    const candidates = items.map(it => ({ it, score: scoreItem(it, tokens) })).filter(x => x.score > 0 && x.it.title.toLowerCase().includes(tokens[0])).sort((a, b) => b.score - a.score).slice(0, 5);
    if (candidates.length === 0) { suggestEl.innerHTML = \`<div class="suggest-item" style="justify-content:center;color:var(--text-muted);cursor:default;">没有匹配的文章</div>\`; suggestEl.classList.add('visible'); suggestIndex = -1; return; }
    suggestEl.innerHTML = candidates.map(({ it }) => \`<div class="suggest-item" data-index="\${items.indexOf(it)}" role="option"><i class="fa-solid fa-file-lines"></i><span class="suggest-text">\${highlight(it.title, tokens)}</span><span class="suggest-cat">\${it.category}</span></div>\`).join('');
    suggestEl.classList.add('visible');
    suggestIndex = -1;
  }
  function hideSuggest() { suggestEl.classList.remove('visible'); suggestIndex = -1; }
  function resetAll() { keyword = ''; input.value = ''; activeCategory = ALL; hideSuggest(); renderNav(); applyFilter(); }
  
  navEl.addEventListener('click', e => {
    const btn = e.target.closest('button[data-category]');
    if (!btn || btn.disabled) return;
    activeCategory = btn.dataset.category;
    renderNav(); applyFilter();
  });
  let timer;
  input.addEventListener('input', e => {
    keyword = e.target.value;
    clearTimeout(timer);
    timer = setTimeout(() => { applyFilter(); renderSuggest(); }, 120);
  });
  input.addEventListener('focus', () => { if (keyword.trim()) renderSuggest(); });
  input.addEventListener('keydown', e => {
    const suggestItems = suggestEl.querySelectorAll('.suggest-item[data-index]');
    if (!suggestEl.classList.contains('visible') || suggestItems.length === 0) {
      if (e.key === 'Escape') { keyword = ''; input.value = ''; applyFilter(); hideSuggest(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); suggestIndex = (suggestIndex + 1) % suggestItems.length; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); suggestIndex = (suggestIndex - 1 + suggestItems.length) % suggestItems.length; }
    else if (e.key === 'Enter') { if (suggestIndex >= 0) { e.preventDefault(); suggestItems[suggestIndex].click(); return; } }
    else if (e.key === 'Escape') { hideSuggest(); return; }
    else return;
    suggestItems.forEach((el, i) => el.classList.toggle('active', i === suggestIndex));
    if (suggestIndex >= 0) suggestItems[suggestIndex].scrollIntoView({ block: 'nearest' });
  });
  suggestEl.addEventListener('click', e => {
    const item = e.target.closest('.suggest-item[data-index]');
    if (!item) return;
    const idx = parseInt(item.dataset.index, 10);
    const target = items[idx];
    if (target) window.location.href = target.el.querySelector('.list-title a').href;
  });
  clearBtn.addEventListener('click', () => { keyword = ''; input.value = ''; hideSuggest(); input.focus(); applyFilter(); });
  sortSelect.addEventListener('change', e => { sortMode = e.target.value; applyFilter(); });
  resetLink.addEventListener('click', resetAll);
  document.getElementById('empty-reset').addEventListener('click', resetAll);
  document.addEventListener('click', e => { if (!e.target.closest('.search-bar')) hideSuggest(); });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); input.select(); }
    else if (e.key === '/' && document.activeElement !== input && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); input.focus(); }
  });
  renderNav(); applyFilter();
})();
</script>
`;

const postsListBody = `
  <div class="layout">
    <aside class="sidebar">
      <div class="side-block">
        <div class="side-block-body">
          <div class="author-mini">
            <div class="author-avatar">C</div>
            <div class="author-info">
              <div class="author-name">Cobaltum60</div>
              <div class="author-bio">记录代码与生活</div>
            </div>
          </div>
        </div>
      </div>
      <div class="side-block">
        <div class="side-block-head"><i class="fa-solid fa-folder"></i>分类</div>
        <div class="side-block-body" style="padding: 8px;">
          <ul class="cat-nav" id="cat-nav"></ul>
        </div>
      </div>
      <div class="side-block">
        <div class="side-block-head"><i class="fa-solid fa-quote-left"></i>一言</div>
        <div class="side-block-body quote-block">
          <div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>
          <blockquote class="quote-text">
            程序是写给人读的，只是偶尔让计算机执行一下。
          </blockquote>
          <div class="quote-author">Donald Knuth</div>
        </div>
      </div>
    </aside>

    <div class="content">
      <div class="content-top">
        <div class="page-header">
          <div>
            <h1>Posts</h1>
            <p>保持记录 · 持续输出</p>
          </div>
          <select class="sort-select" id="sort-select" aria-label="排序方式">
            <option value="date-desc">最新优先</option>
            <option value="date-asc">最早优先</option>
            <option value="title">标题排序</option>
          </select>
        </div>

        <div class="search-bar">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input type="text" id="search-input" placeholder="搜索文章…（空格分隔多关键词）" autocomplete="off" aria-label="搜索文章" aria-autocomplete="list" aria-controls="search-suggest">
          <span class="search-kbd">Ctrl K</span>
          <button class="search-clear" id="search-clear" aria-label="清除搜索">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div class="search-suggest" id="search-suggest" role="listbox"></div>
        </div>
      </div>

      <div class="result-bar">
        <div id="result-info"><span>共 ${posts.length} 篇文章</span></div>
        <button class="reset-link" id="reset-link" style="display:none;">
          <i class="fa-solid fa-xmark"></i> 清除筛选
        </button>
      </div>

      <div class="article-list" id="article-list">
        ${listHtml}
      </div>

      <div class="empty-state" id="empty-state">
        <i class="fa-regular fa-face-frown"></i>
        <h3>没有找到匹配的文章</h3>
        <p>试试其他关键词，或切换到其他分类</p>
        <button id="empty-reset">清除所有筛选</button>
      </div>
    </div>
  </div>
  ${postsScript}
`;

fs.writeFileSync(
  path.join(DIST, 'posts', 'index.html'),
  render(layout, { title: 'Posts - Cobaltum60\'s Blog', content: postsListBody })
);

// 5. 生成首页
const homeBody = render(tplHome, { count: posts.length });
fs.writeFileSync(path.join(DIST, 'index.html'), render(layout, { title: 'Home - Cobaltum60\'s Blog', content: homeBody }));

// 6. 生成 RSS
const site = 'https://blog.cosixzero.com';
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Cobaltum60's Blog</title><link>${site}</link><description>记录技术与生活</description>
${posts.map((p) => `<item><title>${p.title}</title><link>${site}/posts/${p.slug}.html</link><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${p.summary}</description></item>`).join('')}
</channel></rss>`;
fs.writeFileSync(path.join(DIST, 'feed.xml'), rss);

console.log(`构建完成，共 ${posts.length} 篇文章 → dist/`);