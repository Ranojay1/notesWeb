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
        const mainDiv = document.createElement('div');
        mainDiv.className = 'note-card';
        mainDiv.innerHTML = `
            <div class="note-header">
                <h3 class="note-title">Crear nueva nota</h3>
            </div>
            <div class="note-content">
                <form id="createNoteForm">
                    <label for="noteTitle">Título:</label>
                    <input type="text" id="noteTitle" name="title" required maxlength="100">
                    
                    <label for="noteContent">Contenido:</label>
                    <textarea id="noteContent" name="content" required maxlength="1000"></textarea>
                    
                    <label for="notePrivacy">Privacidad:</label>
                    <select id="notePrivacy" name="privacy" required>
                        <option value="public">Pública</option>
                        <option value="followers">Seguidores</option>
                        <option value="private">Privada</option>
                    </select>
                    
                    <button type="submit" class="btn btn-primary">Crear Nota</button>
                </form>
            </div>
        `;
        notes_site.appendChild(mainDiv);
        document.getElementById('createNoteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('noteTitle').value.trim();
            const content = document.getElementById('noteContent').value.trim();
            const privacy = document.getElementById('notePrivacy').value;
            if(!title || !content || !privacy) return alert('Por favor, completa todos los campos.');
            try {
                const newNote = await apiInstance.createNote({ title, content, privacy });
                if(newNote) {
                    window.location.href = `/myNotes`;
                } else {
                    alert('Error al crear la nota. Inténtalo de nuevo.');
                }
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
