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

        // cargar comentarios

        const rawComments = note.privacy === 'public' ? await apiInstance.getPublicComments(noteId) : [];

        const escapeHtml = (str = '') => String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const comments = (rawComments || []).map(c => ({
            id: c.id ?? c.comment_id ?? c.note_id ?? null,
            username: c.username ?? c.user ?? String(c.user_id ?? 'usuario'),
            content: c.content ?? c.comment ?? ''
        }));

        const commentsDiv = document.createElement('div');
        commentsDiv.className = 'comments-section';

            if (comments.length === 0) {
            commentsDiv.innerHTML = `
                <h3>Comentarios</h3>
                <div class="comments-list"><p>No hay comentarios aún.</p></div>
                ${auth ? `
                    <div class="add-comment">
                        <h4>Añadir un comentario</h4>
                        <textarea id="commentContent" placeholder="Escribe tu comentario aquí..."></textarea>
                        <button id="submitComment" class="btn btn-primary">Enviar</button>
                    </div>` : '<p><a href="/login">Inicia sesión</a> para añadir un comentario.</p>'}
            `;
            noteDiv.appendChild(commentsDiv);
        } else {
            const rows = await Promise.all(comments.map(async comment => {
                const isAuthor = comment.username === apiInstance.user;
                let isFriend = false;
                try { isFriend = await apiInstance.areFriends(comment.username); } catch (e) { /* ignore */ }
                const color = isAuthor ? '#4f8cff' : (isFriend ? '#4caf50' : '#757575');
                const authorLabel = isAuthor ? 'Tú' : escapeHtml(comment.username);
                return `
                    <div class="comment-card">
                        <span class="comment-author" style="color:${color};font-weight:600;">
                            ${authorLabel}
                        </span>
                        <p class="comment-content">${escapeHtml(comment.content)}</p>
                    </div>
                `;
            }));

            commentsDiv.innerHTML = `
                <h3>Comentarios</h3>
                <div class="comments-list">
                    ${rows.join('')}
                </div>
                ${auth ? `
                <div class="add-comment">
                    <h4>Añadir un comentario</h4>
                    <textarea id="commentContent" placeholder="Escribe tu comentario aquí..."></textarea>
                    <button id="submitComment" class="btn btn-primary">Enviar</button>
                </div>
                ` : '<p><a href="/login">Inicia sesión</a> para añadir un comentario.</p>'}
            `;
            noteDiv.appendChild(commentsDiv);
        }

        if (auth) {
            const submitBtn = commentsDiv.querySelector('#submitComment');
            const textarea = commentsDiv.querySelector('#commentContent');
            if (submitBtn && textarea) {
                submitBtn.addEventListener('click', async () => {
                    const content = textarea.value.trim();
                    if (!content) return;
                    try {
                        submitBtn.disabled = true;
                        // if apiInstance has sendComment, use it. Fallback: reload.
                        if (typeof apiInstance.sendComment === 'function') {
                            await apiInstance.sendComment(noteId, content);
                            // re-fetch comments and re-render simple approach: reload page
                            window.location.reload();
                        } else {
                            window.location.reload();
                        }
                    } catch (e) {
                        console.error('Error enviando comentario', e);
                        submitBtn.disabled = false;
                    }
                });
            }
        }
        
    })();
});
