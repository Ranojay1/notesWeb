/**
 * Header utility: Maneja el dropdown de perfil y la búsqueda integrada
 */

class HeaderManager {
    constructor(apiInstance) {
        this.apiInstance = apiInstance;
    }

    /**
     * Inicializa el header con perfil, búsqueda y dropdown
     * @param {Array} navItems - Items de navegación extra (ej: [{href: '/friends', label: '👥 Amigos'}])
     */
    async initialize(navItems = []) {
        // Obtener referencia al div RIGHT ahora que el DOM está listo
        this.rightDiv = document.querySelector('.header .right');
        
        if (!this.rightDiv) {
            console.error('No se encontró .header .right');
            return;
        }
        
        if (!this.apiInstance.isAuthenticated()) {
            this.renderUnauthenticated();
            return;
        }

        // Obtener foto de perfil
        let profilePicUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + this.apiInstance.user;
        try {
            const pic = await this.apiInstance.getProfilePic(this.apiInstance.user);
            if (pic && pic.url) {
                profilePicUrl = pic.url;
            }
        } catch (e) {
            console.log('Avatar Discord no disponible, usando DiceBear');
        }

        // Construir HTML del header
        let headerHTML = `
            <div class="header-search-wrapper">
                <div class="header-search">
                    <input type="text" id="globalSearch" placeholder="buscar..." autocomplete="off">
                </div>
                <div id="searchDropdown" class="search-dropdown" style="display: none;">
                    <div id="searchResults" class="search-results"></div>
                </div>
            </div>
        `;

        // Agregar items de navegación
        navItems.forEach(item => {
            headerHTML += `<a href="${item.href}"><span style="cursor: pointer; color: var(--secondary-color); font-weight: 600;">${item.label}</span></a>`;
        });

        // Agregar botón de tema oscuro
        headerHTML += `
            <button id="themToggleBtn" title="Cambiar tema" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 8px; border-radius: 50%; transition: all 0.3s ease; color: var(--text-primary);">
                🌙
            </button>
        `;

        // Agregar perfil con dropdown
        headerHTML += `
            <div class="profile-dropdown">
                <img id="headerProfilePic" class="profile-pic" 
                     src="${profilePicUrl}" alt="Perfil" title="Abrir menú">
                <div id="profileDropdown" class="profile-dropdown-menu">
                    <a href="/profile">👤 Mi perfil</a>
                    <button id="logoutBtn">🚪 Cerrar sesión</button>
                </div>
            </div>
        `;

        // Renderizar
        this.rightDiv.innerHTML = headerHTML;

        // Event listeners
        this.setupEventListeners(profilePicUrl);
    }

