const KEY = 'theme';
const saved = localStorage.getItem(KEY);
const toggleBtn = document.getElementById('theme-toggle');
const icon = toggleBtn.querySelector('i');

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
  if (theme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
  
  // 动态切换 VS Code 高亮主题
  const hljsTheme = document.getElementById('hljs-theme');
  if (hljsTheme) {
    hljsTheme.href = theme === 'dark' 
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css' 
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs.min.css';
  }
}

if (saved) {
  setTheme(saved);
} else {
  setTheme('light');
}

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(cur);
  });
}

// ===== 代码高亮初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  if (window.hljs) {
    hljs.highlightAll();
  }
});

// ===== 代码块一键复制功能 =====
document.addEventListener('DOMContentLoaded', () => {
  // 找到文章内容里的所有 <pre> 代码块
  const preBlocks = document.querySelectorAll('.post-detail-content pre');

  preBlocks.forEach((pre) => {
    // 让 pre 作为定位基准，方便按钮绝对定位
    pre.style.position = 'relative';

    // 创建复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-code-btn';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
    
    // 将按钮插入到 pre 内部
    pre.appendChild(copyBtn);

    // 点击事件
    copyBtn.addEventListener('click', () => {
      // 获取代码文本（去掉按钮本身的文字）
      const code = pre.querySelector('code').innerText;
      
      // 写入剪贴板
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        // 2秒后恢复原状
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
        }, 2000);
      }).catch(err => {
        console.error('复制失败:', err);
        copyBtn.innerText = 'Error';
      });
    });
  });
});