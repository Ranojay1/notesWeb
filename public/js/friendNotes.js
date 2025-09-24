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
            <a class="btn btn-selected">Notas de amigos</a>
            <a href="/myNotes"><button class="btn btn-outline">Mis notas</button></a>
        `;
        if(!auth) return window.location.href = '/login';
        rightDiv.innerHTML = `
            <span>Bienvenido, ${apiInstance.user}</span>
            <a href="/createNote"><button class="btn btn-primary">Crear nota</button></a>
            <button id="logoutBtn">Logout</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', () => {
            apiInstance.logout();
        });

        // cargar notas de amigos (paginado)
        let friendsOffset = 0;
        const FRIENDS_LIMIT = 20;

        async function loadFriendsPage() {
            const rawNotes = await apiInstance.getFriendNotes(FRIENDS_LIMIT, friendsOffset);
            // Normalizar distintos formatos de respuesta:
            let publicNotes = [];
            if (!rawNotes) publicNotes = [];
            else if (Array.isArray(rawNotes)) publicNotes = rawNotes;
            else if (typeof rawNotes === 'object') {
                for (const key of Object.keys(rawNotes)) {
                    const group = rawNotes[key];
                    if (Array.isArray(group)) publicNotes.push(...group);
                }
            }

            if(!publicNotes || publicNotes.length === 0) {
                if (friendsOffset === 0) {
                    const noNotesDiv = document.createElement('div');
                    noNotesDiv.className = 'no-notes';
                    noNotesDiv.innerHTML = `
                        <p>No hay notas de amigos disponibles. Sigue a otros usuarios para ver sus notas aquí.</p>
                    `;
                    notes_site.appendChild(noNotesDiv);
                }
                return;
            }
            for(const note of publicNotes) {
        console.log(note.privacy)
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-card';
            noteDiv.innerHTML = `
                <div class="note-header">
                    <h3 class="note-title">${note.title}</h3>
                    <span class="note-meta">
                        <span class="note-author" style="color:${note.username === apiInstance.user ? '#4f8cff' : await apiInstance.areFriends(note.username) ? '#4caf50' : await apiInstance.isFollowing(note.username) ? '#ff9800' : '#757575'};font-weight:600;">
                            ${note.username === apiInstance.user ? 'Tú' : note.username}
                        </span>
                        <span class="privacy-badge privacy-friends">Amigos</span>
                    </span>
                </div>
                <div class="note-content">${note.content.substring(0, 100)}...</div>
                <div class="note-actions">
                    <a href="/note?note=${note.id}" class="btn btn-outline">Leer más</a>
                </div>
            `;
            notes_site.appendChild(noteDiv);
            }
            if (publicNotes.length === FRIENDS_LIMIT) {
                let moreBtn = document.getElementById('friends-more-btn');
                if (!moreBtn) {
                    moreBtn = document.createElement('button');
                    moreBtn.id = 'friends-more-btn';
                    moreBtn.className = 'btn btn-outline';
                    moreBtn.textContent = 'Ver más';
                    moreBtn.addEventListener('click', async () => {
                        // quitar el botón mientras cargamos la siguiente página
                        moreBtn.remove();
                        friendsOffset += FRIENDS_LIMIT;
                        await loadFriendsPage();
                    });
                    notes_site.appendChild(moreBtn);
                }
            }
        }

        await loadFriendsPage();
    })();
});
