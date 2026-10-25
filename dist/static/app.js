  
const KEY = 'theme';
const saved = localStorage.getItem(KEY);
if (saved) document.documentElement.dataset.theme = saved;

const toggleBtn = document.getElementById('theme-toggle');
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = cur;
    localStorage.setItem(KEY, cur);
  });
}