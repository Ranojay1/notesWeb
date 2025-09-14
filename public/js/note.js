window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    const rightDiv = document.querySelector('.right');
    const notes_site = document.querySelector('.content');
    // Espera a que la sesión se cargue antes de mostrar el estado
    const urlParam = new URLSearchParams(window.location.search);
    const noteId = urlParam.get('note');
    if(!noteId) return window.location.href = '/';
    (async () => {
        if (typeof apiInstance.load === 'function') {
            await apiInstance.load();
        }
        const auth = apiInstance.isAuthenticated();
        if(auth) {
            rightDiv.innerHTML = `
                <span>Bienvenido, ${apiInstance.user}</span>
                <button id="logoutBtn" class="btn-logout">Logout</button>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => {
                apiInstance.logout();
            });
        } else {
            rightDiv.innerHTML = `
                <a href="/login"><button class="btn btn-outline btn-login">Iniciar sesión</button></a>
                <a href="/register"><button class="btn btn-outline btn-register">Registrarse</button></a>
            `;
        }
        let note;
        note = (await apiInstance.getPublicNotes(noteId))[0];
        if(!note) note = (await apiInstance.getFollowerNotes(noteId))[0];
        if(!note) note = (await apiInstance.getMyNotes(noteId))[0];
        if(!note) return window.location.href = '/';
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-card';
        noteDiv.innerHTML = `
            <div class="note-header">
                <h3 class="note-title">${note.title}</h3>
                
                <span class="note-meta">
                    <span class="note-author" style="color:${note.username === apiInstance.user ? '#4f8cff' : await apiInstance.areFriends(note.username) ? '#4caf50' : '#757575'};font-weight:600;">
                        ${note.username === apiInstance.user ? 'Tú' : note.username}
                    </span>
                    ${note.privacy === 'public' ? '<span class="privacy-badge privacy-public">Pública</span>' : note.privacy === 'followers' ? '<span class="privacy-badge privacy-follower">Privada</span>' : note.privacy === 'friends' ? '<span class="privacy-badge privacy-friends">Amigos</span>' : '<span class="privacy-badge privacy-private">Privada</span>'}
                </span>
            </div>
            <div class="note-content">${note.content}</div>
        `;
        notes_site.appendChild(noteDiv);
        
    })();
});
