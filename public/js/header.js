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
            <div class="header-search">
                <input type="text" id="globalSearch" placeholder="Buscar notas..." autocomplete="off">
            </div>
        `;

        // Agregar items de navegación
        navItems.forEach(item => {
            headerHTML += `<a href="${item.href}"><span style="cursor: pointer; color: var(--secondary-color); font-weight: 600;">${item.label}</span></a>`;
        });

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
        });

        // Logout
        logoutBtn.addEventListener('click', () => {
            this.apiInstance.logout();
        });

        // Búsqueda integrada - buscar en la página actual
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                this.performSearch(e.target.value);
            }
        });
    }

    /**
     * Realizar búsqueda integrada
     * Este método debe ser sobrescrito en cada página para implementar lógica específica
     */
    performSearch(query) {
        // Método base: redirigir a búsqueda global (si no está sobrescrito)
        // Las páginas individuales pueden sobrescribir esto
        console.log('Búsqueda:', query);
    }

    renderUnauthenticated() {
        const headerHTML = `
            <div class="header-search">
                <input type="text" placeholder="Buscar notas..." disabled>
            </div>
            <a href="/login"><button class="btn btn-outline" style="padding: 8px 16px; font-size: 14px;">Ingresar</button></a>
            <a href="/register"><button class="btn btn-primary" style="padding: 8px 16px; font-size: 14px;">Registrarse</button></a>
        `;
        this.rightDiv.innerHTML = headerHTML;
    }
}

// Exportar para uso global
window.HeaderManager = HeaderManager;
