class HeaderManager {
    constructor(apiInstance) {
        this.apiInstance = apiInstance;
    }

    async initialize(navItems = []) {
        this.rightDiv = document.querySelector('.header .right');
        
        if (!this.rightDiv) {
            console.error('No se encontró .header .right');
            return;
        }
        
        if (!this.apiInstance.isAuthenticated()) {
            this.renderUnauthenticated();
            return;
        }

        const profilePicUrl = await this.getProfilePicUrl();
        this.rightDiv.innerHTML = this.buildHeaderHTML(navItems, profilePicUrl);
        this.setupEventListeners(profilePicUrl);
    }

    async getProfilePicUrl() {
        try {
            const pic = await this.apiInstance.getProfilePic(this.apiInstance.user);
            return pic?.url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.apiInstance.user}`;
        } catch {
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.apiInstance.user}`;
        }
    }

    buildHeaderHTML(navItems, profilePicUrl) {
        const navHTML = navItems.map(item => 
            `<a href="${item.href}"><span style="cursor: pointer; color: var(--secondary-color); font-weight: 600;">${item.label}</span></a>`
        ).join('');

        return `
            <div class="header-search-wrapper">
                <div class="header-search">
                    <input type="text" id="globalSearch" placeholder="buscar..." autocomplete="off">
                </div>
                <div id="searchDropdown" class="search-dropdown" style="display: none;">
                    <div id="searchResults" class="search-results"></div>
                </div>
            </div>
            ${navHTML}
            <button id="themToggleBtn" title="Cambiar tema" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 8px; border-radius: 50%; transition: all 0.3s ease; color: var(--text-primary);">
                🌙
            </button>
            <div class="profile-dropdown">
                <img id="headerProfilePic" class="profile-pic" 
                     src="${profilePicUrl}" alt="Perfil" title="Abrir menú">
                <div id="profileDropdown" class="profile-dropdown-menu">
                    <a href="/profile">👤 Mi perfil</a>
                    <button id="logoutBtn">🚪 Cerrar sesión</button>
                </div>
            </div>
        `;
    }

    setupEventListeners(profilePicUrl) {
        const elements = {
            profilePic: document.getElementById('headerProfilePic'),
            dropdown: document.getElementById('profileDropdown'),
            logoutBtn: document.getElementById('logoutBtn'),
            searchInput: document.getElementById('globalSearch'),
            searchDropdown: document.getElementById('searchDropdown'),
            searchResults: document.getElementById('searchResults'),
            themToggleBtn: document.getElementById('themToggleBtn')
        };

        elements.profilePic?.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.dropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-dropdown')) {
                elements.dropdown?.classList.remove('active');
            }
            if (!e.target.closest('.header-search-wrapper')) {
                elements.searchDropdown.style.display = 'none';
            }
        });

        elements.logoutBtn?.addEventListener('click', () => this.apiInstance.logout());

        if (elements.themToggleBtn) {
            elements.themToggleBtn.addEventListener('click', () => {
                window.toggleTheme();
                const isDark = document.documentElement.classList.contains('dark-mode');
                elements.themToggleBtn.textContent = isDark ? '☀️' : '🌙';
            });

            const savedTheme = localStorage.getItem('theme') || 'light';
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark-mode');
                elements.themToggleBtn.textContent = '☀️';
            }
        }

        let searchTimeout;
        elements.searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => this.performSearch(query), 300);
            } else if (query.length === 0) {
                this.clearSearch();
                elements.searchDropdown.style.display = 'none';
            }
        });

        elements.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                clearTimeout(searchTimeout);
                this.performSearch(e.target.value.trim());
            }
        });
    }

    async performSearch(query) {
        const searchDropdown = document.getElementById('searchDropdown');
        const searchResults = document.getElementById('searchResults');
        
        if (!searchDropdown || !searchResults) return;
        
        searchResults.innerHTML = '<div class="search-loading">Buscando...</div>';
        searchDropdown.style.display = 'block';
        
        try {
            const data = await this.apiInstance.searchMixed(query);
            
            if (!data?.results?.length) {
                searchResults.innerHTML = '<div class="search-empty">Sin resultados</div>';
                return;
            }
            
            const users = data.results.filter(r => r.type === 'user').slice(0, 3);
            const notes = data.results.filter(r => r.type === 'note').slice(0, 3);
            
            searchResults.innerHTML = this.buildSearchResults(users, notes, query);
            
            if (users.length) this.loadAvatarsForUsers(users);
        } catch (err) {
            searchResults.innerHTML = `<div class="search-empty">Error: ${err.message}</div>`;
        }
    }

    buildSearchResults(users, notes, query) {
        let html = '';
        
        if (users.length) {
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
        
        if (notes.length) {
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
        
        if (users.length || notes.length) {
            html += `<a href="/search?q=${encodeURIComponent(query)}" class="search-item search-all">🔍 Ver todos los resultados</a>`;
        }
        
        return html;
    }

    async loadAvatarsForUsers(users) {
        for (const user of users) {
            try {
                const profilePic = await this.apiInstance.getProfilePic(user.username);
                if (profilePic?.url) {
                    const img = document.querySelector(`.search-avatar[data-username="${user.username}"]`);
                    if (img) img.src = profilePic.url;
                }
            } catch (err) {
                console.error(`Error loading avatar for ${user.username}:`, err);
            }
        }
    }

    clearSearch() {
        console.log('Búsqueda limpiada');
    }

    renderUnauthenticated() {
        this.rightDiv.innerHTML = `
            <div class="header-search">
                <input type="text" placeholder="buscar..." disabled>
            </div>
            <a href="/login"><button class="btn btn-outline" style="padding: 8px 16px; font-size: 14px;">Ingresar</button></a>
            <a href="/register"><button class="btn btn-primary" style="padding: 8px 16px; font-size: 14px;">Registrarse</button></a>
        `;
    }
}

window.HeaderManager = HeaderManager;
