window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    const rightDiv = document.querySelector('.right');
    const notes_site = document.querySelector('.content');
    // Espera a que la sesión se cargue antes de mostrar el estado
    (async () => {
        if (typeof apiInstance.load === 'function') {
            await apiInstance.load();
        }
        const auth = apiInstance.isAuthenticated();
        document.getElementById('sidebar').innerHTML = `
            <a href="/public"><button class="btn btn-outline">Notas púiblicas</button></a>
            <a href="/friendNotes"><button class="btn btn-outline">Notas de amigos</button></a>
            <a class="btn btn-selected">Mis notas</a>
        `;
        if(!auth) return window.location.href = '/login';
        rightDiv.innerHTML = `
            <span>Bienvenido, ${apiInstance.user}</span>
            <button id="logoutBtn">Logout</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', () => {
            apiInstance.logout();
        });

        // cargar notas de amigos

        const rawNotes = await apiInstance.getMyNotes()

        // Normalizar distintos formatos de respuesta:
        // - Array de notas: [{ id, title, content, username }, ...]
        // - Objeto por usuario: { Raimundo: [...], Maria: [...] }
        let publicNotes = [];
        if (!rawNotes) publicNotes = [];
        else if (Array.isArray(rawNotes)) publicNotes = rawNotes;
        else if (typeof rawNotes === 'object') {
            // Recolecta todas las notas de cada usuario en un array plano
            for (const key of Object.keys(rawNotes)) {
                const group = rawNotes[key];
                if (Array.isArray(group)) publicNotes.push(...group);
            }
        }

        if(!publicNotes || publicNotes.length === 0) {
            const noNotesDiv = document.createElement('div');
            noNotesDiv.className = 'no-notes';
            noNotesDiv.innerHTML = `
                <p>No hay notas de amigos disponibles. Sigue a otros usuarios para ver sus notas aquí.</p>
            `;
            notes_site.appendChild(noNotesDiv);
            return;
        }
    for(const note of publicNotes) {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-card';
            noteDiv.innerHTML = `
                <div class="note-header">
                    <h3 class="note-title">${note.title}</h3>
                    <span class="note-meta">
                        <span class="note-author" style="color:#4f8cff;font-weight:600;">
                            Tú
                        </span>
                        <span class="privacy-badge ${note.privacy === 'public' ? 'privacy-public' : note.privacy === 'private' ? 'privacy-private' : note.privacy === 'friends' ? 'privacy-friends' : 'privacy-follower'}">${note.privacy === 'public' ? 'Público' : note.privacy === 'private' ? 'Privado' : note.privacy === 'friends' ? 'Amigos' : 'Seguidores'}</span>
                    </span>
                </div>
                <div class="note-content">${note.content.substring(0, 100)}...</div>
                <div class="note-actions">
                    <a href="/note?note=${note.id}" class="btn btn-outline">Leer más</a>
                </div>
            `;
            notes_site.appendChild(noteDiv);
        }
    })();
});
