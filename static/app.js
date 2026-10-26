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