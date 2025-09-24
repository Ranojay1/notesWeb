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
        if(!auth) return window.location.href = '/login';
        rightDiv.innerHTML = `
            <span>Bienvenido, ${apiInstance.user}</span>
            <button id="logoutBtn">Logout</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', () => {
            apiInstance.logout();
        });
        const wrapper = document.createElement('div');
        wrapper.className = 'create-note-wrapper';
        wrapper.innerHTML = `
            <div class="create-note-card">
                <div class="note-header">
                    <h3 class="note-title">Crear nueva nota</h3>
                </div>
                <div class="note-content">
                    <form id="createNoteForm">
                        <div class="form-group">
                            <label for="noteTitle">Título</label>
                            <input type="text" id="noteTitle" name="title" class="form-control" required maxlength="100">
                        </div>
                        <div class="form-group">
                            <label for="noteContent">Contenido</label>
                            <textarea id="noteContent" name="content" class="form-control" required maxlength="1000"></textarea>
                            <div class="hint">Máx. 1000 caracteres</div>
                        </div>
                        <div class="form-group">
                            <label for="notePrivacy">Privacidad</label>
                            <select id="notePrivacy" name="privacy" class="form-control" required>
                                <option value="public">Pública</option>
                                <option value="followers">Seguidores</option>
                                <option value="private">Privada</option>
                            </select>
                        </div>
                        <div class="create-note-actions">
                            <a href="/myNotes" class="btn btn-outline">Cancelar</a>
                            <button type="submit" class="btn btn-primary">Crear Nota</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        notes_site.appendChild(wrapper);
        document.getElementById('createNoteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('noteTitle').value.trim();
            const content = document.getElementById('noteContent').value.trim();
            const privacy = document.getElementById('notePrivacy').value;
            if(!title || !content || !privacy) return alert('Por favor, completa todos los campos.');
            try {
                const newNote = await apiInstance.createNote({ title, content, privacy });
                // backend puede devolver { id } o texto "Created" o { success: true }
                if (newNote && (newNote.id || newNote.note_id)) {
                    const id = newNote.id || newNote.note_id;
                    window.location.href = `/note?note=${id}`;
                    return;
                }
                if (newNote && (newNote.success === true || newNote === 'Created' || newNote.message === 'Created')) {
                    // redirigir a mis notas como fallback
                    window.location.href = `/myNotes`;
                    return;
                }
                alert('Error al crear la nota. Inténtalo de nuevo.');
            } catch (error) {
                console.error('Error creating note:', error);
                alert('Error al crear la nota. Inténtalo de nuevo.');
            }
        });

    // foco en el título para una mejor UX
    const titleInput = document.getElementById('noteTitle');
    if (titleInput) titleInput.focus();




    })();
});
