window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    
    if (!apiInstance.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const errorContainer = document.getElementById('errorContainer');
    let currentFilter = 'all';

    // Obtener parámetro de búsqueda de la URL si existe
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');

    // Inicializar header
    const headerManager = new HeaderManager(apiInstance);
    const navItems = [
        { href: '/profile', label: '👤 Mi perfil' },
        { href: '/friends', label: '👥 Amigos' }
    ];
    await headerManager.initialize(navItems);

    // Hacer que el buscador del header sea dinámico
    headerManager.performSearch = (query) => {
        searchInput.value = query;
        performSearch(query);
    };

    headerManager.clearSearch = () => {
        searchInput.value = '';
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-text">Escribe para buscar</div>
            </div>
        `;
        errorContainer.innerHTML = '';
    };

    // Si hay una búsqueda inicial, realizarla
    if (initialQuery) {
        searchInput.value = initialQuery;
        performSearch(initialQuery);
    }

    async function performSearch(query) {
        if (!query.trim()) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-text">Escribe para buscar</div>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = '<div class="loading">Buscando...</div>';
        errorContainer.innerHTML = '';

        try {
            const data = await apiInstance.searchMixed(query);

            if (!data || !data.results) {
                throw new Error('Error en la búsqueda');
            }

            // Separar usuarios y notas
            const users = data.results.filter(r => r.type === 'user');
            const notes = data.results.filter(r => r.type === 'note');
            
            renderResults({ users, notes });

        } catch (err) {
            console.error('Search error:', err);
            errorContainer.innerHTML = `<div class="error-message">❌ ${err.message}</div>`;
            resultsContainer.innerHTML = '';
        }
    }

    function renderResults(results) {
        const { users = [], notes = [] } = results;
        let filteredUsers = users;
        let filteredNotes = notes;

        if (currentFilter === 'users') {
            filteredNotes = [];
        } else if (currentFilter === 'notes') {
            filteredUsers = [];
        }

        if (filteredUsers.length === 0 && filteredNotes.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😢</div>
                    <div class="empty-text">Sin resultados</div>
                </div>
            `;
            return;
        }

        let html = '';

        if (filteredUsers.length > 0) {
            html += '<div class="results-title">👥 Usuarios</div>';
            html += '<div class="results-grid">';
            html += filteredUsers.map(user => `
                <div class="result-item" onclick="window.location.href='/profile?user=${user.username || user}'">
                    <img class="result-avatar" 
                         data-username="${user.username || user}"
                         src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user}" 
                         alt="${user.username || user}">
                    <div class="result-content">
                        <div class="result-title">@${user.username || user}</div>
                        <div class="result-meta">👤 Perfil de usuario</div>
                    </div>
                </div>
            `).join('');
            html += '</div>';
        }

        if (filteredNotes.length > 0) {
            html += '<div class="results-title">📝 Notas</div>';
            html += '<div class="results-grid">';
            html += filteredNotes.map(note => `
                <div class="result-item" onclick="window.location.href='/note?id=${note.id}'">
                    <div class="result-content">
                        <div class="note-badge">📌 Nota pública</div>
                        <div class="result-title">${note.title || 'Sin título'}</div>
                        <div class="result-meta">✍️ Por @${note.username || 'Anónimo'}</div>
                        <div class="result-preview">${note.content?.substring(0, 150) || 'Sin contenido'}${note.content?.length > 150 ? '...' : ''}</div>
                    </div>
                </div>
            `).join('');
            html += '</div>';
        }

        resultsContainer.innerHTML = html;
        
        // Cargar avatares Discord
        document.querySelectorAll('.result-avatar[data-username]').forEach(img => {
            loadAvatarForElement(img, img.dataset.username);
        });
    }

    async function loadAvatarForElement(element, username) {
        try {
            const profilePic = await apiInstance.getProfilePic(username);
            if (profilePic && profilePic.url) {
                element.src = profilePic.url;
            }
        } catch (err) {
            console.error(`Error loading avatar for ${username}:`, err);
        }
    }

    // Event listeners
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });

    // Debounced search as user types
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 300);
        } else if (query.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-text">Escribe para buscar</div>
                </div>
            `;
            errorContainer.innerHTML = '';
        }
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            performSearch(searchInput.value);
        });
    });
});
