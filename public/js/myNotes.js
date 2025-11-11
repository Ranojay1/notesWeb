window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    
    if(!apiInstance.isAuthenticated()) {
        return window.location.href = '/login';
    }

    // Inicializar header
    const headerManager = new HeaderManager(apiInstance);
    
    const notesContainer = document.getElementById('notesContainer');
    const errorContainer = document.getElementById('errorContainer');
    const privacyContainer = document.getElementById('privacyContainer');
    
    // Renderizar selector de privacidad
    const privacyManager = new PrivacyManager('private');
    privacyContainer.innerHTML = privacyManager.render();
    
    // Variable para almacenar todas las notas
    let allNotes = [];
    let currentSort = 'recent';

    // Función de filtrado de notas
    function filterNotes(query) {
        const normalizedQuery = query.toLowerCase();
        const noteCards = document.querySelectorAll('.note-item');
        
        noteCards.forEach(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const content = card.querySelector('p')?.textContent.toLowerCase() || '';
            
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
        { href: '/friendNotes', label: '👥 Notas de amigos' },
        { href: '/public', label: '📖 Notas públicas' }
    ];
    await headerManager.initialize(navItems);

    // Cargar mis notas (paginado)
    let myOffset = 0;
    const MY_LIMIT = 20;

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
        }

        return sorted;
    }

    function renderNotes() {
        if (!allNotes || allNotes.length === 0) {
            notesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">No hay notas aún</div>
                    <p style="margin-top: 10px; color: #64748b;">Crea tu primera nota privada</p>
                </div>
            `;
            return;
        }

        const sorted = sortNotes();
        const notesHTML = sorted.map(note => `
            <div class="note-item" onclick="window.location.href='/note?id=${note.id}'">
                <h3 class="note-title">${note.title}</h3>
                <p>${(note.content || '').substring(0, 150)}...</p>
                <div class="note-meta">
                    <span>${new Date(note.created_at || note.date || Date.now()).toLocaleDateString('es-ES')}</span>
                    <span>${note.privacy === 'public' ? '🌍 Público' : note.privacy === 'friends' ? '👥 Amigos' : '🔒 Privado'}</span>
                </div>
            </div>
        `).join('');

        notesContainer.innerHTML = `<div class="notes-grid">${notesHTML}</div>`;
    }

    async function loadMyPage() {
        try {
            const rawNotes = await apiInstance.getMyNotes(MY_LIMIT, myOffset);
            let notes = [];
            if (!rawNotes) notes = [];
            else if (Array.isArray(rawNotes)) notes = rawNotes;
            else if (typeof rawNotes === 'object') {
                for (const key of Object.keys(rawNotes)) {
                    const group = rawNotes[key];
                    if (Array.isArray(group)) notes.push(...group);
                }
            }

            if(!notes || notes.length === 0) {
                if (myOffset === 0) {
                    renderNotes();
                }
                return;
            }
            
            // Almacenar notas para filtrado
            allNotes.push(...notes);
            
            if (myOffset === 0) {
                renderNotes();
            }
            
            if (notes.length === MY_LIMIT) {
                const moreBtn = document.createElement('button');
                moreBtn.className = 'btn btn-primary';
                moreBtn.style.marginTop = '20px';
                moreBtn.textContent = 'Ver más';
                moreBtn.addEventListener('click', async () => {
                    moreBtn.remove();
                    myOffset += MY_LIMIT;
                    await loadMyPage();
                });
                notesContainer.appendChild(moreBtn);
            }
        } catch (err) {
            console.error('Error loading notes:', err);
            errorContainer.innerHTML = `<div class="error-message">⚠️ ${err.message}</div>`;
        }
    }

    await loadMyPage();

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
