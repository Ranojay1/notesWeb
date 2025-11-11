window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    
    const notesContainer = document.getElementById('notesContainer');
    const errorContainer = document.getElementById('errorContainer');
    const privacyContainer = document.getElementById('privacyContainer');

    // Renderizar selector de privacidad
    const privacyManager = new PrivacyManager('public');
    privacyContainer.innerHTML = privacyManager.render();
    
    const auth = apiInstance.isAuthenticated();
    let allNotes = [];
    let currentSort = 'recent';
    
    // Inicializar header si autenticado
    if (auth) {
        const headerManager = new HeaderManager(apiInstance);
        
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
        
        headerManager.performSearch = (query) => {
            filterNotes(query);
        };

        const navItems = [
            { href: '/friendNotes', label: '👥 Notas de amigos' },
            { href: '/myNotes', label: '🔒 Mis notas' }
        ];
        await headerManager.initialize(navItems);
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
    
    function getUserColor(username) {
        if (username === apiInstance.user) return '#4f8cff';
        return '#475569';
    }

    async function loadPublicNotes() {
        try {
            const notes = await apiInstance.getPublicNotes(undefined, 50, 0);
            const normalizedNotes = Array.isArray(notes) ? notes : (notes && notes.notes) ? notes.notes : [];
            
            if (!normalizedNotes || normalizedNotes.length === 0) {
                notesContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🌍</div>
                        <div class="empty-text">No hay notas públicas</div>
                        <p style="margin-top: 10px; color: #64748b;">Comparte tus notas públicamente</p>
                    </div>
                `;
                return;
            }

            allNotes = normalizedNotes;
            renderNotes();
        } catch (err) {
            console.error('Error loading public notes:', err);
            errorContainer.innerHTML = `<div class="error-message">⚠️ ${err.message}</div>`;
        }
    }

    function renderNotes() {
        if (!allNotes || allNotes.length === 0) {
            notesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🌍</div>
                    <div class="empty-text">No hay notas públicas</div>
                </div>
            `;
            return;
        }

        const sorted = sortNotes();

        const notesHTML = sorted.map(note => {
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
                </div>
            `;
        }).join('');

        notesContainer.innerHTML = `<div class="notes-grid">${notesHTML}</div>`;
        
        // Cargar avatares Discord
        document.querySelectorAll('.author-avatar[data-username]').forEach(img => {
            loadAvatarForElement(img, img.dataset.username);
        });
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

    await loadPublicNotes();
    
    // Event listeners para filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.getAttribute('data-sort');
            renderNotes();
        });
    });
});
