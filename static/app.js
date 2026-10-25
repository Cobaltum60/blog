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