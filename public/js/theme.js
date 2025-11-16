(function() {
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
    }
    
    localStorage.setItem('theme', savedTheme);
    
    window.toggleTheme = function() {
        const html = document.documentElement;
        const isDark = html.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };
})();
