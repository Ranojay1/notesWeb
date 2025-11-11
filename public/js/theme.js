/**
 * Theme manager - Gestiona el tema oscuro/claro globalmente
 * Se carga antes que otros scripts para evitar cambios visuales
 */

(function() {
    // Obtener el tema guardado
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Aplicar tema inmediatamente
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
    }

    // Detectar preferencia del sistema si no hay tema guardado
    if (!localStorage.getItem('theme')) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.documentElement.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        }
    }
    
    // Función global para cambiar tema
    window.toggleTheme = function() {
        const htmlElement = document.documentElement;
        const isDarkMode = htmlElement.classList.contains('dark-mode');
        
        if (isDarkMode) {
            htmlElement.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        } else {
            htmlElement.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        }
    };
})();