    setupEventListeners(profilePicUrl) {
        const profilePic = document.getElementById('headerProfilePic');
        const dropdown = document.getElementById('profileDropdown');
        const logoutBtn = document.getElementById('logoutBtn');
        const searchInput = document.getElementById('globalSearch');
        const searchDropdown = document.getElementById('searchDropdown');
        const searchResults = document.getElementById('searchResults');
        const themToggleBtn = document.getElementById('themToggleBtn');

        // Toggle dropdown
        profilePic.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        // Cerrar dropdown al clickear fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-dropdown')) {
                dropdown.classList.remove('active');
            }
            if (!e.target.closest('.header-search-wrapper')) {
                searchDropdown.style.display = 'none';
            }
        });

        // Logout
        logoutBtn.addEventListener('click', () => {
            this.apiInstance.logout();
        });

        // Tema oscuro - Toggle dark mode
        if (themToggleBtn) {
            themToggleBtn.addEventListener('click', () => {
                window.toggleTheme();
                const isDarkMode = document.documentElement.classList.contains('dark-mode');
                themToggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
            });

            // Restaurar tema guardado
            const savedTheme = localStorage.getItem('theme') || 'light';
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark-mode');
                themToggleBtn.textContent = '☀️';
            }
        }

        // Búsqueda integrada - dinámica mientras se escribe
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    this.performSearch(query);
                }, 300);
            } else if (query.length === 0) {
                this.clearSearch();
                searchDropdown.style.display = 'none';
            }
        });

        // También permitir buscar con Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                clearTimeout(searchTimeout);
                this.performSearch(e.target.value.trim());
            }
        });
    }

    /**
     * Realizar búsqueda integrada
     * Este método debe ser sobrescrito en cada página para implementar lógica específica
     */
    async performSearch(query) {
        try {
            const searchDropdown = document.getElementById('searchDropdown');
            const searchResults = document.getElementById('searchResults');
            
            if (!searchDropdown || !searchResults) {
                console.error('Missing dropdown or results container');
                return;
            }
            
            searchResults.innerHTML = '<div class="search-loading">Buscando...</div>';
            searchDropdown.style.display = 'block';
            
            console.log('Calling searchMixed API with query:', query);
            const data = await this.apiInstance.searchMixed(query);
            console.log('Search response:', data);
            
            if (!data || !data.results || data.results.length === 0) {
                searchResults.innerHTML = '<div class="search-empty">Sin resultados</div>';
                return;
            }
            
            const users = data.results.filter(r => r.type === 'user').slice(0, 3);
            const notes = data.results.filter(r => r.type === 'note').slice(0, 3);
            
            console.log('Filtered - Users:', users.length, 'Notes:', notes.length);
            
            let html = '';
            
            if (users.length > 0) {
                html += '<div class="search-group"><div class="search-group-title">👥 Usuarios</div>';
                html += users.map(user => `
                    <a href="/profile?user=${encodeURIComponent(user.username)}" class="search-item search-item-user">
                        <img class="search-avatar" 
                             data-username="${user.username}"
                             src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}" 
                             alt="${user.username}">
                        <div class="search-item-content">
                            <div class="search-item-text">@${user.username}</div>
                        </div>
                    </a>
                `).join('');
                html += '</div>';
            }
            
            if (notes.length > 0) {
                html += '<div class="search-group"><div class="search-group-title">📝 Notas</div>';
                html += notes.map(note => `
                    <a href="/note?id=${note.id}" class="search-item search-item-note">
                        <div class="search-note-icon">📝</div>
                        <div class="search-item-content">
                            <div class="search-item-text">${note.title || 'Sin título'}</div>
                            <div class="search-item-meta">✍️ por @${note.username}</div>
                        </div>
                    </a>
                `).join('');
                html += '</div>';
            }
            
            if (users.length > 0 || notes.length > 0) {
                html += `<a href="/search?q=${encodeURIComponent(query)}" class="search-item search-all">🔍 Ver todos los resultados</a>`;
            }
            
            console.log('Setting HTML in dropdown');
            searchResults.innerHTML = html;
            
            // Cargar avatares de Discord
            if (users.length > 0) {
                this.loadAvatarsForUsers(users);
            }
        } catch (err) {
            console.error('Search error:', err);
            const searchResults = document.getElementById('searchResults');
            if (searchResults) {
                searchResults.innerHTML = `<div class="search-empty">Error: ${err.message}</div>`;
            }
        }
    }

    /**
     * Cargar avatares de Discord para usuarios
     */
    async loadAvatarsForUsers(users) {
        for (const user of users) {
            try {
                const profilePic = await this.apiInstance.getProfilePic(user.username);
                if (profilePic?.url) {
                    const img = document.querySelector(`.search-avatar[data-username="${user.username}"]`);
                    if (img) {
                        img.src = profilePic.url;
                    }
                }
            } catch (err) {
                console.error(`Error loading avatar for ${user.username}:`, err);
            }
        }
    }

    /**
     * Limpiar búsqueda
     * Este método puede ser sobrescrito en cada página
     */
    clearSearch() {
        // Método base para limpiar resultados
        console.log('Búsqueda limpiada');
    }

    renderUnauthenticated() {
        const headerHTML = `
            <div class="header-search">
                <input type="text" placeholder="buscar..." disabled>
            </div>
            <a href="/login"><button class="btn btn-outline" style="padding: 8px 16px; font-size: 14px;">Ingresar</button></a>
            <a href="/register"><button class="btn btn-primary" style="padding: 8px 16px; font-size: 14px;">Registrarse</button></a>
        `;
        this.rightDiv.innerHTML = headerHTML;
    }
}

// Exportar para uso global
window.HeaderManager = HeaderManager;
