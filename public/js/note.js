window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    const noteContent = document.getElementById('noteContent');
    const loadingContainer = document.getElementById('loadingContainer');
    const errorContainer = document.getElementById('errorContainer');
    const successContainer = document.getElementById('successContainer');

    // Obtener ID de nota de URL
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('id') || params.get('note');
    
    if (!noteId) {
        window.location.href = '/';
        return;
    }

    // Inicializar header
    const headerManager = new HeaderManager(apiInstance);
    const navItems = [
        { href: '/profile', label: '👤 Mi perfil' },
        { href: '/friends', label: '👥 Amigos' }
    ];
    await headerManager.initialize(navItems);

    let note = null;
    let comments = [];

    async function loadNote() {
        try {
            const data = await apiInstance.getNoteWithDetails(noteId);
            // Normalizar si devuelve estructura directa
            const normalized = data && data.success !== undefined ? data : { success: true, data: data };
            if (!normalized || !normalized.success) {
                throw new Error(normalized?.error || 'Nota no encontrada');
            }

            note = normalized.note || normalized.data;
            if (!note) {
                throw new Error('No se pudo cargar la nota');
            }

            renderNote();
            await loadComments();

        } catch (err) {
            console.error('Error loading note:', err);
            loadingContainer.style.display = 'none';
            errorContainer.innerHTML = `<div class="error-message">⚠️ ${err.message}</div>`;
        }
    }

    function renderNote() {
        const date = new Date(note.created_at || note.date || Date.now());
        const author = note.username || 'Anónimo';
        const privacyMap = {
            'public': '🌐 Pública',
            'friends': '👥 Amigos',
            'private': '🔒 Privada'
        };

        document.getElementById('noteTitle').textContent = note.title || 'Sin título';
        document.getElementById('authorAvatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`;
        document.getElementById('authorAvatar').setAttribute('data-username', author);
        document.getElementById('authorName').textContent = author;
        document.getElementById('authorName').style.cursor = 'pointer';
        document.getElementById('authorName').addEventListener('click', () => {
            window.location.href = `/profile?user=${author}`;
        });
        document.getElementById('authorAvatar').addEventListener('click', () => {
            window.location.href = `/profile?user=${author}`;
        });
        document.getElementById('noteDatetime').textContent = date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
        document.getElementById('notePrivacy').textContent = privacyMap[note.privacy] || '🔒 Privada';
        document.getElementById('noteContentBody').textContent = note.content || '';

        loadingContainer.style.display = 'none';
        noteContent.style.display = 'block';
        
        // Cargar avatar Discord del autor
        const authorAvatar = document.getElementById('authorAvatar');
        if (authorAvatar.getAttribute('data-username')) {
            loadAvatarForElement(authorAvatar, author);
        }
    }

    async function loadComments() {
        try {
            const data = await apiInstance.getCommentsForNote(noteId);
            // Normalizar si devuelve estructura directa
            const normalized = Array.isArray(data) ? { success: true, comments: data } : data;
            if (normalized && normalized.success && normalized.comments) {
                comments = normalized.comments;
            }

            renderComments();

            // Mostrar/ocultar botón de agregar comentario
            if (apiInstance.isAuthenticated()) {
                document.getElementById('openCommentFormBtn').style.display = 'block';
            }

        } catch (err) {
            console.error('Error loading comments:', err);
        }
    }

    function renderComments() {
        const commentsList = document.getElementById('commentsList');
        document.getElementById('commentCount').textContent = comments.length;

        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="empty-comments">
                    <div class="empty-icon">💭</div>
                    <div>Sé el primero en comentar</div>
                </div>
            `;
            return;
        }

        commentsList.innerHTML = comments.map(comment => {
            const author = comment.username || 'Anónimo';
            
            return `
                <div class="comment-item">
                    <div class="comment-header">
                        <img class="comment-avatar" 
                             data-username="${author}"
                             src="https://api.dicebear.com/7.x/avataaars/svg?seed=${author}" 
                             alt="${author}"
                             onclick="window.location.href='/profile?user=${author}'">
                        <div class="comment-info">
                            <span class="comment-author" onclick="window.location.href='/profile?user=${author}'">${author}</span>
                        </div>
                    </div>
                    <div class="comment-text">${comment.content || comment.comment || comment.text || ''}</div>
                </div>
            `;
        }).join('');
        
        // Cargar avatares Discord de comentarios
        document.querySelectorAll('.comment-avatar[data-username]').forEach(img => {
            loadAvatarForElement(img, img.dataset.username);
        });
    }

    // Event listeners para comentarios
    document.getElementById('openCommentFormBtn').addEventListener('click', () => {
        document.getElementById('openCommentFormBtn').style.display = 'none';
        document.getElementById('commentFormContainer').style.display = 'block';
        document.getElementById('commentTextarea').focus();
    });

    document.getElementById('cancelCommentBtn').addEventListener('click', () => {
        document.getElementById('commentFormContainer').style.display = 'none';
        document.getElementById('openCommentFormBtn').style.display = 'block';
        document.getElementById('commentTextarea').value = '';
    });

    document.getElementById('submitCommentBtn').addEventListener('click', async () => {
        const text = document.getElementById('commentTextarea').value.trim();
        
        if (!text) {
            alert('Por favor escribe un comentario');
            return;
        }

        const btn = document.getElementById('submitCommentBtn');
        btn.disabled = true;
        btn.textContent = 'Enviando...';

        try {
            const data = await apiInstance.addCommentToNote(noteId, text);

            if (!data.success) {
                throw new Error(data.error || 'Error al enviar comentario');
            }

            // Agregar comentario a la lista
            comments.unshift({
                username: apiInstance.user,
                comment: text,
                created_at: new Date().toISOString(),
                likes: 0
            });

            renderComments();
            document.getElementById('commentTextarea').value = '';
            document.getElementById('commentFormContainer').style.display = 'none';
            document.getElementById('openCommentFormBtn').style.display = 'block';

            // Mostrar mensaje de éxito
            successContainer.innerHTML = '<div class="success-message">✅ Comentario enviado</div>';
            setTimeout(() => {
                successContainer.innerHTML = '';
            }, 3000);

        } catch (err) {
            console.error('Error sending comment:', err);
            errorContainer.innerHTML = `<div class="error-message">⚠️ ${err.message}</div>`;
        } finally {
            btn.disabled = false;
            btn.textContent = 'Enviar comentario';
        }
    });

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

    // Cargar nota
    await loadNote();
});
