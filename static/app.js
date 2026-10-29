const KEY = 'theme';
const saved = localStorage.getItem(KEY);
const toggleBtn = document.getElementById('theme-toggle');
const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

// ===== 主题切换 =====
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    if (icon) icon.className = 'fa-solid fa-sun';
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    if (icon) icon.className = 'fa-solid fa-moon';
  }
  
  // 动态切换 VS Code 高亮主题
  const hljsTheme = document.getElementById('hljs-theme');
  if (hljsTheme) {
    hljsTheme.href = theme === 'dark' 
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css' 
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs.min.css';
  }

  // 通知 Giscus 评论区
  const giscusFrame = document.querySelector('iframe.giscus-frame');
  if (giscusFrame) {
    giscusFrame.contentWindow.postMessage(
      { giscus: { setConfig: { theme: theme === 'dark' ? 'dark' : 'light' } } },
      'https://giscus.app'
    );
  }
}

// 初始化主题（默认深色）
if (saved) { 
  setTheme(saved); 
} else { 
  setTheme('dark'); 
}

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

  // 2. 代码块头部（红绿灯+底线）与复制按钮
  document.querySelectorAll('.post-detail-content pre').forEach(pre => {
    // 插入头部线框
    const header = document.createElement('div');
    header.className = 'code-header';
    header.setAttribute('data-lang', pre.getAttribute('data-lang') || 'text'); // 将原本 pre 上的语言标识转到 header
    pre.insertBefore(header, pre.firstChild);

    // 插入复制按钮
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

  // 3. TOC 目录 + 进度条
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

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'toc-link level-' + h.tagName[1];
        a.href = '#' + id;
        a.textContent = h.textContent.trim();
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
          // 进度条只计算正文部分，不包含评论区
          const targetHeight = content.offsetTop + content.offsetHeight;
          const docHeight = targetHeight - window.innerHeight;
          
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

  // 4. Giscus 直接加载（输入框置顶）
  const container = document.getElementById('giscus-container');
  if (container) {
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'Cobaltum60/blog');
    script.setAttribute('data-repo-id', 'R_kgDOVW3agQ'); // 你的真实 ID
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOVW3agc4DJoYs'); // 你的真实 ID
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top'); // 输入框置顶
    script.setAttribute('data-theme', document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    script.setAttribute('data-lang', 'zh-CN');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    container.appendChild(script);
  }
});