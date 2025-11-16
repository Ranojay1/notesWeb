window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();

    if (!apiInstance.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    // Inicializar header
    const headerManager = new HeaderManager(apiInstance);
    await headerManager.initialize();

    // Cargar estadísticas
    async function loadStats() {
        try {
            // Notas
            const notesData = await apiInstance.getMyNotes(100, 0);
            const notesCount = Array.isArray(notesData) ? notesData.length : (notesData.notes?.length || 0);
            document.getElementById('notesCount').textContent = notesCount;

            // Mostrar últimas notas
            if (notesCount > 0) {
                const recentNotes = (Array.isArray(notesData) ? notesData : notesData.notes || []).slice(0, 5);
                const container = document.getElementById('recentNotesContainer');
                container.innerHTML = '';
                
                recentNotes.forEach(note => {
                    const noteEl = document.createElement('div');
                    noteEl.className = 'note-item';
                    noteEl.onclick = () => window.location.href = `/note?note=${note.id}`;
                    
                    const created = new Date(note.created_at).toLocaleDateString('es-ES');
                    noteEl.innerHTML = `
                        <div class="note-item-title">${note.title || 'Sin título'}</div>
                        <div class="note-item-preview">${note.content?.substring(0, 100) || 'Sin contenido'}...</div>
                        <div class="note-item-meta">📅 ${created}</div>
                    `;
                    container.appendChild(noteEl);
                });
            }

            // Amigos
            const friendsData = await apiInstance.getFriendsFromAPI();
            const friendsCount = Array.isArray(friendsData) ? friendsData.length : (friendsData.friends?.length || 0);
            document.getElementById('friendsCount').textContent = friendsCount;

            // Seguidores
            const followersData = await apiInstance.getFollowers();
            const followersCount = Array.isArray(followersData) ? followersData.length : (followersData.followers?.length || 0);
            document.getElementById('followersCount').textContent = followersCount;

            // Solicitudes de amistad
            const requestsData = await apiInstance.getFriendRequests();
            const requestsCount = Array.isArray(requestsData) ? requestsData.length : (requestsData.requests?.length || 0);
            document.getElementById('requestsCount').textContent = requestsCount;

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    await loadStats();
});
