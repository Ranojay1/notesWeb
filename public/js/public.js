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
            <a class="btn btn-selected">Notas públicas</a>
        `;
        if(auth) {
            rightDiv.innerHTML = `
                <span>Bienvenido, ${apiInstance.user}</span>
                <a href="/createNote"><button class="btn btn-primary">Crear nota</button></a>
                <button id="logoutBtn">Logout</button>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => {
                apiInstance.logout();
            });
            document.getElementById('sidebar').innerHTML += `
                <a href="/friendNotes"><button class="btn btn-outline">Notas de amigos</button></a>
                <a href="/myNotes"><button class="btn btn-outline">Mis notas</button></a>
            `;
        } else {
            rightDiv.innerHTML = `
                <a href="/login"><button class="btn btn-outline btn-login">Iniciar sesión</button></a>
                <a href="/register"><button class="btn btn-outline btn-register">Registrarse</button></a>
            `;
            document.getElementById('sidebar').innerHTML += `
                <a>Iniciar sesión para más opciones</a>
                <a href="/login"><button class="btn btn-outline btn-login">Iniciar sesión</button></a>
                <a href="/register"><button class="btn btn-outline btn-register">Registrarse</button></a>
            `;
        }
        //cargar notas de seguidores

        const followerNotes = await apiInstance.getFollowerNotes();
        console.log(followerNotes)
        for(const note of followerNotes) {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-card';
            noteDiv.innerHTML = `
                <div class="note-header">
                    <h3 class="note-title">${note.title}</h3>
                    <span class="note-meta">
                        <span class="note-author" style="color:${note.username === apiInstance.user ? '#4f8cff' : await apiInstance.areFriends(note.username) ? '#4caf50' : await apiInstance.isFollowing(note.username) ? '#ff9800' : '#757575'};font-weight:600;">
                            ${note.username === apiInstance.user ? 'Tú' : note.username}
                        </span>
                        <span class="privacy-badge privacy-follower">Seguidores</span>
                    </span>
                </div>
                <div class="note-content">${note.content.substring(0, 100)}...</div>
                <div class="note-actions">
                    <a href="/note?note=${note.id}" class="btn btn-outline">Leer más</a>
                </div>
            `;
            notes_site.appendChild(noteDiv);
        }



        // cargar notas públicas (paginado)
        let publicOffset = 0;
        const PUBLIC_LIMIT = 20;

        async function loadPublicPage() {
            const publicNotes = await apiInstance.getPublicNotes(undefined, PUBLIC_LIMIT, publicOffset) || [];
            for (const note of publicNotes) {
                const noteDiv = document.createElement('div');
                noteDiv.className = 'note-card';
                noteDiv.innerHTML = `
                    <div class="note-header">
                        <h3 class="note-title">${note.title}</h3>
                        <span class="note-meta">
                            <span class="note-author" style="color:${note.username === apiInstance.user ? '#4f8cff' : await apiInstance.areFriends(note.username) ? '#4caf50' : await apiInstance.isFollowing(note.username) ? '#ff9800' : '#757575'};font-weight:600;">
                                ${note.username === apiInstance.user ? 'Tú' : note.username}
                            </span>
                            <span class="privacy-badge privacy-public">Pública</span>
                        </span>
                    </div>
                    <div class="note-content">${note.content.substring(0, 100)}...</div>
                    <div class="note-actions">
                        <a href="/note?note=${note.id}" class="btn btn-outline">Leer más</a>
                    </div>
                `;
                notes_site.appendChild(noteDiv);
            }

            // si recibimos exactamente el límite, podemos mostrar botón ver más
            if (publicNotes.length === PUBLIC_LIMIT) {
                let moreBtn = document.getElementById('public-more-btn');
                if (!moreBtn) {
                    moreBtn = document.createElement('button');
                    moreBtn.id = 'public-more-btn';
                    moreBtn.className = 'btn btn-outline';
                    moreBtn.textContent = 'Ver más';
                    moreBtn.addEventListener('click', async () => {
                        // quitar el botón mientras cargamos la siguiente página
                        moreBtn.remove();
                        publicOffset += PUBLIC_LIMIT;
                        await loadPublicPage();
                    });
                    notes_site.appendChild(moreBtn);
                }
            }
        }

        await loadPublicPage();
    })();
});
