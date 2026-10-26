const KEY = 'theme';
const saved = localStorage.getItem(KEY);
const toggleBtn = document.getElementById('theme-toggle');
const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

function setTheme(theme) {
  // 1. 切换网站本身的主题
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
  
  // 2. 切换图标
  if (icon) {
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  }
  
  // 3. 动态切换 VS Code 高亮主题
  const hljsTheme = document.getElementById('hljs-theme');
  if (hljsTheme) {
    hljsTheme.href = theme === 'dark' 
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css' 
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs.min.css';
  }

  // 4. 核心：通知 Giscus 评论区跟随切换
  const giscusFrame = document.querySelector('iframe.giscus-frame');
  if (giscusFrame) {
    giscusFrame.contentWindow.postMessage(
      { giscus: { setConfig: { theme: theme === 'dark' ? 'dark' : 'light' } } },
      'https://giscus.app'
    );
  }
}

// 初始化主题
if (saved) {
  setTheme(saved);
} else {
  setTheme('light');
}

// 绑定按钮点击事件
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(cur);
  });
}

// ===== 页面加载完成后运行 =====
document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化代码高亮
  if (window.hljs) {
    hljs.highlightAll();
  }

  // 2. 代码块一键复制功能
  const preBlocks = document.querySelectorAll('.post-detail-content pre');
  preBlocks.forEach((pre) => {
    pre.style.position = 'relative';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-code-btn';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
    pre.appendChild(copyBtn);

    copyBtn.addEventListener('click', () => {
      const code = pre.querySelector('code').innerText;
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
        }, 2000);
      }).catch(err => {
        console.error('复制失败:', err);
        copyBtn.innerText = 'Error';
      });
    });
  });

  // 3. 延迟通知 Giscus 初始化主题（防止 iframe 加载太慢）
  setTimeout(() => {
    const currentTheme = document.documentElement.dataset.theme;
    const giscusFrame = document.querySelector('iframe.giscus-frame');
    if (giscusFrame && currentTheme) {
      giscusFrame.contentWindow.postMessage(
        { giscus: { setConfig: { theme: currentTheme === 'dark' ? 'dark' : 'light' } } },
        'https://giscus.app'
      );
    }
  }, 1500);
});