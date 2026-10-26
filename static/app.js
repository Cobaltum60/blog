const KEY = 'theme';
const saved = localStorage.getItem(KEY);
const toggleBtn = document.getElementById('theme-toggle');
const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

// ===== 主题切换 =====
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
  if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  
  const hljsTheme = document.getElementById('hljs-theme');
  if (hljsTheme) {
    hljsTheme.href = theme === 'dark' 
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css' 
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs.min.css';
  }

  const giscusFrame = document.querySelector('iframe.giscus-frame');
  if (giscusFrame) {
    giscusFrame.contentWindow.postMessage(
      { giscus: { setConfig: { theme: theme === 'dark' ? 'dark' : 'light' } } },
      'https://giscus.app'
    );
  }
}

if (saved) { setTheme(saved); } else { setTheme('light'); }

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(cur);
  });
}

// ===== 页面交互功能 =====
document.addEventListener('DOMContentLoaded', () => {
  // 1. 代码高亮
  if (window.hljs) hljs.highlightAll();

  // 2. 代码复制按钮
  document.querySelectorAll('.post-detail-content pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'copy-code-btn';
    btn.innerHTML = '<i class="fa-regular fa-copy"></i> 复制';
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code');
      const text = code ? code.innerText : pre.innerText;
      try {
        await navigator.clipboard.writeText(text);
        btn.innerHTML = '<i class="fa-solid fa-check"></i> 已复制';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = '<i class="fa-regular fa-copy"></i> 复制';
          btn.classList.remove('copied');
        }, 1500);
      } catch { btn.textContent = '复制失败'; }
    });
    pre.appendChild(btn);
  });

  // 3. TOC 目录 + 进度条 + 锚点
  const content = document.getElementById('post-content');
  const tocList = document.getElementById('toc-list');
  if (content && tocList) {
    const headings = content.querySelectorAll('h2, h3');
    if (headings.length > 0) {
      const usedIds = new Set();
      headings.forEach((h, i) => {
        let id = h.id || 'heading-' + i;
        if (usedIds.has(id)) { id = id + '-' + i; }
        h.id = id;
        usedIds.add(id);

        const anchor = document.createElement('a');
        anchor.className = 'anchor';
        anchor.href = '#' + id;
        anchor.textContent = '#';
        h.appendChild(anchor);

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'toc-link level-' + h.tagName[1];
        a.href = '#' + id;
        a.textContent = h.textContent.replace('#', '').trim();
        li.appendChild(a);
        tocList.appendChild(li);
      });

      const tocLinks = Array.from(tocList.querySelectorAll('.toc-link'));
      const headingEls = Array.from(headings);
      const bar = document.getElementById('progress-bar');
      const backTop = document.getElementById('back-top');

      function updateScroll() {
        const scrollY = window.scrollY + 100;
        let activeIndex = -1;
        headingEls.forEach((h, i) => { if (h.offsetTop <= scrollY) activeIndex = i; });
        tocLinks.forEach((link, i) => link.classList.toggle('active', i === activeIndex));
        
        if (bar) {
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const percent = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
          bar.style.width = Math.min(100, percent) + '%';
        }
        if (backTop) backTop.classList.toggle('visible', window.scrollY > 400);
      }

      window.addEventListener('scroll', updateScroll, { passive: true });
      updateScroll();

      if (backTop) {
        backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      }
    }
  }

  // 4. Giscus 折叠懒加载（输入框置顶）
  const details = document.getElementById('giscus-details');
  const container = document.getElementById('giscus-container');
  if (details && container) {
    let giscusLoaded = false;
    const giscusConfig = {
      'data-repo': 'Cobaltum60/blog',
      'data-repo-id': 'R_kgDOVW3agQ', // 替换成你的真实 ID
      'data-category': 'General',
      'data-category-id': 'DIC_kwDOVW3agc4DJoYs', // 替换成你的真实 ID
      'data-mapping': 'pathname',
      'data-strict': '0',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'top', // 默认输入框在顶部
      'data-theme': document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
      'data-lang': 'zh-CN',
      'crossorigin': 'anonymous',
      'async': 'true'
    };

    function loadGiscus() {
      if (giscusLoaded) return;
      giscusLoaded = true;
      const script = document.createElement('script');
      script.src = 'https://giscus.app/client.js';
      Object.entries(giscusConfig).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });
      container.appendChild(script);
    }

    details.addEventListener('toggle', () => {
      if (details.open) loadGiscus();
    });

    // 监听主题变化，同步到 Giscus iframe
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      const iframe = document.querySelector('iframe.giscus-frame');
      if (iframe && details.open) {
        iframe.contentWindow.postMessage(
          { giscus: { setConfig: { theme } } },
          'https://giscus.app'
        );
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
});