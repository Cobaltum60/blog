const KEY = 'theme';
const saved = localStorage.getItem(KEY);
const toggleBtn = document.getElementById('theme-toggle');
const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

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

if (saved) { setTheme(saved); } else { setTheme('dark'); }

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(cur);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.hljs) hljs.highlightAll();

  // 语言名称映射字典
  const langMap = {
    'c': 'C',
    'cpp': 'C++',
    'cs': 'C#',
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'py': 'Python',
    'python': 'Python',
    'html': 'HTML',
    'css': 'CSS',
    'json': 'JSON',
    'bash': 'Bash',
    'shell': 'Shell',
    'sh': 'Shell',
    'sql': 'SQL',
    'md': 'Markdown',
    'markdown': 'Markdown',
    'text': 'Text',
    'plaintext': 'Text'
  };

  // 代码复制按钮 & 语言标识渲染
  document.querySelectorAll('.post-detail-content pre').forEach(pre => {
    const code = pre.querySelector('code');
    
    // 提取语言类名并映射为大写标准名
    if (code && code.className) {
      const match = code.className.match(/language-(\w+)/);
      if (match && match[1]) {
        const rawLang = match[1].toLowerCase();
        // 如果字典里有就取字典的，没有就原样大写
        const displayLang = langMap[rawLang] || rawLang.toUpperCase();
        pre.setAttribute('data-lang', displayLang);
      }
    }

    const btn = document.createElement('button');
    btn.className = 'copy-code-btn';
    btn.innerHTML = '<i class="fa-regular fa-copy"></i> 复制';
    btn.addEventListener('click', async () => {
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

  // TOC 与进度条
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

  // Giscus
  const container = document.getElementById('giscus-container');
  if (container) {
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'Cobaltum60/blog');
    script.setAttribute('data-repo-id', 'R_kgDOVW3agQ');
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOVW3agc4DJoYs');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    script.setAttribute('data-lang', 'zh-CN');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    container.appendChild(script);
  }
});