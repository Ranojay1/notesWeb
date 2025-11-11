window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    
    if (!apiInstance.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    // Inicializar header
    const headerManager = new HeaderManager(apiInstance);

    const notesContainer = document.getElementById('notesContainer');
    const errorContainer = document.getElementById('errorContainer');
    const privacyContainer = document.getElementById('privacyContainer');
    let allNotes = [];
    let currentSort = 'recent';

    // Renderizar selector de privacidad
    const privacyManager = new PrivacyManager('friends');
    privacyContainer.innerHTML = privacyManager.render();

    // Función de filtrado
    function filterNotes(query) {
        const normalizedQuery = query.toLowerCase();
        const noteCards = document.querySelectorAll('.note-card');
        
        noteCards.forEach(card => {
            const title = card.querySelector('.note-title')?.textContent.toLowerCase() || '';
            const content = card.querySelector('.note-content')?.textContent.toLowerCase() || '';
            
            if (title.includes(normalizedQuery) || content.includes(normalizedQuery)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Personalizar búsqueda integrada
    headerManager.performSearch = (query) => {
        filterNotes(query);
    };

    const navItems = [
        { href: '/profile', label: '👤 Mi perfil' },
        { href: '/friends', label: '👥 Amigos' }
    ];
    await headerManager.initialize(navItems);

    async function loadFriendNotes() {
        try {
            const data = await apiInstance.getFriendNotesFromAPI(50, 0);
            // Normalizar si devuelve datos directos
            const normalized = data.success !== undefined ? data : { success: true, notes: data };

            if (!normalized.success && !normalized.notes) {
                throw new Error(normalized.error || 'Error al cargar notas');
            }

            // Aplanar la estructura de datos
            allNotes = [];
            if (normalized.notes && typeof normalized.notes === 'object') {
                Object.values(normalized.notes).forEach(noteList => {
                    if (Array.isArray(noteList)) {
                        allNotes.push(...noteList);
                    }
                });
            }

            renderNotes();

        } catch (err) {
            console.error('Error loading friend notes:', err);
            errorContainer.innerHTML = `<div class="error-message">⚠️ ${err.message}</div>`;
            notesContainer.innerHTML = '';
        }
    }

    function sortNotes() {
        let sorted = [...allNotes];

        switch (currentSort) {
            case 'recent':
                sorted.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.date || 0);
                    const dateB = new Date(b.created_at || b.date || 0);
                    return dateB - dateA;
                });
                break;
            case 'oldest':
                sorted.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.date || 0);
                    const dateB = new Date(b.created_at || b.date || 0);
                    return dateA - dateB;
                });
                break;
            case 'popular':
                sorted.sort((a, b) => {
                    const commentsA = a.comments || 0;
                    const commentsB = b.comments || 0;
                    return commentsB - commentsA;
                });
                break;
        }

        return sorted;
    }

    function renderNotes() {
        const sorted = sortNotes();

        if (sorted.length === 0) {
            notesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">No hay notas de amigos aún</div>
                    <p style="margin-top: 10px; color: #64748b;">Añade amigos para ver sus notas compartidas</p>
                </div>
            `;
            return;
        }

        notesContainer.innerHTML = `
            <div class="notes-grid">
                ${sorted.map(note => {
                    const date = new Date(note.created_at || note.date || Date.now());
                    const author = note.username || note.author || 'Anónimo';
                    
                    return `
                        <div class="note-card" onclick="window.location.href='/note?id=${note.id}'">
                            <div class="note-header">
                                <h3 class="note-title">${note.title || 'Sin título'}</h3>
                            </div>
                            <div class="note-meta">
                                <span class="note-author">
                                    <img class="author-avatar" 
                                         data-username="${author}"
                                         src="https://api.dicebear.com/7.x/avataaars/svg?seed=${author}" 
                                         alt="${author}">
                                    <span>${author}</span>
                                </span>
                                <span>${date.toLocaleDateString('es-ES')}</span>
                                <span>${note.comments || 0} comentarios</span>
                            </div>
                            <p class="note-content">${(note.content || '').substring(0, 150)}...</p>
                            <div class="note-footer">
                                <span>🔒 Compartida con amigos</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        // Cargar avatares Discord
        document.querySelectorAll('.author-avatar[data-username]').forEach(img => {
            loadAvatarForElement(img, img.dataset.username);
        });
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.getAttribute('data-sort');
            renderNotes();
        });
    });

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

    // Load notes
    await loadFriendNotes();
});
